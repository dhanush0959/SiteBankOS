import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../../src/subscriptions/subscriptions.service';
import type { ConfigService } from '@nestjs/config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHmac(secret: string, orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function makeConfig(values: Record<string, string> = {}): ConfigService {
  const defaults: Record<string, string> = {
    FEATURE_PAYMENTS: 'false',
    RAZORPAY_KEY_ID: 'rzp_test_key',
    RAZORPAY_KEY_SECRET: 'test_secret',
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
  };
  const merged = { ...defaults, ...values };
  return {
    get: vi.fn((key: string) => merged[key]),
    getOrThrow: vi.fn((key: string) => {
      const v = merged[key];
      if (!v) throw new Error(`Config key "${key}" not found`);
      return v;
    }),
  } as unknown as ConfigService;
}

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let audit: any;

  const setupService = (configValues: Record<string, string> = {}) => {
    prisma = {
      subscriptionPlan: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      subscription: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn(),
      },
      payment: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    const notifications = {
      emailSubscriptionReceipt: vi.fn().mockResolvedValue(undefined),
      sendWhatsApp: vi.fn().mockResolvedValue({}),
    };
    const config = makeConfig(configValues);
    service = new SubscriptionsService(
      prisma,
      config,
      audit,
      notifications as any,
    );
  };

  beforeEach(() => {
    setupService();
  });

  // ── listPlans ────────────────────────────────────────────────────────────

  describe('listPlans', () => {
    it('returns only active plans', async () => {
      const activePlans = [
        { id: 'plan_1', name: 'Free', priceInr: 0, limits: {}, features: {} },
        { id: 'plan_2', name: 'Basic Agent', priceInr: 999, limits: {}, features: {} },
      ];
      prisma.subscriptionPlan.findMany.mockResolvedValue(activePlans);

      const result = await service.listPlans();

      expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
      expect(result).toEqual(activePlans);
    });
  });

  // ── assertWithinLimit ────────────────────────────────────────────────────

  describe('assertWithinLimit', () => {
    it('does not throw when limit is -1 (unlimited)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { name: 'Pro Agent', limits: { properties: -1 } },
      });

      await expect(service.assertWithinLimit('user_1', 'properties', 9999)).resolves.not.toThrow();
    });

    it('throws ForbiddenException when currentCount >= limit', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { name: 'Basic Agent', limits: { properties: 10 } },
      });

      await expect(service.assertWithinLimit('user_1', 'properties', 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws with descriptive message including plan name', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { name: 'Basic Agent', limits: { properties: 10 } },
      });

      await expect(service.assertWithinLimit('user_1', 'properties', 10)).rejects.toThrow(
        /properties limit reached on Basic Agent plan/,
      );
    });

    it('passes when currentCount is below the limit', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { name: 'Basic Agent', limits: { properties: 10 } },
      });

      await expect(service.assertWithinLimit('user_1', 'properties', 9)).resolves.not.toThrow();
    });

    it('passes when no subscription exists (allow by default)', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.assertWithinLimit('user_1', 'properties', 9999)).resolves.not.toThrow();
    });
  });

  // ── verifyPayment ────────────────────────────────────────────────────────

  describe('verifyPayment', () => {
    it('throws ForbiddenException for invalid signature', async () => {
      setupService({ FEATURE_PAYMENTS: 'true', RAZORPAY_KEY_SECRET: 'secret' });

      await expect(
        service.verifyPayment('user_1', {
          razorpayPaymentId: 'pay_abc',
          razorpayOrderId: 'order_xyz',
          razorpaySignature: 'invalid_signature',
          planId: 'plan_1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates subscription to ACTIVE on valid signature', async () => {
      const secret = 'test_secret';
      const orderId = 'order_xyz';
      const paymentId = 'pay_abc';
      const validSig = makeHmac(secret, orderId, paymentId);

      prisma.subscription.upsert.mockResolvedValue({});
      setupService({ FEATURE_PAYMENTS: 'true', RAZORPAY_KEY_SECRET: secret });

      const result = await service.verifyPayment('user_1', {
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: validSig,
        planId: 'plan_1',
      });

      expect(result).toEqual({ success: true, planId: 'plan_1' });
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ paymentStatus: 'ACTIVE' }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'subscription_paid' }),
      );
    });
  });

  // ── checkout (stub mode) ─────────────────────────────────────────────────

  describe('checkout (stub mode)', () => {
    it('returns success and upserts subscription without Razorpay when FEATURE_PAYMENTS=false', async () => {
      prisma.subscriptionPlan.findFirst.mockResolvedValue({
        id: 'plan_1',
        name: 'Basic Agent',
        priceInr: 999,
        isActive: true,
      });

      const result = await service.checkout('user_1', { planId: 'plan_1' });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          planId: 'plan_1',
          message: expect.stringContaining('dev mode'),
        }),
      );
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ paymentStatus: 'ACTIVE' }),
        }),
      );
    });

    it('throws NotFoundException for unknown planId', async () => {
      prisma.subscriptionPlan.findFirst.mockResolvedValue(null);

      await expect(service.checkout('user_1', { planId: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── webhook ──────────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('sets subscription paymentStatus to CANCELLED on subscription.cancelled event', async () => {
      const webhookSecret = 'webhook_secret';
      const body = {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: {
              notes: { userId: 'user_1' },
            },
          },
        },
      };
      const rawBody = Buffer.from(JSON.stringify(body), 'utf-8');

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      setupService({ RAZORPAY_WEBHOOK_SECRET: webhookSecret });

      await service.handleWebhook(body, signature, rawBody);

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_1' },
          data: expect.objectContaining({ paymentStatus: 'CANCELLED' }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'subscription_cancelled' }),
      );
    });

    it('ignores events with invalid webhook signature', async () => {
      const body = { event: 'subscription.cancelled', payload: {} };
      const rawBody = Buffer.from(JSON.stringify(body), 'utf-8');

      setupService({ RAZORPAY_WEBHOOK_SECRET: 'real_secret' });

      await service.handleWebhook(body, 'wrong_signature', rawBody);

      // Should not touch the DB
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('uses rawBody for signature verification when provided', async () => {
      const webhookSecret = 'webhook_secret';
      const body = {
        event: 'subscription.charged',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              notes: { userId: 'user_1', planId: 'plan_1' },
            },
          },
        },
      };
      const rawBody = Buffer.from(JSON.stringify(body), 'utf-8');

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      setupService({ RAZORPAY_WEBHOOK_SECRET: webhookSecret });

      await service.handleWebhook(body, signature, rawBody);

      // Successful verification + processing
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ paymentStatus: 'ACTIVE' }),
        }),
      );
    });

    it('skips signature check when webhook secret is not configured', async () => {
      const body = { event: 'subscription.cancelled', payload: {} };

      setupService({ RAZORPAY_WEBHOOK_SECRET: '' });

      await service.handleWebhook(body, 'any_signature');

      // No exception thrown, warns but lets it through
      // Note: with empty secret the HMAC verification is skipped entirely
      expect(true).toBe(true); // no crash
    });
  });
});
