import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, GoneException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { LeadsService } from '../../src/leads/leads.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AGENT_ID = 'agent-cuid-001';
const OTHER_AGENT_ID = 'other-agent-002';
const PROPERTY_ID = 'property-cuid-001';
const LEAD_ID = 'lead-cuid-001';
const SMART_LINK_SLUG = 'test-slug';

function makeLead(overrides: Partial<{
  id: string;
  agentId: string;
  status: LeadStatus;
  phone: string | null;
  lastActivityAt: Date | null;
}> = {}) {
  return {
    id: overrides.id ?? LEAD_ID,
    propertyId: PROPERTY_ID,
    agentId: overrides.agentId ?? AGENT_ID,
    name: 'Test Lead',
    phone: overrides.phone !== undefined ? overrides.phone : '+91 9999999999',
    source: null,
    hotScore: 0,
    status: overrides.status ?? LeadStatus.NEW,
    lastActivityAt: overrides.lastActivityAt !== undefined ? overrides.lastActivityAt : null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      lead: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      followUpReminder: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      smartLink: {
        findUnique: vi.fn(),
      },
      linkEvent: {
        create: vi.fn(),
      },
      idempotentRequest: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new LeadsService(prisma, audit);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('computes hotScore before saving (phone present, status NEW)', async () => {
      const phone = '+91 9988776655';
      const createdLead = makeLead({ phone, status: LeadStatus.NEW });
      prisma.lead.create.mockResolvedValue(createdLead);

      await service.create(AGENT_ID, { propertyId: PROPERTY_ID, phone, status: LeadStatus.NEW });

      const createCall = prisma.lead.create.mock.calls[0][0] as { data: { hotScore: number } };
      // phone (+20) + NEW (0) = 20
      expect(createCall.data.hotScore).toBe(20);
    });

    it('stores hotScore=0 when no phone and status=NEW (no activity yet)', async () => {
      const createdLead = makeLead({ phone: null, status: LeadStatus.NEW });
      prisma.lead.create.mockResolvedValue(createdLead);

      await service.create(AGENT_ID, { propertyId: PROPERTY_ID, status: LeadStatus.NEW });

      const createCall = prisma.lead.create.mock.calls[0][0] as { data: { hotScore: number } };
      expect(createCall.data.hotScore).toBe(0);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('bumps lastActivityAt and recomputes hotScore on status change to CONTACTED', async () => {
      const existingLead = makeLead({ status: LeadStatus.NEW, phone: null, lastActivityAt: null });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });

      const updatedLead = makeLead({ status: LeadStatus.CONTACTED });
      prisma.lead.update.mockResolvedValue(updatedLead);

      await service.update(LEAD_ID, AGENT_ID, { status: LeadStatus.CONTACTED });

      const updateCall = prisma.lead.update.mock.calls[0][0] as {
        data: { hotScore: number; lastActivityAt: Date };
      };
      expect(updateCall.data.lastActivityAt).toBeInstanceOf(Date);
      // no phone (0) + CONTACTED (+15) + recent activity (+20) = 35
      expect(updateCall.data.hotScore).toBe(35);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'lead_status_change' }),
      );
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('throws ForbiddenException when agentId does not match', async () => {
      const lead = makeLead({ agentId: OTHER_AGENT_ID });
      prisma.lead.findUnique.mockResolvedValue({
        ...lead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });

      await expect(service.findById(LEAD_ID, AGENT_ID)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ── capturePublicLead ────────────────────────────────────────────────────────

  describe('capturePublicLead', () => {
    it('throws GoneException when smart-link is not ACTIVE', async () => {
      prisma.$transaction.mockImplementation(async (cb: Function) => {
        const txMock = {
          smartLink: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'sl-1',
              slug: SMART_LINK_SLUG,
              status: 'DISABLED',
              expiryAt: null,
              property: { id: PROPERTY_ID, ownerUserId: AGENT_ID },
            }),
          },
        };
        return cb(txMock);
      });

      await expect(
        service.capturePublicLead(
          { slug: SMART_LINK_SLUG, phone: '+91 9988776655' },
          { idempotencyKey: 'test-key', protocolVersion: 'v1', payloadHash: 'hash', path: '/test' }
        ),
      ).rejects.toBeInstanceOf(GoneException);
    });

    it('throws GoneException when smart-link is expired', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      prisma.$transaction.mockImplementation(async (cb: Function) => {
        const txMock = {
          smartLink: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'sl-2',
              slug: SMART_LINK_SLUG,
              status: 'ACTIVE',
              expiryAt: yesterday,
              property: { id: PROPERTY_ID, ownerUserId: AGENT_ID },
            }),
          },
        };
        return cb(txMock);
      });

      await expect(
        service.capturePublicLead(
          { slug: SMART_LINK_SLUG, phone: '+91 9988776655' },
          { idempotencyKey: 'test-key', protocolVersion: 'v1', payloadHash: 'hash', path: '/test' }
        ),
      ).rejects.toBeInstanceOf(GoneException);
    });

    it('throws GoneException when smart-link slug not found', async () => {
      prisma.$transaction.mockImplementation(async (cb: Function) => {
        const txMock = {
          smartLink: { findUnique: vi.fn().mockResolvedValue(null) },
        };
        return cb(txMock);
      });

      await expect(
        service.capturePublicLead(
          { slug: 'nonexistent', phone: '+91 9988776655' },
          { idempotencyKey: 'test-key', protocolVersion: 'v1', payloadHash: 'hash', path: '/test' }
        ),
      ).rejects.toBeInstanceOf(GoneException);
    });
  });

  // ── hot-score edge cases ────────────────────────────────────────────────────

  describe('hotScore computation', () => {
    it('scores CLOSED clamped to 0', async () => {
      const existingLead = makeLead({ status: LeadStatus.NEW, phone: '+91 9999999999', lastActivityAt: new Date() });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.CLOSED }));
      prisma.followUpReminder.count.mockResolvedValue(0);

      await service.update(LEAD_ID, AGENT_ID, { status: LeadStatus.CLOSED });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // phone (+20) + CLOSED (-100) + recent (+20) = -60 → clamped to 0
      expect(updateCall.data.hotScore).toBe(0);
    });

    it('scores DEAD clamped to 0', async () => {
      const existingLead = makeLead({ status: LeadStatus.NEW, phone: null, lastActivityAt: new Date() });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.DEAD }));
      prisma.followUpReminder.count.mockResolvedValue(0);

      await service.update(LEAD_ID, AGENT_ID, { status: LeadStatus.DEAD });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // no phone (0) + DEAD (-100) + recent (+20) = -80 → clamped to 0
      expect(updateCall.data.hotScore).toBe(0);
    });

    it('no recency bonus when lastActivityAt is over 7 days old', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const existingLead = makeLead({ status: LeadStatus.NEW, phone: '+91 9999999999', lastActivityAt: eightDaysAgo });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.NEW }));
      prisma.followUpReminder.count.mockResolvedValue(0);

      await service.update(LEAD_ID, AGENT_ID, { name: 'Updated Name' });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // phone (+20) + NEW (0) + no recency (not within 24h or 7d, not >30d) = 20
      expect(updateCall.data.hotScore).toBe(20);
    });

    it('applies -10 penalty when lastActivityAt is over 30 days old', async () => {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const existingLead = makeLead({ status: LeadStatus.CONTACTED, phone: '+91 9999999999', lastActivityAt: thirtyOneDaysAgo });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.CONTACTED }));
      prisma.followUpReminder.count.mockResolvedValue(0);

      await service.update(LEAD_ID, AGENT_ID, { name: 'Updated Name' });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // phone (+20) + CONTACTED (+15) + over 30d (-10) = 25
      expect(updateCall.data.hotScore).toBe(25);
    });

    it('adds reminder bonus when 2+ DONE reminders exist in last 14 days', async () => {
      const existingLead = makeLead({ status: LeadStatus.NEW, phone: null, lastActivityAt: null });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.NEW }));
      prisma.followUpReminder.count.mockResolvedValue(3);

      await service.update(LEAD_ID, AGENT_ID, { name: 'Updated Name' });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // no phone (0) + NEW (0) + no recency (0) + reminder bonus (15) = 15
      expect(updateCall.data.hotScore).toBe(15);
    });

    it('caps hotScore at 100 (maximum)', async () => {
      const now = new Date();
      const existingLead = makeLead({ status: LeadStatus.NEGOTIATING, phone: '+91 9999999999', lastActivityAt: now });
      prisma.lead.findUnique.mockResolvedValue({
        ...existingLead,
        property: { id: PROPERTY_ID, title: 'T', location: {} },
        reminders: [],
      });
      prisma.lead.update.mockResolvedValue(makeLead({ status: LeadStatus.NEGOTIATING }));
      prisma.followUpReminder.count.mockResolvedValue(5);

      await service.update(LEAD_ID, AGENT_ID, { name: 'Updated Name' });

      const updateCall = prisma.lead.update.mock.calls[0][0] as { data: { hotScore: number } };
      // phone (+20) + NEGOTIATING (+50) + recent (+20) + reminder bonus (+15) = 105 → clamped to 100
      expect(updateCall.data.hotScore).toBe(100);
    });
  });

  // ── getStats ─────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns all LeadStatus keys defaulting to 0', async () => {
      prisma.lead.groupBy.mockResolvedValue([
        { status: LeadStatus.NEW, _count: { id: 3 } },
        { status: LeadStatus.CONTACTED, _count: { id: 1 } },
      ]);

      const stats = await service.getStats(AGENT_ID);

      const allStatuses = Object.values(LeadStatus) as LeadStatus[];
      for (const s of allStatuses) {
        expect(stats).toHaveProperty(s);
        expect(typeof stats[s]).toBe('number');
      }
      expect(stats.total).toBe(4);
      expect(stats[LeadStatus.NEW]).toBe(3);
      expect(stats[LeadStatus.CONTACTED]).toBe(1);
      expect(stats[LeadStatus.DEAD]).toBe(0);
    });
  });
});
