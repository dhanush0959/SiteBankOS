import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ description: 'CUID of the subscription plan to checkout' })
  @IsString()
  planId!: string;
}
