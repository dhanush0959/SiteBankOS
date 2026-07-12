import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export type RangeOption = '7d' | '30d' | '90d';

export class RangeQueryDto {
  @ApiPropertyOptional({
    description: 'Date range for analytics data',
    enum: ['7d', '30d', '90d'],
    default: '30d',
  })
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  range?: RangeOption = '30d';
}

export class LiveQueryDto {
  @ApiPropertyOptional({
    description: 'Property ID to filter live events',
  })
  @IsOptional()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'Number of minutes to look back (1-1440)',
    minimum: 1,
    maximum: 1440,
    default: 15,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value !== undefined ? Number(value) : 15))
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes?: number = 15;
}
