import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay payment ID from the client-side checkout' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay order ID used during checkout' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ description: 'HMAC SHA256 signature returned by Razorpay' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Plan ID that was checked out' })
  @IsString()
  planId!: string;
}
