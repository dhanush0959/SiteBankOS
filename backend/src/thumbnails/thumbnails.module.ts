import { Module } from '@nestjs/common';
import { ThumbnailsController } from './thumbnails.controller';
import { ThumbnailsService } from './thumbnails.service';
import { PosterService } from './poster.service';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [StorageModule, AuditModule, AiModule],
  controllers: [ThumbnailsController],
  providers: [ThumbnailsService, PosterService],
  exports: [ThumbnailsService],
})
export class ThumbnailsModule {}
