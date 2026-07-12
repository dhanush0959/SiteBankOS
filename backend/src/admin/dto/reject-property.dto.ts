import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectPropertyDto {
  @ApiProperty({ example: 'Documents are incomplete' })
  @IsString()
  @MinLength(3)
  reason!: string;
}
