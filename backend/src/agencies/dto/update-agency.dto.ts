import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAgencyDto } from './create-agency.dto';

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {
  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.webp' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
