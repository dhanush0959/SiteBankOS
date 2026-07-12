import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle an incoming WhatsApp message from the webhook.
   * Currently logs the message — full conversational flows can be built later.
   */
  async handleIncomingMessage(
    msg: Record<string, unknown>,
    value: Record<string, unknown>,
  ): Promise<void> {
    const from = msg['from'] as string | undefined;
    const id = msg['id'] as string | undefined;
    const text = (msg['text'] as Record<string, string> | undefined)?.['body'];
    const msgType = msg['type'] as string | undefined;

    const metadataPhone = value['metadata'] as Record<string, string> | undefined;
    const displayPhone = metadataPhone?.['display_phone_number'];

    this.logger.log(
      `WhatsApp inbound: from=${from} type=${msgType} id=${id} text="${text?.slice(0, 100) ?? ''}" display_phone=${displayPhone}`,
    );

    // Future: store inbound messages, trigger auto-replies, or route to agent
  }

  /**
   * Handle a delivery/read status update from the webhook.
   * Updates the WhatsAppMessage record in the database.
   */
  async handleStatusUpdate(status: Record<string, unknown>): Promise<void> {
    const wamid = status['id'] as string | undefined;
    const newStatus = status['status'] as string | undefined;
    const timestamp = status['timestamp'] as string | undefined;

    if (!wamid || !newStatus) {
      this.logger.warn('WhatsApp status update missing id or status', status);
      return;
    }

    const dbStatus = this.mapWebhookStatus(newStatus);
    if (!dbStatus) {
      this.logger.log(`WhatsApp unhandled status: ${newStatus} for wamid=${wamid}`);
      return;
    }

    try {
      const ts = timestamp ? new Date(Number(timestamp) * 1000) : undefined;

      const data: Record<string, unknown> = { status: dbStatus };
      if (dbStatus === 'DELIVERED') data.deliveredAt = ts ?? new Date();
      if (dbStatus === 'READ') data.readAt = ts ?? new Date();
      if (dbStatus === 'FAILED') {
        data.failedAt = ts ?? new Date();
        const errors = status['errors'] as Array<Record<string, unknown>> | undefined;
        if (errors?.length && errors[0]) {
          data.errorCode = (errors[0]['code'] as number) ?? undefined;
          data.errorMessage = (errors[0]['title'] as string) ?? undefined;
        }
      }

      await this.prisma.whatsAppMessage.updateMany({
        where: { wamid },
        data: data,
      });

      this.logger.log(`WhatsApp status updated: wamid=${wamid} → ${dbStatus}`);
    } catch (err) {
      this.logger.error(`Failed to update WhatsApp message status for wamid=${wamid}`, err);
    }
  }

  private mapWebhookStatus(status: string): 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null {
    switch (status) {
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'READ';
      case 'failed':
        return 'FAILED';
      default:
        return null;
    }
  }
}
