import { Module, forwardRef } from '@nestjs/common';
import { LeadsController, LeadsPublicController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, forwardRef(() => NotificationsModule)],
  controllers: [LeadsController, LeadsPublicController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
