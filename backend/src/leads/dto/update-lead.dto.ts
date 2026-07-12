import { IsString, IsOptional, MaxLength, Matches, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadDto {
  @ApiPropertyOptional({ description: 'Lead name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Lead phone number', pattern: '/^[0-9+\\-\\s]{6,20}$/' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, { message: 'Invalid phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Lead source', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ description: 'Notes about the lead', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ enum: LeadStatus, description: 'Updated lead status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
