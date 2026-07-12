import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// BullMQ queues are registered per-module where needed.
// This module provides the shared Redis connection configuration.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'QUEUE_CONFIG',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
    },
  ],
  exports: ['QUEUE_CONFIG'],
})
export class QueueModule {}
