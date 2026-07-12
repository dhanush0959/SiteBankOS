import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend, type CreateEmailResponseSuccess } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import type { AppEnv } from '../common/config/env.validation';
import { newLeadTemplate } from './templates/new-lead.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { subscriptionReceiptTemplate } from './templates/subscription-receipt.template';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { welcomeTemplate } from './templates/welcome.template';
import { agencyInviteTemplate } from './templates/agency-invite.template';
import type { EmailJobData, WhatsAppJobData } from './notification-types';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id?: string;
  skipped?: boolean;
}

export interface SendWhatsAppOptions {
  to: string;
  body: string;
  templateName?: string;
  templateParams?: string[];
}

export interface SendWhatsAppResult {
  id?: string;
  skipped?: boolean;
}

interface WhatsAppSuccessResponse {
  messages?: Array<{ id: string }>;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService<AppEnv, true>,
    private readonly prisma: PrismaService,
  ) {}

  private get featureEmail(): boolean {
    return this.config.get('FEATURE_EMAIL', { infer: true });
  }

  private get featureWhatsApp(): boolean {
    return this.config.get('FEATURE_WHATSAPP', { infer: true });
  }

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  private getResendClient(): Resend | null {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    if (!apiKey) return null;
    return new Resend(apiKey);
  }

  async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.featureEmail) {
      this.logger.log(`[FEATURE_EMAIL=off] Skipping email to ${JSON.stringify(opts.to)} - subject: ${opts.subject}`);
      return { skipped: true };
    }

    const resend = this.getResendClient();
    if (!resend) {
      this.logger.warn('RESEND_API_KEY not set - skipping email send');
      return { skipped: true };
    }

    const from = this.config.get('EMAIL_FROM', { infer: true });

    try {
      const result = await resend.emails.send({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      });

      const data: CreateEmailResponseSuccess | null = result.data;
      const id = data?.id;
      this.logger.log(`Email sent - id: ${id ?? 'unknown'} to: ${JSON.stringify(opts.to)}`);
      return { id };
    } catch (err) {
      this.logger.error('Failed to send email via Resend', err);
      return { skipped: true };
    }
  }

  async emailWelcome(user: { name: string; email: string }): Promise<void> {
    const tpl = welcomeTemplate({ name: user.name, frontendUrl: this.frontendUrl });
    await this.sendEmail({ to: user.email, ...tpl });
  }

  async emailVerifyAddress(user: { name: string; email: string }, verifyUrl: string): Promise<void> {
    const tpl = verifyEmailTemplate({ name: user.name, verifyUrl, frontendUrl: this.frontendUrl });
    await this.sendEmail({ to: user.email, ...tpl });
  }

  async emailPasswordReset(user: { name: string; email: string }, resetUrl: string): Promise<void> {
    const tpl = passwordResetTemplate({ name: user.name, resetUrl, frontendUrl: this.frontendUrl });
    await this.sendEmail({ to: user.email, ...tpl });
  }

  async emailNewLead(
    agent: { name: string; email: string },
    lead: { name?: string; phone?: string; propertyTitle: string },
  ): Promise<void> {
    const tpl = newLeadTemplate({
      agentName: agent.name,
      leadName: lead.name,
      leadPhone: lead.phone,
      propertyTitle: lead.propertyTitle,
      frontendUrl: this.frontendUrl,
    });
    await this.sendEmail({ to: agent.email, ...tpl });
  }

  async emailAgencyInvite(opts: {
    to: string;
    agencyName: string;
    ownerName: string;
    inviteUrl: string;
  }): Promise<void> {
    const tpl = agencyInviteTemplate({
      agencyName: opts.agencyName,
      ownerName: opts.ownerName,
      inviteUrl: opts.inviteUrl,
      frontendUrl: this.frontendUrl,
    });
    await this.sendEmail({ to: opts.to, ...tpl });
  }

  async emailSubscriptionReceipt(
    user: { name: string; email: string },
    plan: string,
    amountInr: number,
    paymentRef: string,
  ): Promise<void> {
    const tpl = subscriptionReceiptTemplate({
      name: user.name,
      plan,
      amountInr,
      paymentRef,
      frontendUrl: this.frontendUrl,
    });
    await this.sendEmail({ to: user.email, ...tpl });
  }

  async sendWhatsApp(opts: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    if (!this.featureWhatsApp) {
      this.logger.log(`[FEATURE_WHATSAPP=off] Skipping WhatsApp to ${opts.to}`);
      return { skipped: true };
    }

    const token = this.config.get('WHATSAPP_TOKEN', { infer: true });
    const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID', { infer: true });

    if (!token || !phoneNumberId) {
      this.logger.warn('WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set - skipping WhatsApp send');
      return { skipped: true };
    }

    const e164 = toE164(opts.to);
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    let body: Record<string, unknown>;

    if (opts.templateName) {
      const components: Array<Record<string, unknown>> = opts.templateParams?.length
        ? [
            {
              type: 'body',
              parameters: opts.templateParams.map((text) => ({ type: 'text', text })),
            },
          ]
        : [];

      body = {
        messaging_product: 'whatsapp',
        to: e164,
        type: 'template',
        template: {
          name: opts.templateName,
          language: { code: 'en' },
          components,
        },
      };
    } else {
      body = {
        messaging_product: 'whatsapp',
        to: e164,
        type: 'text',
        text: { body: opts.body },
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.error(`WhatsApp send failed - status: ${response.status} body: ${errorText}`);
        await this.prisma.whatsAppMessage.create({
          data: {
            toPhone: e164,
            body: opts.body,
            templateName: opts.templateName,
            status: 'FAILED',
            errorCode: response.status,
            errorMessage: errorText.slice(0, 500),
          },
        }).catch(() => {});
        throw new InternalServerErrorException('WhatsApp send failed');
      }

      const data = (await response.json()) as WhatsAppSuccessResponse;
      const id = data.messages?.[0]?.id;
      await this.prisma.whatsAppMessage.create({
        data: {
          toPhone: e164,
          body: opts.body,
          templateName: opts.templateName,
          wamid: id,
          status: 'SENT',
        },
      }).catch(() => {});
      this.logger.log(`WhatsApp sent - id: ${id ?? 'unknown'} to: ${e164}`);
      return { id };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.logger.error('WhatsApp request error', err);
      await this.prisma.whatsAppMessage.create({
        data: {
          toPhone: e164,
          body: opts.body,
          templateName: opts.templateName,
          status: 'FAILED',
          errorMessage: (err instanceof Error ? err.message : String(err)).slice(0, 500),
        },
      }).catch(() => {});
      throw new InternalServerErrorException('WhatsApp send failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  async whatsappNewLead(
    agentPhone: string,
    lead: { name?: string; phone?: string; propertyTitle: string },
  ): Promise<void> {
    const parts: string[] = [`New lead for "${lead.propertyTitle}"`];
    if (lead.name) parts.push(`Name: ${lead.name}`);
    if (lead.phone) parts.push(`Phone: ${lead.phone}`);

    const messageBody = parts.join('\n');

    await this.sendWhatsApp({ to: agentPhone, body: messageBody }).catch((err: unknown) => {
      this.logger.error('whatsappNewLead failed', err);
    });
  }

  async enqueueEmail(opts: EmailJobData & { delayMs?: number }): Promise<void> {
    if (opts.delayMs && opts.delayMs > 0) {
      setTimeout(() => {
        void this.sendEmail(opts).catch((err: unknown) => {
          this.logger.error('Deferred email send failed', err);
        });
      }, opts.delayMs);
      this.logger.log(`Scheduled email to ${JSON.stringify(opts.to)} - subject: ${opts.subject}`);
      return;
    }

    await this.sendEmail(opts);
    this.logger.log(`Sent email inline to ${JSON.stringify(opts.to)} - subject: ${opts.subject}`);
  }

  async enqueueWhatsApp(opts: WhatsAppJobData & { delayMs?: number }): Promise<void> {
    if (opts.delayMs && opts.delayMs > 0) {
      setTimeout(() => {
        void this.sendWhatsApp(opts).catch((err: unknown) => {
          this.logger.error('Deferred WhatsApp send failed', err);
        });
      }, opts.delayMs);
      this.logger.log(`Scheduled WhatsApp to ${opts.to}`);
      return;
    }

    await this.sendWhatsApp(opts);
    this.logger.log(`Sent WhatsApp inline to ${opts.to}`);
  }

  async enqueueEmailWelcome(user: { name: string; email: string }, delayMs?: number): Promise<void> {
    const { subject, html } = welcomeTemplate({ name: user.name, frontendUrl: this.frontendUrl });
    await this.enqueueEmail({ to: user.email, subject, html, delayMs });
  }

  async enqueueEmailNewLead(
    agent: { name: string; email: string },
    lead: { name?: string; phone?: string; propertyTitle: string },
    delayMs?: number,
  ): Promise<void> {
    const { subject, html } = newLeadTemplate({
      agentName: agent.name,
      leadName: lead.name,
      leadPhone: lead.phone,
      propertyTitle: lead.propertyTitle,
      frontendUrl: this.frontendUrl,
    });
    await this.enqueueEmail({ to: agent.email, subject, html, delayMs });
  }
}
