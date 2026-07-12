import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { WhatsAppWebhookController } from '../../src/notifications/whatsapp-webhook.controller';
import { WhatsAppWebhookService } from '../../src/notifications/whatsapp-webhook.service';

function makeConfig(values: Record<string, string> = {}) {
  const get = vi.fn((key: string) => values[key]);
  return { get } as unknown as ConfigService;
}

describe('WhatsAppWebhookController', () => {
  let controller: WhatsAppWebhookController;
  let service: { handleStatusUpdate: any; handleIncomingMessage: any };

  beforeEach(() => {
    service = {
      handleStatusUpdate: vi.fn().mockResolvedValue(undefined),
      handleIncomingMessage: vi.fn().mockResolvedValue(undefined),
    };
    const config = makeConfig({ WHATSAPP_VERIFY_TOKEN: 'test-secret' });
    controller = new WhatsAppWebhookController(config, service as any);
  });

  describe('GET verify', () => {
    it('returns challenge when token matches', () => {
      const result = controller.verify('subscribe', 'abc123', 'test-secret');
      expect(result).toBe('abc123');
    });

    it('returns error when token does not match', () => {
      const result = controller.verify('subscribe', 'abc123', 'wrong-token');
      expect(result).toEqual({ error: 'Verification failed' });
    });

    it('returns error when WHATSAPP_VERIFY_TOKEN is not configured', () => {
      const config = makeConfig({});
      const ctrl = new WhatsAppWebhookController(config, service as any);
      const result = ctrl.verify('subscribe', 'abc123', 'any');
      expect(result).toEqual({ error: 'Not configured' });
    });

    it('returns error for non-subscribe mode', () => {
      const result = controller.verify('invalid', 'abc123', 'test-secret');
      expect(result).toEqual({ error: 'Verification failed' });
    });
  });

  describe('POST receive', () => {
    it('processes status update from webhook payload', async () => {
      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    { id: 'wamid_123', status: 'delivered', timestamp: '1715000000' },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await controller.receive(body, '');
      expect(result).toEqual({ status: 'ok' });
      expect(service.handleStatusUpdate).toHaveBeenCalledWith({
        id: 'wamid_123',
        status: 'delivered',
        timestamp: '1715000000',
      });
    });

    it('processes incoming message from webhook payload', async () => {
      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: '919876543210', id: 'msg_1', type: 'text', text: { body: 'Hi' } },
                  ],
                },
              },
            ],
          },
        ],
      };

      await controller.receive(body, '');
      expect(service.handleIncomingMessage).toHaveBeenCalledWith(
        { from: '919876543210', id: 'msg_1', type: 'text', text: { body: 'Hi' } },
        { messages: [{ from: '919876543210', id: 'msg_1', type: 'text', text: { body: 'Hi' } }] },
      );
    });

    it('returns ok for empty entries', async () => {
      const result = await controller.receive({}, '');
      expect(result).toEqual({ status: 'ok' });
      expect(service.handleStatusUpdate).not.toHaveBeenCalled();
      expect(service.handleIncomingMessage).not.toHaveBeenCalled();
    });

    it('returns ok for empty changes array', async () => {
      const result = await controller.receive({ entry: [{ changes: [] }] }, '');
      expect(result).toEqual({ status: 'ok' });
    });

    it('handles service errors gracefully (does not throw)', async () => {
      service.handleStatusUpdate.mockRejectedValue(new Error('DB down'));
      const body = {
        entry: [{ changes: [{ value: { statuses: [{ id: 'w1', status: 'sent', timestamp: '1' }] } }] }],
      };

      // Should not throw — errors are caught and logged
      await expect(controller.receive(body, '')).resolves.toEqual({ status: 'ok' });
    });
  });
});
