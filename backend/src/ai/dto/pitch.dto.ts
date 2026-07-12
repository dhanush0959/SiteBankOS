import { IsIn, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const AUDIENCE_OPTIONS = ['buyer', 'investor', 'tenant'] as const;
const TONE_OPTIONS = ['formal', 'casual'] as const;

export type PitchAudience = (typeof AUDIENCE_OPTIONS)[number];
export type PitchTone = (typeof TONE_OPTIONS)[number];

export class PitchDto {
  @ApiProperty({
    description: 'Property ID (cuid)',
    example: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @Matches(/^c[a-z0-9]{20,30}$/, { message: 'propertyId must be a valid cuid' })
  propertyId!: string;

  @ApiProperty({
    description: 'Target audience for the pitch',
    enum: AUDIENCE_OPTIONS,
    example: 'buyer',
  })
  @IsIn(AUDIENCE_OPTIONS)
  audience!: PitchAudience;

  @ApiProperty({
    description: 'Tone of the pitch',
    enum: TONE_OPTIONS,
    example: 'formal',
  })
  @IsIn(TONE_OPTIONS)
  tone!: PitchTone;
}
