import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType, TransactionType } from '@prisma/client';

export class LocationDto {
  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class SpecsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  builtUpAreaSqft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  plotSizeSqft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ageYears?: number;
}

export class CreatePropertyDto {
  @ApiProperty({ minLength: 5, maxLength: 150 })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  title!: string;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @ApiPropertyOptional({ description: 'Price as a decimal string, e.g. "2500000.50"' })
  @IsOptional()
  @IsNumberString()
  price?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priceOnRequest?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownershipType?: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiProperty({ type: SpecsDto })
  @ValidateNested()
  @Type(() => SpecsDto)
  specs!: SpecsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  approvals?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reraId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lpNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBankLoanAvailable?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedAgentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  assignToAllAgents?: boolean;

  @ApiPropertyOptional({ description: 'Automatically generate a marketing banner if images are uploaded' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  generateBanner?: boolean;

  @ApiPropertyOptional({ description: 'Template ID for the automatically generated banner (default: premium)' })
  @IsOptional()
  @IsString()
  bannerTemplateId?: string;

  @ApiPropertyOptional({ description: 'Index of the uploaded image to use for the banner (0-based, default: 0)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bannerMediaIndex?: number;
}


