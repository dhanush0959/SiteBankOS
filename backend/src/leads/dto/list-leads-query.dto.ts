import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export type SortByField = 'createdAt' | 'lastActivityAt' | 'hotScore';
export type SortDir = 'asc' | 'desc';

export class ListLeadsQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Filter by propertyId' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Search by name or phone' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Minimum hotScore filter', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  hotScoreMin?: number;

  @ApiPropertyOptional({ description: 'Page number (1-based)', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'lastActivityAt', 'hotScore'],
    description: 'Sort field',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: SortByField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort direction', default: 'desc' })
  @IsOptional()
  @IsString()
  sortDir?: SortDir = 'desc';
}
