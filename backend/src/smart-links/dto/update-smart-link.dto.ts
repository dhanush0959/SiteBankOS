import { IsString, IsInt, IsOptional, Min, Max, MinLength, MaxLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SmartLinkStatus } from '@prisma/client';

export class UpdateSmartLinkDto {
  @ApiPropertyOptional({ enum: SmartLinkStatus, description: 'New status for the smart link' })
  @IsOptional()
  @IsEnum(SmartLinkStatus)
  status?: SmartLinkStatus;

  @ApiPropertyOptional({ description: 'Update expiry — sets expiryAt to now + N days (1-365)', minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @ApiPropertyOptional({
    description: 'New password (4-64 chars) or null to clear the existing password',
    nullable: true,
    minLength: 4,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  password?: string | null;
}
