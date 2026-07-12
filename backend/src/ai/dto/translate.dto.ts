import { IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const SUPPORTED_LANGS = ['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export class TranslateDto {
  @ApiProperty({
    description: 'Text to translate (max 5000 characters)',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000)
  text!: string;

  @ApiProperty({
    description: 'Target language code',
    enum: SUPPORTED_LANGS,
    example: 'hi',
  })
  @IsIn(SUPPORTED_LANGS)
  targetLang!: SupportedLang;
}
