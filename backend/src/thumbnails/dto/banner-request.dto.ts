import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BannerRequestDto {
  @ApiProperty({ example: 'premium' })
  @IsString()
  templateId!: string;

  @ApiPropertyOptional({ example: 'Modern Luxury Villa in Jubilee Hills' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @ApiPropertyOptional({ example: '3 BHK · 2400 sqft' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keySpec?: string;

  @ApiPropertyOptional({ description: 'ID of the media to use as background' })
  @IsOptional()
  @IsString()
  mediaId?: string;
}
