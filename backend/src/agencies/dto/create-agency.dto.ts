import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

const HOSTNAME_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export class CreateAgencyDto {
  @ApiProperty({ example: 'Acme Realty', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '123 Main St, Mumbai, Maharashtra', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'agency.example.com' })
  @IsOptional()
  @IsString()
  @Matches(HOSTNAME_REGEX, { message: 'customDomain must be a valid hostname' })
  customDomain?: string;
}
