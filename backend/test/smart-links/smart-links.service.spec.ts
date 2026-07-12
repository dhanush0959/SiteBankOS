import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, GoneException, NotFoundException } from '@nestjs/common';
import { SmartLinksService } from '../../src/smart-links/smart-links.service';
import { SmartLinkStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// ── Helpers ──────────────────────────────────────────────────────────────────

const OWNER_ID = 'user_owner_cuid';
const OTHER_ID = 'user_other_cuid';
const PROP_ID = 'prop_cuid';
const LINK_ID = 'link_cuid';
const SLUG = 'abc1234567';

function makeSmartLink(overrides: Partial<{
  id: string;
  slug: string;
  status: SmartLinkStatus;
  expiryAt: Date | null;
  passwordHash: string | null;
  ownerUserId: string;
}> = {}) {
  return {
    id: overrides.id ?? LINK_ID,
    slug: overrides.slug ?? SLUG,
    propertyId: PROP_ID,
    status: overrides.status ?? SmartLinkStatus.ACTIVE,
    expiryAt: overrides.expiryAt ?? null,
    passwordHash: overrides.passwordHash ?? null,
    shareCount: 0,
    createdAt: new Date(),
    property: {
      ownerUserId: overrides.ownerUserId ?? OWNER_ID,
      title: 'Test Property',
      propertyType: 'VILLA',
      aiGeneratedDescription: 'A lovely villa',
      price: null,
      priceOnRequest: false,
      location: { address: '123 Main St', city: 'Bangalore' },
      media: [],
      verificationStatus: 'UNVERIFIED',
      owner: {
        name: 'Agent Name',
        phone: '9876543210',
        whatsappNumber: '9876543210',
        profilePhotoUrl: null,
        ownedAgency: { name: 'Best Realty' },
        agency: null,
      },
    },
    events: [],
  };
}

describe('SmartLinksService', () => {
  let service: SmartLinksService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      property: {
        findUnique: vi.fn(),
      },
      smartLink: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      linkEvent: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new SmartLinksService(prisma, audit);
  });

  // ── create: generates unique slug ─────────────────────────────────────────

  describe('create', () => {
    it('generates a unique slug and creates the smart link', async () => {
      prisma.property.findUnique.mockResolvedValue({ ownerUserId: OWNER_ID });
      prisma.smartLink.findUnique.mockResolvedValue(null); // no conflict
      const created = { id: LINK_ID, slug: SLUG, propertyId: PROP_ID, status: 'ACTIVE' };
      prisma.smartLink.create.mockResolvedValue(created);

      const result = await service.create(OWNER_ID, { propertyId: PROP_ID });

      expect(prisma.smartLink.create).toHaveBeenCalledTimes(1);
      const callArg = prisma.smartLink.create.mock.calls[0][0] as { data: { slug: string } };
      expect(callArg.data.slug).toBeDefined();
      expect(callArg.data.slug.length).toBe(10);
      expect(result).toEqual(created);
    });

    it('retries slug generation on collision and succeeds on second attempt', async () => {
      prisma.property.findUnique.mockResolvedValue({ ownerUserId: OWNER_ID });
      prisma.smartLink.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);
      const created = { id: LINK_ID, slug: SLUG };
      prisma.smartLink.create.mockResolvedValue(created);

      await service.create(OWNER_ID, { propertyId: PROP_ID });

      expect(prisma.smartLink.findUnique).toHaveBeenCalledTimes(2);
    });

    it('throws ForbiddenException when user does not own the property', async () => {
      prisma.property.findUnique.mockResolvedValue({ ownerUserId: OTHER_ID });

      await expect(service.create(OWNER_ID, { propertyId: PROP_ID })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── update: null password clears passwordHash ─────────────────────────────

  describe('update', () => {
    it('clears passwordHash when password is explicitly set to null', async () => {
      const link = { ...makeSmartLink(), property: { ownerUserId: OWNER_ID } };
      prisma.smartLink.findUnique.mockResolvedValue(link);
      prisma.smartLink.update.mockResolvedValue({ ...link, passwordHash: null });

      await service.update(OWNER_ID, LINK_ID, { password: null });

      const updateCall = prisma.smartLink.update.mock.calls[0][0] as {
        data: { passwordHash: null | string | undefined };
      };
      expect(updateCall.data.passwordHash).toBeNull();
    });

    it('hashes new password when updating', async () => {
      const link = { ...makeSmartLink(), property: { ownerUserId: OWNER_ID } };
      prisma.smartLink.findUnique.mockResolvedValue(link);
      prisma.smartLink.update.mockResolvedValue(link);

      await service.update(OWNER_ID, LINK_ID, { password: 'newPass123' });

      const updateCall = prisma.smartLink.update.mock.calls[0][0] as {
        data: { passwordHash: string };
      };
      expect(typeof updateCall.data.passwordHash).toBe('string');
      const valid = await bcrypt.compare('newPass123', updateCall.data.passwordHash);
      expect(valid).toBe(true);
    });

    it('throws ForbiddenException for non-owner', async () => {
      const link = { ...makeSmartLink(), property: { ownerUserId: OTHER_ID } };
      prisma.smartLink.findUnique.mockResolvedValue(link);

      await expect(service.update(OWNER_ID, LINK_ID, { status: SmartLinkStatus.DISABLED })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── getPublic: returns mapped shape ──────────────────────────────────────

  describe('getPublic', () => {
    it('returns the correctly mapped public shape for an active link', async () => {
      prisma.smartLink.findUnique.mockResolvedValue(makeSmartLink());

      const result = await service.getPublic(SLUG);

      expect(result).toMatchObject({
        property: {
          title: 'Test Property',
          propertyType: 'VILLA',
          aiGeneratedDescription: 'A lovely villa',
          priceOnRequest: false,
          location: { address: '123 Main St', city: 'Bangalore' },
          verificationStatus: 'UNVERIFIED',
        },
        agent: {
          name: 'Agent Name',
          phone: '9876543210',
          whatsappNumber: '9876543210',
          agencyName: 'Best Realty',
        },
        smartLink: {
          slug: SLUG,
          status: 'ACTIVE',
        },
      });
    });

    it('sets status EXPIRED and throws GoneException when expiryAt is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const link = makeSmartLink({ expiryAt: pastDate });
      prisma.smartLink.findUnique.mockResolvedValue(link);
      prisma.smartLink.update.mockResolvedValue({ ...link, status: SmartLinkStatus.EXPIRED });

      await expect(service.getPublic(SLUG)).rejects.toThrow(GoneException);

      // Should have updated status to EXPIRED
      expect(prisma.smartLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: LINK_ID },
          data: { status: SmartLinkStatus.EXPIRED },
        }),
      );
    });

    it('throws GoneException for a DISABLED link', async () => {
      prisma.smartLink.findUnique.mockResolvedValue(makeSmartLink({ status: SmartLinkStatus.DISABLED }));

      await expect(service.getPublic(SLUG)).rejects.toThrow(GoneException);
    });

    it('throws NotFoundException for unknown slug', async () => {
      prisma.smartLink.findUnique.mockResolvedValue(null);

      await expect(service.getPublic('unknownslug')).rejects.toThrow(NotFoundException);
    });
  });

  // ── trackEvent: persists hashed ip/device ────────────────────────────────

  describe('trackEvent', () => {
    it('creates a LinkEvent with hashed ip and device', async () => {
      prisma.smartLink.findUnique.mockResolvedValue({ id: LINK_ID });
      prisma.linkEvent.create.mockResolvedValue({ id: 'event_1' });

      await service.trackEvent(
        SLUG,
        { eventType: 'VIEW' },
        '1.2.3.4',
        'Mozilla/5.0',
      );

      const createCall = prisma.linkEvent.create.mock.calls[0][0] as {
        data: { ipHash: string; deviceHash: string; eventType: string; smartLinkId: string };
      };
      expect(createCall.data.smartLinkId).toBe(LINK_ID);
      expect(createCall.data.eventType).toBe('VIEW');
      // Hashes must be 16-char hex strings
      expect(createCall.data.ipHash).toMatch(/^[0-9a-f]{16}$/);
      expect(createCall.data.deviceHash).toMatch(/^[0-9a-f]{16}$/);
      // Must not store raw IP
      expect(createCall.data.ipHash).not.toBe('1.2.3.4');
    });

    it('throws NotFoundException for unknown slug', async () => {
      prisma.smartLink.findUnique.mockResolvedValue(null);

      await expect(
        service.trackEvent('badslug', { eventType: 'VIEW' }, '1.2.3.4', 'ua'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
