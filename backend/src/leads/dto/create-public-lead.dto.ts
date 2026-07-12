import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicLeadDto {
  @ApiProperty({ description: 'Smart-link slug' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ description: 'Visitor name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'Visitor phone number', pattern: '/^[0-9+\\-\\s]{6,20}$/' })
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, { message: 'Invalid phone number' })
  phone!: string;

  @ApiPropertyOptional({ description: 'Optional message from visitor', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
