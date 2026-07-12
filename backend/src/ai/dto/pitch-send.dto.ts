import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PitchDto } from './pitch.dto';

export class PitchSendDto extends PitchDto {
  @ApiProperty({
    description: 'Phone number to send the pitch to via WhatsApp (E.164 or 10-digit Indian). If omitted, uses the authenticated user WhatsApp number.',
    example: '9876543210',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid phone number' })
  phone?: string;
}
