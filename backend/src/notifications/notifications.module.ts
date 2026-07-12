import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController, WhatsAppWebhookController],
  providers: [NotificationsService, WhatsAppWebhookService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
