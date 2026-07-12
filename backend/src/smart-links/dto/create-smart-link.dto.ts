import { IsString, IsInt, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSmartLinkDto {
  @ApiProperty({ description: 'Property ID (CUID) to generate the smart link for' })
  @IsString()
  propertyId!: string;

  @ApiPropertyOptional({ description: 'Number of days until the link expires (1-365)', minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @ApiPropertyOptional({ description: 'Optional password to protect the link (4-64 chars)', minLength: 4, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  password?: string;
}
