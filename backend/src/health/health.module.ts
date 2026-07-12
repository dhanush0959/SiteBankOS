import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { KeepAliveService } from './keep-alive.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [HealthController],
  providers: [KeepAliveService],
})
export class HealthModule {}
