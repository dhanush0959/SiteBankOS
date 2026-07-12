import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { PosterService } from './poster.service';
import { AiService } from '../ai/ai.service';
import sharp from 'sharp';
import { BannerRequestDto } from './dto/banner-request.dto';

// ── Config ───────────────────────────────────────────────────────────────────

/** Default thumbnail dimensions for listing cards and social previews. */
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_QUALITY = 82;
const DEFAULT_TEMPLATE = 'default';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenerateThumbnailOptions {
  /** Override default width (e.g. 1200 for social preview). */
  width?: number;
  /** Override default height. */
  height?: number;
  /** Template identifier (default: 'default'). */
  templateId?: string;
}

export interface GeneratedThumbnail {
  id: string;
  propertyId: string;
  templateId: string;
  imageUrl: string;
  aspectRatio: string;
  headline: string | null;
  width: number;
  height: number;
}

@Injectable()
export class ThumbnailsService {
  private readonly logger = new Logger(ThumbnailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly poster: PosterService,
    private readonly ai: AiService,
  ) {}

  // ── List ───────────────────────────────────────────────────────────────────

  async listForProperty(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerUserId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    
    // Auth check (allow owner, agency admin, or assigned agent)
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, agencyId: true } });
    const isOwner = property.ownerUserId === userId;
    const isAgencyAdmin = user?.role === 'AGENCY_ADMIN' && user.agencyId;
    const isAssigned = await this.prisma.propertyAssignment.findUnique({
      where: { propertyId_agentId: { propertyId, agentId: userId } },
    });

    if (!isOwner && !isAgencyAdmin && !isAssigned) {
      throw new ForbiddenException('Not your property');
    }

    return this.prisma.thumbnailAsset.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Remove ─────────────────────────────────────────────────────────────────

  async remove(userId: string, id: string) {
    const thumbnail = await this.prisma.thumbnailAsset.findUnique({
      where: { id },
      include: { property: { select: { ownerUserId: true } } },
    });
    if (!thumbnail) throw new NotFoundException('Thumbnail not found');
    if (thumbnail.property.ownerUserId !== userId) {
      throw new ForbiddenException('Not your thumbnail');
    }

    await this.storage.deleteFile(thumbnail.imageUrl);
    await this.prisma.thumbnailAsset.delete({ where: { id } });

    await this.audit.log({
      actorUserId: userId,
      action: 'delete_thumbnail',
      entityType: 'ThumbnailAsset',
      entityId: id,
    });
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  /**
   * Generate a thumbnail from the property's cover photo.
   *
   * Falls back to the first available photo if no cover is set.
   * Uses `sharp` to resize and convert to WebP, uploads via S3-compatible
   * storage, and records the asset in the database.
   */
  async generate(
    userId: string,
    propertyId: string,
    opts: GenerateThumbnailOptions = {},
  ): Promise<GeneratedThumbnail> {
    const width = opts.width ?? THUMBNAIL_WIDTH;
    const height = opts.height ?? THUMBNAIL_HEIGHT;
    const templateId = opts.templateId ?? DEFAULT_TEMPLATE;

    // 1. Verify ownership
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerUserId: true, title: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerUserId !== userId) throw new ForbiddenException('Not your property');

    // 2. Find source image (cover first, then any photo)
    const cover = await this.prisma.propertyMedia.findFirst({
      where: { propertyId, isCover: true, fileType: 'PHOTO' },
    });
    const source = cover ?? await this.prisma.propertyMedia.findFirst({
      where: { propertyId, fileType: 'PHOTO' },
    });

    if (!source) {
      throw new BadRequestException(
        'Property has no photos. Upload at least one photo before generating a thumbnail.',
      );
    }

    // 3. Download source image from S3
    let sourceBuffer: Buffer;
    try {
      const response = await fetch(source.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source image: ${response.statusText}`);
      }
      sourceBuffer = Buffer.from(await response.arrayBuffer());
    } catch (err) {
      this.logger.error(`Failed to download source image ${source.fileUrl}`, err);
      throw new BadRequestException('Failed to download source image for thumbnail generation');
    }

    // 4. Resize and convert to WebP
    let thumbnailBuffer: Buffer;
    let thumbWidth: number;
    let thumbHeight: number;
    try {
      const result = await sharp(sourceBuffer)
        .rotate()
        .resize({ width, height, fit: 'cover', position: 'centre' })
        .webp({ quality: THUMBNAIL_QUALITY })
        .toBuffer({ resolveWithObject: true });

      thumbnailBuffer = result.data;
      thumbWidth = result.info.width;
      thumbHeight = result.info.height;
    } catch (err) {
      this.logger.error('Sharp processing failed', err);
      throw new BadRequestException('Thumbnail generation failed — image processing error');
    }

    // 5. Upload thumbnail
    const key = this.storage.generateKey(`thumbnails/${propertyId}`, `thumbnail.webp`);
    const { fileUrl } = await this.storage.uploadFile(thumbnailBuffer, key, 'image/webp');

    // 6. Compute aspect ratio (e.g. "4:3", "16:9", or "custom")
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(thumbWidth, thumbHeight);
    const aspectRatio = divisor > 1
      ? `${thumbWidth / divisor}:${thumbHeight / divisor}`
      : `${thumbWidth}:${thumbHeight}`;

    // 7. Persist
    const asset = await this.prisma.thumbnailAsset.create({
      data: {
        propertyId,
        templateId,
        imageUrl: fileUrl,
        aspectRatio,
        headline: property.title,
        generatedBy: userId,
      },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'generate_thumbnail',
      entityType: 'ThumbnailAsset',
      entityId: asset.id,
      metadata: { propertyId, templateId, width: thumbWidth, height: thumbHeight },
    });

    this.logger.log(`Thumbnail generated for property ${propertyId}: ${fileUrl}`);

    return {
      id: asset.id,
      propertyId: asset.propertyId,
      templateId: asset.templateId,
      imageUrl: asset.imageUrl,
      aspectRatio: asset.aspectRatio,
      headline: asset.headline,
      width: thumbWidth,
      height: thumbHeight,
    };
  }

  // ── Banner Generation ─────────────────────────────────────────────────────

  async generateBanner(
    userId: string,
    propertyId: string,
    opts: BannerRequestDto,
  ): Promise<{ assets: GeneratedThumbnail[] }> {
    // 1. Verify ownership + load property
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerUserId: true,
        title: true,
        aiGeneratedTitle: true,
        price: true,
        priceNegotiable: true,
        priceOnRequest: true,
        propertyType: true,
        transactionType: true,
        location: true,
        specs: true,
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerUserId !== userId) {
      // Check if it's an agency admin or assigned agent
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, agencyId: true } });
      const isOwner = property.ownerUserId === userId;
      const isAgencyAdmin = user?.role === 'AGENCY_ADMIN' && user.agencyId;
      const isAssigned = await this.prisma.propertyAssignment.findUnique({
        where: { propertyId_agentId: { propertyId, agentId: userId } },
      });

      if (!isOwner && !isAgencyAdmin && !isAssigned) {
        throw new ForbiddenException('Not authorized to generate banner for this property');
      }
    }

    // 2. Fetch User Agency info for branding
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        agency: true,
        subscription: { include: { plan: { select: { name: true } } } },
      },
    });

    // 3. Find source image (specified or default cover/first)
    let source;
    if (opts.mediaId) {
      source = await this.prisma.propertyMedia.findUnique({
        where: { id: opts.mediaId },
      });
      if (!source || source.propertyId !== propertyId || source.fileType !== 'PHOTO') {
        throw new BadRequestException('Selected media not found or invalid');
      }
    } else {
      const cover = await this.prisma.propertyMedia.findFirst({
        where: { propertyId, isCover: true, fileType: 'PHOTO' },
      });
      source = cover ?? await this.prisma.propertyMedia.findFirst({
        where: { propertyId, fileType: 'PHOTO' },
      });
    }

    if (!source) {
      throw new BadRequestException('Property has no photos to generate a banner from');
    }

    // 4. Build variables
    const location = (property.location ?? {}) as Record<string, unknown>;
    const specs = (property.specs ?? {}) as Record<string, unknown>;
    const city = (typeof location['city'] === 'string' ? location['city'] : '') || '';

    const headline = opts.headline ?? property.aiGeneratedTitle ?? property.title;
    const price = formatPriceINR(property.price);
    const priceLabel = property.transactionType === 'RENT' ? 'PER MONTH' : '';

    // Build key spec string
    let keySpec = opts.keySpec ?? '';
    if (!keySpec) {
      const parts: string[] = [];
      if (specs['bedrooms']) parts.push(`${specs['bedrooms']} BHK`);
      if (specs['areaSqft']) parts.push(`${specs['areaSqft']} sqft`);
      if (specs['facing']) parts.push(`${specs['facing']} Facing`);
      keySpec = parts.join(' · ') || `${property.propertyType}`;
    }

    // Build spec chips for hot-property template
    const chipParts: string[] = [];
    if (specs['bedrooms']) chipParts.push(`${specs['bedrooms']} BHK`);
    if (specs['areaSqft']) chipParts.push(`${specs['areaSqft']} sqft`);
    if (specs['facing']) chipParts.push(`${specs['facing']}`);
    const specChips = chipParts.map((c) => `<span class="spec-chip">${this.escapeHtml(c)}</span>`).join('');

    const isFree = !user?.subscription || user.subscription.plan.name === 'Free';
    const brandingText = isFree ? 'Made with SiteBank' : (user?.agency?.name ?? 'SiteBank Agent');
    const agencyLogoUrl = user?.agency?.logoUrl ?? undefined;

    // 5. Render banner at source aspect ratio
    const width = source.width ?? 1200;
    const height = source.height ?? 675;

    const bannerBuffer = await this.poster.renderPosterSingle(opts.templateId, {
      coverUrl: source.fileUrl,
      headline,
      price,
      priceLabel,
      location: city,
      keySpec,
      ctaText: 'Call / WhatsApp',
      brandingText,
      urgencyText: 'Limited availability',
      specChips,
      agencyLogoUrl,
    }, { width, height });

    // 6. Upload to S3 and create records
    const key = this.storage.generateKey(
      `thumbnails/${propertyId}/banner`,
      `banner-${opts.templateId}-${Date.now()}.png`,
    );
    const { fileUrl } = await this.storage.uploadFile(bannerBuffer, key, 'image/png');

    // Save to PropertyMedia and make it the cover
    // 1. Unset existing cover
    await this.prisma.propertyMedia.updateMany({
      where: { propertyId, isCover: true },
      data: { isCover: false },
    });

    // 2. Shift existing media to make room for the new cover at index 0
    await this.prisma.propertyMedia.updateMany({
      where: { propertyId },
      data: { orderIndex: { increment: 1 } },
    });

    const media = await this.prisma.propertyMedia.create({
      data: {
        propertyId,
        fileUrl,
        fileType: 'PHOTO',
        width,
        height,
        orderIndex: 0,
        isCover: true,
      },
    });

    // Also save to ThumbnailAsset for the banners tab
    const asset = await this.prisma.thumbnailAsset.create({
      data: {
        propertyId,
        templateId: opts.templateId,
        imageUrl: fileUrl,
        aspectRatio: `${width}:${height}`,
        headline,
        generatedBy: userId,
      },
    });

    const assets: GeneratedThumbnail[] = [{
      id: asset.id,
      propertyId: asset.propertyId,
      templateId: asset.templateId,
      imageUrl: asset.imageUrl,
      aspectRatio: asset.aspectRatio,
      headline: asset.headline,
      width,
      height,
    }];

    await this.audit.log({
      actorUserId: userId,
      action: 'generate_banner',
      entityType: 'ThumbnailAsset',
      entityId: asset.id,
      metadata: { templateId: opts.templateId, mediaId: media.id },
    });

    this.logger.log(`Banner generated for property ${propertyId} and stored in media: ${fileUrl}`);

    return { assets };
  }


  async suggestHeadlines(userId: string, propertyId: string) {
    return this.ai.generateThumbnailCopy(userId, propertyId);
  }

  getBannerTemplates() {
    return [
      {
        id: 'premium',
        name: 'Premium',
        description: 'Professional layout with pricing and contact details',
      },
      {
        id: 'hot-property',
        name: 'Hot Property',
        description: 'Bold red banner for urgent or high-demand listings',
      },
      {
        id: 'simple-whatsapp',
        name: 'Simple WhatsApp',
        description: 'Clean, minimal design optimized for WhatsApp status',
      },
    ];
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

function formatPriceINR(value: unknown): string {
  if (value == null || value === '0') return 'On Request';
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (Number.isNaN(n) || n === 0) return 'On Request';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
