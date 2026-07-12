import { IsString, IsInt, IsOptional, Min, Max, MinLength, MaxLength, IsIn, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ALLOWED_EVENT_TYPES = [
  'VIEW',
  'CLICK_CONTACT',
  'CLICK_WHATSAPP',
  'CLICK_CALL',
  'LEAD_FORM_SUBMIT',
  'SHARE',
  'SCROLL',
  'TIME_SPENT',
];

export class TrackEventDto {
  @ApiProperty({ description: 'Type of event to track', enum: ALLOWED_EVENT_TYPES })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsIn(ALLOWED_EVENT_TYPES)
  eventType!: string;

  @ApiPropertyOptional({ description: 'Unique session identifier' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Referrer URL' })
  @IsOptional()
  @IsUrl()
  referrer?: string;

  @ApiPropertyOptional({ description: 'Time spent on page in seconds (0-86400)', minimum: 0, maximum: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  timeOnPageSeconds?: number;

  @ApiPropertyOptional({ description: 'Maximum scroll depth percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepthPct?: number;
}
