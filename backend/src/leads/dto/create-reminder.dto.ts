import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReminderDto {
  @ApiProperty({ description: 'ISO datetime to remind at' })
  @IsDateString()
  remindAt!: string;

  @ApiPropertyOptional({ description: 'Optional note for the reminder', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
