import { Module } from '@nestjs/common';
import { SmartLinksController } from './smart-links.controller';
import { SmartLinksService } from './smart-links.service';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [StorageModule, AuditModule, AiModule],
  controllers: [SmartLinksController],
  providers: [SmartLinksService],
  exports: [SmartLinksService],
})
export class SmartLinksModule {}

