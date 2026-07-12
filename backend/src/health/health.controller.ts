import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('health')
  async health() {
    const startedAt = Date.now();
    let db: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      db = 'down';
    }

    // Check S3 config presence (no secrets exposed)
    const s3Configured = !!(
      this.config.get<string>('S3_ACCESS_KEY') &&
      this.config.get<string>('S3_SECRET_KEY')
    );
    const s3Endpoint = this.config.get<string>('S3_ENDPOINT') ? 'set' : 'missing';
    const s3Bucket = this.config.get<string>('S3_BUCKET') || 'missing';
    const s3PublicUrl = this.config.get<string>('S3_PUBLIC_URL') ? 'set' : 'missing';

    return {
      status: db === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      version: process.env['npm_package_version'] ?? '2.0.0',
      env: process.env['NODE_ENV'] ?? 'development',
      checks: {
        db,
        latencyMs: Date.now() - startedAt,
        storage: {
          credentials: s3Configured ? 'present' : 'MISSING',
          endpoint: s3Endpoint,
          bucket: s3Bucket,
          publicUrl: s3PublicUrl,
        },
      },
    };
  }
}
