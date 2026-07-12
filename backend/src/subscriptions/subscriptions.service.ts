import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CheckoutDto } from './dto/checkout.dto';
import type { VerifyPaymentDto } from './dto/verify-payment.dto';

// Razorpay SDK types (minimal surface we use)
interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

interface RazorpayInstance {
  orders: {
    create(opts: RazorpayOrderOptions): Promise<RazorpayOrder>;
  };
}

type LimitKey = 'properties' | 'photosPerProperty' | 'thumbnailsPerMonth' | 'teamMembers';

const PLAN_PERIOD_DAYS = 30;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private razorpay: RazorpayInstance | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {
    const featurePayments = this.config.get<string>('FEATURE_PAYMENTS');
    if (featurePayments === 'true') {
      // Lazily initialise only when the flag is enabled
      const keyId = this.config.getOrThrow<string>('RAZORPAY_KEY_ID');
      const keySecret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
      // We use require here to keep the import conditional on the feature flag.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const RazorpayCtor = require('razorpay') as {
        default: new (opts: { key_id: string; key_secret: string }) => RazorpayInstance;
      };
      const Razorpay = RazorpayCtor.default ?? (RazorpayCtor as unknown as new (opts: { key_id: string; key_secret: string }) => RazorpayInstance);
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      this.logger.log('Razorpay client initialised (FEATURE_PAYMENTS=true)');
    } else {
      this.logger.log('Razorpay disabled — running in stub mode (FEATURE_PAYMENTS != true)');
    }
  }

  // ─── Public ──────────────────────────────────────────────────────────────

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        priceInr: true,
        limits: true,
        features: true,
      },
      orderBy: { priceInr: 'asc' },
    });
  }

  // ─── Authenticated ───────────────────────────────────────────────────────

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        plan: 'Free',
        status: 'TRIAL',
        startDate: null,
        endDate: null,
        paymentProvider: null,
        paymentReference: null,
      };
    }

    return subscription;
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: dto.planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Fetch user details for checkout prefill
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    const featurePayments = this.config.get<string>('FEATURE_PAYMENTS');

    // ── Stub mode ────────────────────────────────────────────────────────
    if (featurePayments !== 'true') {
      await this.upsertActiveSubscription(userId, dto.planId, 'stub');
      return {
        success: true,
        planId: dto.planId,
        message: 'Payments disabled — plan upgraded directly (dev mode)',
      };
    }

    // ── Razorpay mode ────────────────────────────────────────────────────
    if (!this.razorpay) {
      throw new BadRequestException('Payment gateway not initialised');
    }

    const amountPaise = Math.round(Number(plan.priceInr) * 100);
    const receipt = `sub_${userId}_${Date.now()}`;

    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId, planId: dto.planId },
    });

    const keyId = this.config.getOrThrow<string>('RAZORPAY_KEY_ID');

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      planId: dto.planId,
      name: plan.name,
      prefill: {
        name: user?.name ?? '',
        email: user?.email ?? '',
        contact: user?.phone ?? '',
      },
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const keySecret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Invalid payment signature for user ${userId}`);
      throw new ForbiddenException('Invalid payment signature');
    }

    await this.upsertActiveSubscription(userId, dto.planId, dto.razorpayPaymentId);

    // Record payment transaction
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    const amountPaise = plan ? Math.round(Number(plan.priceInr) * 100) : 0;

    await this.prisma.payment.create({
      data: {
        userId,
        planId: dto.planId,
        razorpayOrderId: dto.razorpayOrderId,
        razorpayPaymentId: dto.razorpayPaymentId,
        amountPaise,
        currency: 'INR',
        status: 'SUCCESS',
      },
    }).catch((err: unknown) => {
      this.logger.error('Failed to record Payment entry', err);
    });

    // Send receipt notifications (non-blocking)
    this.sendPaymentReceipts(userId, dto.planId, dto.razorpayPaymentId);

    await this.audit.log({
      actorUserId: userId,
      action: 'subscription_paid',
      entityType: 'Subscription',
      entityId: userId,
      metadata: {
        planId: dto.planId,
        razorpayOrderId: dto.razorpayOrderId,
        razorpayPaymentId: dto.razorpayPaymentId,
      },
    });

    return { success: true, planId: dto.planId };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Immediate downgrade: cancel existing and create new TRIAL Free row
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: 'Free', isActive: true },
    });

    if (!freePlan) {
      throw new NotFoundException('Free plan not found');
    }

    // Immediate downgrade: update existing record to CANCELLED then reset to Free TRIAL.
    // (userId is @unique so there is at most one row — we do a single upsert.)
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planId: freePlan.id,
        paymentStatus: 'CANCELLED',
        paymentProvider: null,
        paymentReference: null,
        startDate: now,
        endDate: trialEnd,
      },
      create: {
        entityType: 'USER',
        userId,
        planId: freePlan.id,
        paymentStatus: 'CANCELLED',
        startDate: now,
        endDate: trialEnd,
      },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'subscription_cancelled',
      entityType: 'Subscription',
      entityId: userId,
      metadata: { previousPlanId: subscription.planId },
    });

    return { success: true, message: 'Subscription cancelled. Downgraded to Free trial.' };
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────

  async handleWebhook(body: Record<string, unknown>, signature: string, rawBody?: Buffer): Promise<void> {
    const webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');

    if (webhookSecret) {
      // Use the raw request body for signature verification, falling back to
      // JSON.stringify(body) when rawBody is unavailable (e.g. in tests or
      // when the rawBody middleware is not active).
      const payload = rawBody ?? Buffer.from(JSON.stringify(body), 'utf-8');
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (expectedSig !== signature) {
        this.logger.warn('Razorpay webhook signature mismatch — ignoring event');
        return;
      }
    } else {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not set — skipping signature check');
    }

    const event = body['event'] as string | undefined;
    const payloadObj = body['payload'] as Record<string, unknown> | undefined;

    this.logger.log(`Razorpay webhook received: ${event}`);

    try {
      switch (event) {
        case 'subscription.charged': {
          const payment = (payloadObj?.['payment'] as Record<string, unknown> | undefined)?.['entity'] as Record<string, unknown> | undefined;
          const notes = payment?.['notes'] as Record<string, string> | undefined;
          const userId = notes?.['userId'];
          const planId = notes?.['planId'];
          const paymentId = payment?.['id'] as string | undefined;

          if (userId && planId && paymentId) {
            await this.upsertActiveSubscription(userId, planId, paymentId);
            await this.audit.log({
              actorUserId: userId,
              action: 'subscription_paid',
              entityType: 'Subscription',
              entityId: userId,
              metadata: { planId, paymentId, source: 'webhook' },
            });
          }
          break;
        }

        case 'subscription.cancelled': {
          const subscriptionEntity = (payloadObj?.['subscription'] as Record<string, unknown> | undefined)?.['entity'] as Record<string, unknown> | undefined;
          const notes = subscriptionEntity?.['notes'] as Record<string, string> | undefined;
          const userId = notes?.['userId'];

          if (userId) {
            await this.prisma.subscription.update({
              where: { userId },
              data: { paymentStatus: 'CANCELLED' },
            }).catch((err: unknown) => {
              this.logger.error(`Failed to cancel subscription for user ${userId}`, err);
            });

            await this.audit.log({
              actorUserId: userId,
              action: 'subscription_cancelled',
              entityType: 'Subscription',
              entityId: userId,
              metadata: { source: 'webhook' },
            });
          }
          break;
        }

        case 'payment.failed': {
          const payment = (payloadObj?.['payment'] as Record<string, unknown> | undefined)?.['entity'] as Record<string, unknown> | undefined;
          const notes = payment?.['notes'] as Record<string, string> | undefined;
          const userId = notes?.['userId'];
          const paymentId = payment?.['id'] as string | undefined;

          if (userId) {
            // Mark payment as FAILED
            if (paymentId) {
              await this.prisma.payment.updateMany({
                where: { razorpayPaymentId: paymentId },
                data: { status: 'FAILED', metadata: { errorCode: String(payment?.['error_code'] ?? '') } },
              }).catch(() => {});
            }

            await this.audit.log({
              actorUserId: userId,
              action: 'payment_failed',
              entityType: 'Subscription',
              entityId: userId,
              metadata: { source: 'webhook', errorCode: payment?.['error_code'] },
            });
          }
          break;
        }

        case 'refund.created': {
          const refund = (payloadObj?.['refund'] as Record<string, unknown> | undefined)?.['entity'] as Record<string, unknown> | undefined;
          const paymentId = refund?.['payment_id'] as string | undefined;

          if (paymentId) {
            await this.prisma.payment.updateMany({
              where: { razorpayPaymentId: paymentId },
              data: { status: 'REFUNDED' },
            }).catch((err: unknown) => {
              this.logger.error(`Failed to mark payment as refunded: ${paymentId}`, err);
            });

            await this.audit.log({
              actorUserId: 'system',
              action: 'refund_processed',
              entityType: 'Payment',
              entityId: paymentId,
              metadata: { source: 'webhook', refundId: refund?.['id'] },
            });

            this.logger.log(`Refund processed for payment: ${paymentId}`);
          }
          break;
        }

        default:
          this.logger.log(`Unhandled Razorpay event: ${event}`);
      }
    } catch (err) {
      this.logger.error(`Error processing webhook event "${event}"`, err);
    }
  }

  // ─── Limit enforcement helper ─────────────────────────────────────────────

  async assertWithinLimit(userId: string, key: LimitKey, currentCount: number): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      // No subscription — treat as free plan with no limits check possible; allow
      return;
    }

    const limits = subscription.plan.limits as Record<string, number>;
    const limit = limits[key];

    if (limit === undefined) {
      // Key not defined in limits — allow
      return;
    }

    if (limit === -1) {
      // Unlimited
      return;
    }

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `${key} limit reached on ${subscription.plan.name} plan. Upgrade to continue.`,
      );
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async upsertActiveSubscription(
    userId: string,
    planId: string,
    paymentReference: string,
  ): Promise<void> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + PLAN_PERIOD_DAYS);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planId,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'razorpay',
        paymentReference,
        startDate: now,
        endDate,
      },
      create: {
        entityType: 'USER',
        userId,
        planId,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'razorpay',
        paymentReference,
        startDate: now,
        endDate,
      },
    });
  }

  /**
   * Send payment receipt via email and WhatsApp (non-blocking).
   */
  private async sendPaymentReceipts(
    userId: string,
    planId: string,
    paymentRef: string,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, whatsappNumber: true },
      });
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: { name: true, priceInr: true },
      });

      if (!user || !plan) return;

      const amountInr = Number(plan.priceInr);

      // Email receipt
      if (user.email) {
        await this.notifications.emailSubscriptionReceipt(
          { name: user.name, email: user.email },
          plan.name,
          amountInr,
          paymentRef,
        );
      }

      // WhatsApp receipt (if number available and feature enabled)
      if (user.whatsappNumber) {
        await this.notifications.sendWhatsApp({
          to: user.whatsappNumber,
          body: `Payment confirmed!\n\nPlan: ${plan.name}\nAmount: ₹${amountInr.toLocaleString('en-IN')}\nReference: ${paymentRef}\n\nYour SiteBank subscription is now active. Manage your account at the dashboard.\n\n— SiteBank`,
        }).catch((err: unknown) => {
          this.logger.error('Failed to send WhatsApp payment receipt', err);
        });
      }
    } catch (err) {
      this.logger.error('Failed to send payment receipts', err);
    }
  }

  /**
   * Get payment history for the authenticated user.
   */
  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        razorpayPaymentId: true,
        amountPaise: true,
        currency: true,
        status: true,
        createdAt: true,
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get invoice details for a specific payment.
   */
  async getInvoice(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { userId, razorpayPaymentId: paymentId },
      include: {
        plan: { select: { name: true, priceInr: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    return {
      invoiceNumber: `SB-${payment.createdAt.getFullYear()}${String(payment.createdAt.getMonth() + 1).padStart(2, '0')}-${payment.id.slice(-6).toUpperCase()}`,
      date: payment.createdAt.toISOString(),
      customer: {
        name: payment.user.name,
        email: payment.user.email,
      },
      plan: payment.plan.name,
      amount: payment.amountPaise / 100,
      currency: payment.currency,
      paymentId: payment.razorpayPaymentId,
      status: payment.status,
    };
  }
}
