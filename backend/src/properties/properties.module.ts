import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { SmartLinksModule } from '../smart-links/smart-links.module';
import { ThumbnailsModule } from '../thumbnails/thumbnails.module';

@Module({
  imports: [StorageModule, AuditModule, SmartLinksModule, ThumbnailsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}

