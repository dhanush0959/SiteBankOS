import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderStatus } from '@prisma/client';

export class UpdateReminderDto {
  @ApiPropertyOptional({ enum: ReminderStatus, description: 'Updated reminder status' })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({ description: 'ISO datetime to snooze/reschedule to' })
  @IsOptional()
  @IsDateString()
  remindAt?: string;
}
