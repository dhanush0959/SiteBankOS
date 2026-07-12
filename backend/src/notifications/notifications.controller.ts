import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('test/email')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a test email to the current admin user' })
  async testEmail(@CurrentUser() user: AuthenticatedUser): Promise<{ message: string; result: { id?: string; skipped?: boolean } }> {
    const result = await this.notifications.sendEmail({
      to: user.email,
      subject: 'SiteBank — test email',
      html: '<p>This is a test email from SiteBank notifications module.</p>',
      text: 'This is a test email from SiteBank notifications module.',
    });
    return { message: 'Test email dispatched', result };
  }

  @Get('test/whatsapp')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a test WhatsApp message to the current admin user' })
  async testWhatsApp(@CurrentUser() user: AuthenticatedUser & { whatsappNumber?: string }): Promise<{ message: string; result: { id?: string; skipped?: boolean } }> {
    const phone = user.whatsappNumber ?? '';

    if (!phone) {
      return { message: 'No whatsappNumber on user — skipped', result: { skipped: true } };
    }

    const result = await this.notifications.sendWhatsApp({
      to: phone,
      body: 'This is a test WhatsApp message from SiteBank.',
    });
    return { message: 'Test WhatsApp dispatched', result };
  }

  /**
   * GET /notifications/whatsapp/templates
   * List available WhatsApp message templates for the configured WA business account.
   */
  @Get('whatsapp/templates')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List WhatsApp message templates' })
  async listTemplates(): Promise<{ templates: Array<{ name: string; status: string; category: string; language: string }> }> {
    const token = this.notifications['config'].get('WHATSAPP_TOKEN', { infer: true });
    const wabaId = this.notifications['config'].get('WHATSAPP_WABA_ID', { infer: true });

    if (!token || !wabaId) {
      return { templates: [] };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        return { templates: [] };
      }

      const data = (await response.json()) as {
        data?: Array<{ name: string; status: string; category: string; language: string }>;
      };

      return {
        templates: (data.data ?? []).map((t) => ({
          name: t.name,
          status: t.status,
          category: t.category,
          language: t.language,
        })),
      };
    } catch {
      return { templates: [] };
    }
  }
}
