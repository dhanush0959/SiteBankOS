import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

/**
 * Pings the server's own /health endpoint every 14 minutes
 * to prevent Render free-tier services from spinning down
 * after 15 minutes of inactivity.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly selfUrl: string;

  constructor(private readonly config: ConfigService) {
    const port = this.config.get<string>('PORT') ?? '4000';
    // In production we use the external Render URL so the request
    // goes through the load-balancer (counts as "activity").
    // Locally we just hit localhost.
    const renderUrl = this.config.get<string>('RENDER_EXTERNAL_URL');
    this.selfUrl = renderUrl
      ? `${renderUrl}/health`
      : `http://localhost:${port}/health`;
  }

  @Cron('*/14 * * * *') // every 14 minutes
  async ping() {
    try {
      const res = await fetch(this.selfUrl);
      const data = (await res.json()) as { status?: string };
      this.logger.log(
        `Keep-alive ping → ${res.status} (${data.status ?? 'unknown'})`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Keep-alive ping failed: ${message}`);
    }
  }
}
