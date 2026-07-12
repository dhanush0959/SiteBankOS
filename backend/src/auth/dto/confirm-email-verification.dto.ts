import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailVerificationDto {
  @ApiProperty({ description: 'JWT token from verification email' })
  @IsString()
  @MinLength(10)
  @MaxLength(1024)
  token!: string;
}
