import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'agent@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['AGENT', 'AGENCY_ADMIN'] })
  @IsIn(['AGENT', 'AGENCY_ADMIN'])
  role!: 'AGENT' | 'AGENCY_ADMIN';
}
