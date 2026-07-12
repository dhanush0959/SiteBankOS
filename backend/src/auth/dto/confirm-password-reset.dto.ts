import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'JWT token from password reset email' })
  @IsString()
  @MinLength(10)
  @MaxLength(1024)
  token!: string;

  @ApiProperty({
    description: 'New password (min 8, max 128 chars, must contain at least 1 letter and 1 number)',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'newPassword must contain at least one letter and one number',
  })
  newPassword!: string;
}
