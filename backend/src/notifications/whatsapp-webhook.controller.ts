import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

@ApiTags('notifications')
@Controller('notifications/whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly webhookService: WhatsAppWebhookService,
  ) {}

  /**
   * GET — Meta webhook verification.
   * Meta sends a GET with hub.mode, hub.challenge, hub.verify_token.
   * We respond with the challenge if the verify_token matches.
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification (GET)' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ): string | { error: string } {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (!verifyToken) {
      this.logger.warn('WHATSAPP_VERIFY_TOKEN not configured — rejecting webhook verification');
      return { error: 'Not configured' };
    }

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    }

    this.logger.warn(`WhatsApp webhook verification failed — mode=${mode} token_match=${token === verifyToken}`);
    return { error: 'Verification failed' };
  }

  /**
   * POST — Receive incoming WhatsApp messages & delivery status updates.
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 60 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook event receiver (POST)' })
  async receive(
    @Body() body: Record<string, unknown>,
    @Headers('x-hub-signature-256') signature: string,
  ): Promise<{ status: string }> {
    // Verify signature if WHATSAPP_APP_SECRET is configured
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (appSecret && signature) {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(body))
        .digest('hex');
      if (`sha256=${expected}` !== signature) {
        this.logger.warn('WhatsApp webhook signature mismatch');
        return { status: 'ignored' };
      }
    }

    const entries = body['entry'] as Array<Record<string, unknown>> | undefined;
    if (!entries?.length) {
      return { status: 'ok' };
    }

    for (const entry of entries) {
      const changes = entry['changes'] as Array<Record<string, unknown>> | undefined;
      if (!changes?.length) continue;

      for (const change of changes) {
        const value = change['value'] as Record<string, unknown> | undefined;
        if (!value) continue;

        // Handle incoming messages
        const messages = value['messages'] as Array<Record<string, unknown>> | undefined;
        if (messages?.length) {
          for (const msg of messages) {
            await this.webhookService.handleIncomingMessage(msg, value).catch((err: unknown) => {
              this.logger.error('Failed to process incoming WhatsApp message', err);
            });
          }
        }

        // Handle delivery/read status updates
        const statuses = value['statuses'] as Array<Record<string, unknown>> | undefined;
        if (statuses?.length) {
          for (const status of statuses) {
            await this.webhookService.handleStatusUpdate(status).catch((err: unknown) => {
              this.logger.error('Failed to process WhatsApp status update', err);
            });
          }
        }
      }
    }

    return { status: 'ok' };
  }
}
