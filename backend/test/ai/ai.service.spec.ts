import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService } from '../../src/ai/ai.service';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

const mockPrisma = {
  property: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const mockAudit = {
  log: vi.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: vi.fn(),
};

// ---------------------------------------------------------------------------
// Helper to build a minimal property record
// ---------------------------------------------------------------------------
function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prop-001',
    ownerUserId: 'user-001',
    title: '3 BHK in Hyderabad',
    aiGeneratedTitle: null,
    aiGeneratedDescription: null,
    propertyType: 'APARTMENT',
    transactionType: 'SALE',
    price: { toString: () => '8500000' },
    location: { city: 'Hyderabad', area: 'Gachibowli' },
    specs: { bedrooms: 3, areaSqft: 1450 },
    amenities: { gym: true, pool: false },
    ...overrides,
  };
}

// Helper to build a subscription with plan features
function makeSubscription(features: Record<string, unknown>) {
  return {
    plan: {
      features,
      limits: {},
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AiService', () => {
  let service: AiService;
  let chatCompleteSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: API key present
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'DEEPSEEK_API_KEY') return 'sk-test-key';
      if (key === 'DEEPSEEK_BASE_URL') return 'https://api.deepseek.com';
      if (key === 'DEEPSEEK_MODEL') return 'deepseek-chat';
      return undefined;
    });

    service = new AiService(
      mockConfig as never,
      mockPrisma as never,
      mockAudit as never,
    );

    // Spy on the internal chatComplete so we don't make real network calls
    chatCompleteSpy = vi
      .spyOn(service, 'chatComplete')
      .mockResolvedValue('Mocked AI output');
  });

  // -------------------------------------------------------------------------
  // Title generation
  // -------------------------------------------------------------------------
  describe('generateTitle', () => {
    it('generates a title, persists aiGeneratedTitle, and returns it', async () => {
      const property = makeProperty();
      mockPrisma.property.findUnique.mockResolvedValue(property);
      mockPrisma.property.update.mockResolvedValue({ ...property, aiGeneratedTitle: 'Mocked AI output' });
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true }),
      );

      const result = await service.generateTitle('user-001', 'prop-001');

      expect(result).toEqual({ title: 'Mocked AI output' });
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-001' },
        data: { aiGeneratedTitle: 'Mocked AI output' },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ai_generate_title' }),
      );
      expect(chatCompleteSpy).toHaveBeenCalledOnce();
    });

    it('throws ForbiddenException when user does not own the property', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true }),
      );
      // Property owned by someone else
      mockPrisma.property.findUnique.mockResolvedValue(makeProperty({ ownerUserId: 'other-user' }));

      await expect(service.generateTitle('user-001', 'prop-001')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.property.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true }),
      );
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(service.generateTitle('user-001', 'prop-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Plan gating
  // -------------------------------------------------------------------------
  describe('plan gating', () => {
    it('throws ForbiddenException for pitch on a Free plan (aiPitch: false)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true, aiDescription: false, aiPitch: false, aiQA: false }),
      );

      await expect(
        service.pitch('user-001', {
          propertyId: 'prop-001',
          audience: 'buyer',
          tone: 'formal',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(chatCompleteSpy).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for Q&A on a plan without aiQA', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true, aiDescription: true, aiPitch: false, aiQA: false }),
      );

      await expect(
        service.qa('user-001', { propertyId: 'prop-001', question: 'Is parking available?' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for description on a Basic plan (aiDescription: false)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true, aiDescription: false }),
      );

      await expect(
        service.generateDescription('user-001', 'prop-001'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // Translate
  // -------------------------------------------------------------------------
  describe('translate', () => {
    it('returns translated text from mocked completion', async () => {
      chatCompleteSpy.mockResolvedValue('नमस्ते दुनिया');

      const result = await service.translate('user-001', {
        text: 'Hello world',
        targetLang: 'hi',
      });

      expect(result).toEqual({ translated: 'नमस्ते दुनिया' });
      expect(chatCompleteSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hindi'),
        'Hello world',
        expect.objectContaining({ temperature: 0.3 }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ai_translate' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // ServiceUnavailableException when no API key
  // -------------------------------------------------------------------------
  describe('when DEEPSEEK_API_KEY is missing', () => {
    let unconfiguredService: AiService;

    beforeEach(() => {
      const noKeyConfig = {
        get: vi.fn().mockReturnValue(undefined),
      };
      unconfiguredService = new AiService(
        noKeyConfig as never,
        mockPrisma as never,
        mockAudit as never,
      );
    });

    it('generateTitle throws ServiceUnavailableException', async () => {
      await expect(
        unconfiguredService.generateTitle('user-001', 'prop-001'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('generateDescription throws ServiceUnavailableException', async () => {
      await expect(
        unconfiguredService.generateDescription('user-001', 'prop-001'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('translate throws ServiceUnavailableException', async () => {
      await expect(
        unconfiguredService.translate('user-001', { text: 'Hello', targetLang: 'hi' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('qa throws ServiceUnavailableException', async () => {
      await expect(
        unconfiguredService.qa('user-001', { propertyId: 'prop-001', question: 'Test?' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('pitch throws ServiceUnavailableException', async () => {
      await expect(
        unconfiguredService.pitch('user-001', {
          propertyId: 'prop-001',
          audience: 'buyer',
          tone: 'formal',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -------------------------------------------------------------------------
  // Regenerate
  // -------------------------------------------------------------------------
  describe('regenerate', () => {
    it('regenerates only requested fields', async () => {
      const property = makeProperty();
      mockPrisma.property.findUnique.mockResolvedValue(property);
      mockPrisma.property.update.mockResolvedValue(property);
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true, aiDescription: true }),
      );
      chatCompleteSpy.mockResolvedValueOnce('New Title').mockResolvedValueOnce('New Description');

      const result = await service.regenerate('user-001', 'prop-001', {
        fields: ['title', 'description'],
      });

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Description');
      expect(mockPrisma.property.update).toHaveBeenCalledTimes(2);
    });

    it('regenerates only title when fields contains only title', async () => {
      const property = makeProperty();
      mockPrisma.property.findUnique.mockResolvedValue(property);
      mockPrisma.property.update.mockResolvedValue(property);
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiTitle: true }),
      );
      chatCompleteSpy.mockResolvedValueOnce('Just A Title');

      const result = await service.regenerate('user-001', 'prop-001', { fields: ['title'] });

      expect(result.title).toBe('Just A Title');
      expect(result.description).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Pitch
  // -------------------------------------------------------------------------
  describe('pitch', () => {
    it('generates a pitch and audit logs it', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        makeSubscription({ aiPitch: true }),
      );
      mockPrisma.property.findUnique.mockResolvedValue(makeProperty());
      chatCompleteSpy.mockResolvedValue('Great investment opportunity in Hyderabad!');

      const result = await service.pitch('user-001', {
        propertyId: 'prop-001',
        audience: 'investor',
        tone: 'formal',
      });

      expect(result).toEqual({ pitch: 'Great investment opportunity in Hyderabad!' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ai_pitch',
          metadata: expect.objectContaining({ audience: 'investor', tone: 'formal' }),
        }),
      );
    });
  });
});
