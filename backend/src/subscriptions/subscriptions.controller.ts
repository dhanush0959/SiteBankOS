import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';

@ApiTags('subscriptions')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List all active subscription plans' })
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  // ─── Authenticated ────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's current subscription" })
  getMySubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getMySubscription(user.sub);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate a checkout session for a plan' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.checkout(user.sub, dto);
  }

  @Post('verify')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate subscription' })
  verifyPayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyPaymentDto) {
    return this.subscriptionsService.verifyPayment(user.sub, dto);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current subscription and downgrade to Free' })
  cancelSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.cancelSubscription(user.sub);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment billing history for the authenticated user' })
  getPaymentHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getPaymentHistory(user.sub);
  }

  @Get('invoice/:paymentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice details for a payment' })
  async getInvoice(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.subscriptionsService.getInvoice(user.sub, paymentId);
  }

  // ─── Webhook ──────────────────────────────────────────────────────────────

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request,
  ) {
    // Pass raw body for accurate signature verification — JSON.stringify(body)
    // may reorder keys and produce different bytes than the original request.
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    await this.subscriptionsService.handleWebhook(body, signature ?? '', rawBody);
    return { received: true };
  }
}
