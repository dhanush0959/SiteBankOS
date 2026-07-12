import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertyStatus, VerificationStatus } from '@prisma/client';
import { PropertiesService } from '../../src/properties/properties.service';
import type { CreatePropertyDto } from '../../src/properties/dto/create-property.dto';

// ---------------------------------------------------------------------------
// Minimal mocks
// ---------------------------------------------------------------------------

const makePrisma = () => ({
  subscription: {
    findUnique: vi.fn(),
  },
  property: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  propertyMedia: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === 'function') return arg({});
    return arg;
  }),
  auditLog: { create: vi.fn() },
});

const makeStorage = () => ({
  generateKey: vi.fn().mockReturnValue('properties/test-id/media/file.webp'),
  uploadImage: vi.fn().mockResolvedValue({
    fileUrl: 'https://cdn.example.com/test.webp',
    cdnUrl: 'https://cdn.example.com/test.webp',
    width: 1280,
    height: 720,
    sizeBytes: 204800,
  }),
  deleteFile: vi.fn().mockResolvedValue(undefined),
});

const makeAudit = () => ({
  log: vi.fn().mockResolvedValue(undefined),
});

const OWNER_ID = 'cowner000000000000000000000';
const OTHER_USER = 'cother000000000000000000000';
const PROPERTY_ID = 'cprop0000000000000000000000';
const MEDIA_ID = 'cmedia000000000000000000000';

const baseProperty = {
  id: PROPERTY_ID,
  ownerUserId: OWNER_ID,
  agencyId: null,
  title: 'Test Villa',
  propertyType: 'VILLA',
  transactionType: 'SALE',
  price: null,
  priceNegotiable: false,
  priceOnRequest: false,
  ownershipType: null,
  location: { address: '1 MG Rd', city: 'Bengaluru', state: 'Karnataka' },
  specs: { bedrooms: 3 },
  approvals: null,
  amenities: null,
  internalNotes: null,
  status: PropertyStatus.ACTIVE,
  verificationStatus: VerificationStatus.UNVERIFIED,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createDto: CreatePropertyDto = {
  title: 'Test Villa',
  propertyType: 'VILLA' as CreatePropertyDto['propertyType'],
  transactionType: 'SALE' as CreatePropertyDto['transactionType'],
  location: { address: '1 MG Rd', city: 'Bengaluru', state: 'Karnataka' },
  specs: {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prisma: ReturnType<typeof makePrisma>;
  let storage: ReturnType<typeof makeStorage>;
  let audit: ReturnType<typeof makeAudit>;

  beforeEach(() => {
    prisma = makePrisma();
    storage = makeStorage();
    audit = makeAudit();
    service = new PropertiesService(
      prisma as unknown as Parameters<typeof PropertiesService.prototype.create>[0] extends never
        ? never
        : any,
      storage as any,
      audit as any,
    );
    // Inject directly
    (service as any).prisma = prisma;
    (service as any).storage = storage;
    (service as any).audit = audit;
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('creates a property when under the plan limit', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { limits: { properties: 10 } },
      });
      prisma.property.count.mockResolvedValue(2);
      prisma.property.create.mockResolvedValue(baseProperty);

      const result = await service.create(OWNER_ID, createDto);
      expect(result).toEqual(baseProperty);
      expect(prisma.property.create).toHaveBeenCalledOnce();
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create_property' }));
    });

    it('throws ForbiddenException when property limit is reached', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { limits: { properties: 5 } },
      });
      prisma.property.count.mockResolvedValue(5);

      await expect(service.create(OWNER_ID, createDto)).rejects.toThrow(ForbiddenException);
    });

    it('allows unlimited properties when limit is -1', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { limits: { properties: -1 } },
      });
      prisma.property.create.mockResolvedValue(baseProperty);

      const result = await service.create(OWNER_ID, createDto);
      expect(result).toEqual(baseProperty);
      expect(prisma.property.count).not.toHaveBeenCalled();
    });

    it('creates a property with no subscription record', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.property.create.mockResolvedValue(baseProperty);

      const result = await service.create(OWNER_ID, createDto);
      expect(result).toEqual(baseProperty);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('returns the property for the owner', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ...baseProperty,
        media: [],
        _count: { smartLinks: 0, leads: 0 },
        smartLinks: [],
      });

      const result = await service.findById(OWNER_ID, PROPERTY_ID, undefined);
      expect(result).toBeDefined();
    });

    it('throws ForbiddenException for a non-owner without agency match', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ...baseProperty,
        media: [],
        _count: { smartLinks: 0, leads: 0 },
        smartLinks: [],
      });

      await expect(service.findById(OTHER_USER, PROPERTY_ID, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows access for agency member when agencyId matches', async () => {
      const agencyId = 'cagency00000000000000000000';
      prisma.property.findUnique.mockResolvedValue({
        ...baseProperty,
        agencyId,
        media: [],
        _count: { smartLinks: 0, leads: 0 },
        smartLinks: [],
      });

      const result = await service.findById(OTHER_USER, PROPERTY_ID, agencyId);
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.findById(OWNER_ID, PROPERTY_ID, undefined)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // archive
  // -------------------------------------------------------------------------
  describe('archive', () => {
    it('sets status to ARCHIVED and audit-logs', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);
      prisma.property.update.mockResolvedValue({
        ...baseProperty,
        status: PropertyStatus.ARCHIVED,
      });

      const result = await service.archive(OWNER_ID, PROPERTY_ID);
      expect(result.status).toBe(PropertyStatus.ARCHIVED);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'archive_property' }),
      );
    });

    it('throws ForbiddenException when non-owner tries to archive', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);

      await expect(service.archive(OTHER_USER, PROPERTY_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // setCover
  // -------------------------------------------------------------------------
  describe('setCover', () => {
    it('unsets all isCover flags and sets the target', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);
      prisma.propertyMedia.findUnique.mockResolvedValue({
        id: MEDIA_ID,
        propertyId: PROPERTY_ID,
        isCover: false,
      });
      prisma.$transaction.mockResolvedValue([
        { count: 3 }, // updateMany result
        { id: MEDIA_ID, isCover: true }, // update result
      ]);
      prisma.propertyMedia.findMany.mockResolvedValue([
        { id: MEDIA_ID, isCover: true, orderIndex: 0 },
      ]);

      const result = await service.setCover(OWNER_ID, PROPERTY_ID, MEDIA_ID);
      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when media does not belong to property', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);
      prisma.propertyMedia.findUnique.mockResolvedValue({
        id: MEDIA_ID,
        propertyId: 'cdifferent0000000000000000000',
        isCover: false,
      });

      await expect(service.setCover(OWNER_ID, PROPERTY_ID, MEDIA_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // addMedia
  // -------------------------------------------------------------------------
  describe('addMedia', () => {
    const makeFile = (name = 'photo.jpg', size = 1024 * 100): Express.Multer.File =>
      ({
        originalname: name,
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size,
        fieldname: 'files',
        encoding: '7bit',
        stream: null as any,
        destination: '',
        filename: name,
        path: '',
      }) as Express.Multer.File;

    it('throws ForbiddenException when photosPerProperty limit is exceeded', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { limits: { photosPerProperty: 5 } },
      });
      prisma.propertyMedia.count.mockResolvedValue(5);

      await expect(service.addMedia(OWNER_ID, PROPERTY_ID, [makeFile()])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when file exceeds 10 MB', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);
      prisma.subscription.findUnique.mockResolvedValue(null);

      const bigFile = makeFile('large.jpg', 11 * 1024 * 1024);
      await expect(service.addMedia(OWNER_ID, PROPERTY_ID, [bigFile])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when no files provided', async () => {
      prisma.property.findUnique.mockResolvedValue(baseProperty);

      await expect(service.addMedia(OWNER_ID, PROPERTY_ID, [])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
