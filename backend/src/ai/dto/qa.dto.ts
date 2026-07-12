import { IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QADto {
  @ApiProperty({
    description: 'Property ID (cuid)',
    example: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @Matches(/^c[a-z0-9]{20,30}$/, { message: 'propertyId must be a valid cuid' })
  propertyId!: string;

  @ApiProperty({
    description: "Buyer's question (max 500 characters)",
    maxLength: 500,
    example: 'Is there parking available?',
  })
  @IsString()
  @MaxLength(500)
  question!: string;
}
