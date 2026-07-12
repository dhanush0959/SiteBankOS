import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InternalServerErrorException, ForbiddenException, BadRequestException } from '@nestjs/common';

// ── Module mocks (hoisted, runs before imports) ─────────────────────────────
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

vi.mock('../../src/lib/property-helpers', () => ({
  formatPriceINR: vi.fn((v) => `₹${v}`),
  timeAgo: vi.fn(() => 'just now'),
}));

// ── Service Imports ────────────────────────────────────────────────────────
import { PosterService } from '../../src/thumbnails/poster.service';
import { readFileSync, existsSync } from 'fs';

describe('PosterService', () => {
  let service: PosterService;

  const validVariables = {
    coverUrl: 'https://example.com/photo.jpg',
    headline: 'Modern Villa',
    price: '₹1.5 Cr',
    location: 'Bangalore',
    keySpec: '3 BHK',
    ctaText: 'Call Now',
    brandingText: 'SiteBank',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PosterService();
  });

  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      const input = '<div>"Quotes" & \'Ampersands\'</div>';
      const output = (service as any).escapeHtml(input);
      expect(output).toBe('&lt;div&gt;&quot;Quotes&quot; &amp; \'Ampersands\'&lt;/div&gt;');
    });

    it('returns plain text unchanged', () => {
      expect((service as any).escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('renderPoster', () => {
    it('throws when template file does not exist', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Not found');
      });
      await expect(service.renderPoster('missing', validVariables)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('reads template from correct path', async () => {
      vi.mocked(readFileSync).mockReturnValue('<html>{{headline}}</html>');
      const fakePage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
        close: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
      };
      const fakeBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue(fakePage),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(service as any, 'launchBrowser').mockResolvedValue(fakeBrowser);

      await service.renderPoster('premium', validVariables);
      expect(readFileSync).toHaveBeenCalled();
      const pathArg = vi.mocked(readFileSync).mock.calls[0][0] as string;
      const normalizedPath = pathArg.replace(/\\/g, '/');
      expect(normalizedPath).toContain('/src/thumbnails/templates');
      expect(normalizedPath).toContain('premium.html');
    });

    it('returns PNG buffer on success', async () => {
      vi.mocked(readFileSync).mockReturnValue('<html>{{headline}}</html>');
      const fakePage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('png-result')),
        close: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
      };
      const fakeBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue(fakePage),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(service as any, 'launchBrowser').mockResolvedValue(fakeBrowser);

      const buffer = await service.renderPoster('premium', validVariables);
      expect(buffer.toString()).toBe('png-result');
      expect(fakePage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Modern Villa'),
        expect.any(Object),
      );
    });
  });

  describe('renderPosterSingle', () => {
    it('renders with specific viewport', async () => {
      vi.mocked(readFileSync).mockReturnValue('<html></html>');
      vi.mocked(existsSync).mockReturnValue(true);
      const fakePage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
        close: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
      };
      const fakeBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue(fakePage),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(service as any, 'launchBrowser').mockResolvedValue(fakeBrowser);

      const result = await service.renderPosterSingle('premium', validVariables, { width: 800, height: 600 });
      expect(result).toBeInstanceOf(Buffer);
      expect(fakeBrowser.newContext).toHaveBeenCalledWith(expect.objectContaining({
        viewport: { width: 800, height: 600 }
      }));
    });
  });

  describe('renderPosterMultiAspect', () => {
    it('renders at all 3 aspect ratios', async () => {
      vi.mocked(readFileSync).mockReturnValue('<html></html>');
      vi.mocked(existsSync).mockReturnValue(true);
      const fakePage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
        close: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        setViewportSize: vi.fn().mockResolvedValue(undefined),
      };
      const fakeBrowser = {
        newContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue(fakePage),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(service as any, 'launchBrowser').mockResolvedValue(fakeBrowser);

      const result = await service.renderPosterMultiAspect('premium', validVariables);
      expect(result.bufferLandscape).toBeInstanceOf(Buffer);
      expect(result.bufferSquare).toBeInstanceOf(Buffer);
      expect(result.bufferPortrait).toBeInstanceOf(Buffer);
    });
  });

  describe('launchBrowser', () => {
    it('throws descriptive error when launch fails', async () => {
      const playwright = require('playwright');
      vi.spyOn(playwright.chromium, 'launch').mockRejectedValue(new Error('Failed'));
      await expect((service as any).launchBrowser()).rejects.toThrow(/Playwright Chromium launch failed/);
    });
  });
});

// ── ThumbnailsService.generateBanner tests ───────────────────────────────────

import { ThumbnailsService } from '../../src/thumbnails/thumbnails.service';

function makePrisma() {
  return {
    property: { findUnique: vi.fn() },
    propertyMedia: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 0 }), findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    propertyAssignment: { findUnique: vi.fn() },
    thumbnailAsset: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    auditLog: { create: vi.fn() },
  } as any;
}

describe('ThumbnailsService.generateBanner', () => {
  let service: ThumbnailsService;
  let prisma: ReturnType<typeof makePrisma>;
  let storage: any;
  let audit: any;
  let poster: any;
  let ai: any;

  const property = {
    ownerUserId: 'user_1',
    title: 'Villa in Whitefield',
    aiGeneratedTitle: 'Stunning Whitefield Villa',
    price: 15000000 as any,
    priceNegotiable: false,
    priceOnRequest: false,
    propertyType: 'VILLA',
    transactionType: 'SALE',
    location: { city: 'Bangalore', address: 'Whitefield' },
    specs: { bedrooms: 3, areaSqft: 2000, facing: 'East' },
  };

  const coverPhoto = { 
    fileUrl: 'https://s3.example.com/cover.jpg', 
    fileType: 'PHOTO', 
    isCover: true,
    width: 1200,
    height: 800
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    storage = {
      uploadFile: vi.fn().mockResolvedValue({ fileUrl: 'https://s3.example.com/poster.png' }),
      generateKey: vi.fn().mockReturnValue('thumbnails/p1/key.png'),
    };
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    poster = {
      renderPosterMultiAspect: vi.fn().mockResolvedValue({
        bufferLandscape: Buffer.from('l'), bufferSquare: Buffer.from('s'), bufferPortrait: Buffer.from('p'),
      }),
      renderPosterSingle: vi.fn().mockResolvedValue(Buffer.from('poster')),
    };
    ai = { generateThumbnailCopy: vi.fn() };
    service = new ThumbnailsService(prisma, storage, audit, poster, ai);
  });

  it('getBannerTemplates returns 3 templates', () => {
    const templates = service.getBannerTemplates();
    expect(templates).toHaveLength(3);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
  });

  it('throws ForbiddenException for non-owner', async () => {
    prisma.property.findUnique.mockResolvedValue({ ...property, ownerUserId: 'other' });
    prisma.user.findUnique.mockResolvedValue({ role: 'AGENT' });
    prisma.propertyAssignment.findUnique.mockResolvedValue(null);
    await expect(
      service.generateBanner('user_1', 'prop_1', { templateId: 'premium' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when property has no photos', async () => {
    prisma.property.findUnique.mockResolvedValue(property);
    prisma.propertyMedia.findFirst.mockResolvedValue(null);
    await expect(
      service.generateBanner('user_1', 'prop_1', { templateId: 'premium' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates 1 asset and 1 media on success', async () => {
    prisma.property.findUnique.mockResolvedValue(property);
    prisma.propertyMedia.findFirst.mockResolvedValue(coverPhoto);
    prisma.user.findUnique.mockResolvedValue({ 
      id: 'user_1',
      agency: null,
      subscription: null
    });
    prisma.thumbnailAsset.create.mockResolvedValue({
      id: 'a1', propertyId: 'p1', templateId: 't1', imageUrl: 'u', aspectRatio: '16:9', headline: 'h',
    });
    prisma.propertyMedia.create.mockResolvedValue({ id: 'm1' });

    const result = await service.generateBanner('user_1', 'prop_1', { templateId: 'premium' });
    expect(result.assets).toHaveLength(1);
    expect(storage.uploadFile).toHaveBeenCalledTimes(1);
    expect(prisma.thumbnailAsset.create).toHaveBeenCalledTimes(1);
    expect(prisma.propertyMedia.create).toHaveBeenCalledTimes(1);
    expect(poster.renderPosterSingle).toHaveBeenCalledWith(
      'premium', 
      expect.any(Object), 
      { width: 1200, height: 800 }
    );
  });

  it('uses provided headline over aiGeneratedTitle', async () => {
    prisma.property.findUnique.mockResolvedValue(property);
    prisma.propertyMedia.findFirst.mockResolvedValue(coverPhoto);
    prisma.user.findUnique.mockResolvedValue({ id: 'user_1' });
    prisma.thumbnailAsset.create.mockResolvedValue({
      id: 'a1', propertyId: 'p1', templateId: 't1', imageUrl: 'u', aspectRatio: '16:9', headline: 'Custom',
    });
    prisma.propertyMedia.create.mockResolvedValue({ id: 'm1' });

    await service.generateBanner('user_1', 'prop_1', { templateId: 'premium', headline: 'Custom Headline' });
    expect(poster.renderPosterSingle).toHaveBeenCalledWith(
      'premium', 
      expect.objectContaining({ headline: 'Custom Headline' }),
      expect.any(Object)
    );
  });
});
