import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PropertyStatus, VerificationStatus, PropertyType, TransactionType } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { SmartLinksService } from '../smart-links/smart-links.service';
import type { CreatePropertyDto } from './dto/create-property.dto';
import type { UpdatePropertyDto } from './dto/update-property.dto';
import type { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import type { ReorderMediaDto } from './dto/reorder-media.dto';

import { ThumbnailsService } from '../thumbnails/thumbnails.service';

const MAX_MEDIA_PER_UPLOAD = 10;
const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly smartLinksService: SmartLinksService,
    private readonly thumbnailsService: ThumbnailsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(userId: string, dto: CreatePropertyDto, files?: Express.Multer.File[]) {
    // Check subscription plan limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (subscription) {
      const limits = subscription.plan.limits as Record<string, unknown>;
      const propertyLimit = limits['properties'] as number | undefined;
      if (propertyLimit !== undefined && propertyLimit !== -1) {
        const count = await this.prisma.property.count({
          where: { ownerUserId: userId, status: { not: PropertyStatus.ARCHIVED } },
        });
        if (count >= propertyLimit) {
          throw new ForbiddenException('Property limit reached on current plan');
        }
      }
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { agencyId: true } });

    // Handle multipart/form-data stringified JSON for location and specs
    const location = typeof dto.location === 'string' ? JSON.parse(dto.location) : dto.location;
    const specs = typeof dto.specs === 'string' ? JSON.parse(dto.specs) : dto.specs;
    const amenities = typeof dto.amenities === 'string' ? JSON.parse(dto.amenities) : dto.amenities;

    // Standardize city to lowercase
    if (location && location.city) {
      location.city = location.city.trim().toLowerCase();
    }

    const property = await this.prisma.property.create({
      data: {
        ownerUserId: userId,
        agencyId: user?.agencyId,
        title: dto.title,
        propertyType: dto.propertyType,
        transactionType: dto.transactionType,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
        priceNegotiable: dto.priceNegotiable ?? false,
        priceOnRequest: dto.priceOnRequest ?? false,
        ownershipType: dto.ownershipType,
        location: location as unknown as Prisma.InputJsonValue,
        specs: specs as unknown as Prisma.InputJsonValue,
        approvals: dto.approvals ? (dto.approvals as unknown as Prisma.InputJsonValue) : undefined,
        amenities: (amenities || []) as unknown as Prisma.InputJsonValue,
        internalNotes: dto.internalNotes,
        reraId: dto.reraId,
        lpNumber: dto.lpNumber,
        isBankLoanAvailable: dto.isBankLoanAvailable ?? false,
      },
    });

    // Handle assignments
    if (user?.agencyId) {
      let agentIds: string[] = [];
      if (dto.assignToAllAgents) {
        const members = await this.prisma.user.findMany({
          where: { agencyId: user.agencyId, id: { not: userId } },
          select: { id: true },
        });
        agentIds = members.map((m) => m.id);
      } else if (dto.assignedAgentIds && dto.assignedAgentIds.length > 0) {
        agentIds = dto.assignedAgentIds;
      }

      if (agentIds.length > 0) {
        await this.prisma.propertyAssignment.createMany({
          data: agentIds.map((agentId) => ({
            propertyId: property.id,
            agentId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Precompute nearby facilities in the background
    const loc = dto.location as any;
    if (loc?.lat && loc?.lng) {
      this.smartLinksService
        .fetchNearbyFacilities(property.id, loc.lat, loc.lng)
        .catch((err) =>
          this.logger.warn(`Background precompute failed for property ${property.id}`, err),
        );
    }

    await this.audit.log({
      actorUserId: userId,
      action: 'create_property',
      entityType: 'Property',
      entityId: property.id,
    });

    // 4. Handle optional media upload + automatic banner generation
    if (files && files.length > 0) {
      this.logger.log(`Processing ${files.length} initial media files for new property ${property.id}`);
      const uploadedMedia = await this.processMediaUpload(userId, property.id, files, { skipAuth: true });

      if (dto.generateBanner) {
        const templateId = dto.bannerTemplateId || 'premium';
        // Select media based on index or default to first
        const mediaIndex = dto.bannerMediaIndex ?? 0;
        const selectedMedia = uploadedMedia[mediaIndex] || uploadedMedia[0];
        
        this.logger.log(`Auto-generating banner for new property ${property.id} using template ${templateId}`);
        // Pass the mediaId explicitly to ensure it finds the right one instantly
        this.thumbnailsService.generateBanner(userId, property.id, { 
          templateId, 
          mediaId: selectedMedia?.id 
        })
          .catch(err => this.logger.error(`Auto banner generation failed for property ${property.id}`, err));
      }
    }


    return property;
  }

  // ---------------------------------------------------------------------------
  // Bulk Upload
  // ---------------------------------------------------------------------------
  async bulkUpload(userId: string, file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as { row: number; title: string; error: string }[],
    };

    // Check subscription limit beforehand for the whole batch
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    let availableLimit = Infinity;
    if (subscription) {
      const limits = subscription.plan.limits as Record<string, unknown>;
      const propertyLimit = limits['properties'] as number | undefined;
      if (propertyLimit !== undefined && propertyLimit !== -1) {
        const count = await this.prisma.property.count({
          where: { ownerUserId: userId, status: { not: PropertyStatus.ARCHIVED } },
        });
        availableLimit = propertyLimit - count;
      }
    }

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowIndex = i + 2; // +1 for 0-index, +1 for header row

      try {
        if (results.success >= availableLimit) {
          throw new Error('Subscription property limit reached');
        }

        // Basic Mapping & Sanitization
        const title = row.title || row.Title || `Property ${rowIndex}`;
        const rawPropType = (row.propertyType || row.PropertyType || '').toUpperCase();
        const rawTransType = (row.transactionType || row.TransactionType || '').toUpperCase();

        // Validating Enums
        const propertyType = Object.values(PropertyType).includes(rawPropType as PropertyType)
          ? (rawPropType as PropertyType)
          : PropertyType.PLOT;

        const transactionType = Object.values(TransactionType).includes(rawTransType as TransactionType)
          ? (rawTransType as TransactionType)
          : TransactionType.SALE;

        const property = await this.prisma.property.create({
          data: {
            ownerUserId: userId,
            title,
            propertyType,
            transactionType,
            price: row.price || row.Price ? new Prisma.Decimal(row.price || row.Price) : undefined,
            priceNegotiable: row.priceNegotiable === 'true' || row.priceNegotiable === true,
            priceOnRequest: row.priceOnRequest === 'true' || row.priceOnRequest === true,
            ownershipType: row.ownershipType || row.OwnershipType,
            location: {
              address: row.address || row.Address || 'N/A',
              city: row.city || row.City || 'N/A',
              state: row.state || row.State || 'N/A',
              pincode: String(row.pincode || row.Pincode || ''),
              lat: row.lat || row.Lat ? parseFloat(row.lat || row.Lat) : null,
              lng: row.lng || row.Lng ? parseFloat(row.lng || row.Lng) : null,
            } as any,
            specs: {
              areaSqft: row.areaSqft || row.AreaSqft ? parseFloat(row.areaSqft || row.AreaSqft) : null,
              bedrooms: row.bedrooms || row.Bedrooms ? parseInt(row.bedrooms || row.Bedrooms) : null,
              bathrooms: row.bathrooms || row.Bathrooms ? parseInt(row.bathrooms || row.Bathrooms) : null,
              facing: row.facing || row.Facing,
            } as any,
            amenities: row.amenities ? row.amenities.split(',').map((a: string) => a.trim()) : [],
            internalNotes: row.internalNotes || row.InternalNotes,
          },
        });

        // If lat/lng were NOT provided but a googleMapsLink was, try to extract them
        const gMapsLink = row.googleMapsLink || row.GoogleMapsLink;
        if (gMapsLink && (!property.location['lat'] || !property.location['lng'])) {
          const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
          const match = String(gMapsLink).match(regex);
          if (match && match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            await this.prisma.property.update({
              where: { id: property.id },
              data: {
                location: {
                  ...(property.location as any),
                  lat,
                  lng,
                },
              },
            });
            // Update local property object for nearby facility check
            (property.location as any).lat = lat;
            (property.location as any).lng = lng;
          }
        }

        results.success++;
        
        // Background tasks
        const loc = property.location as any;
        if (loc?.lat && loc?.lng) {
          this.smartLinksService.fetchNearbyFacilities(property.id, loc.lat, loc.lng).catch(() => {});
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rowIndex,
          title: row.title || 'Unknown',
          error: (err as Error).message,
        });
      }
    }

    await this.audit.log({
      actorUserId: userId,
      action: 'bulk_upload_properties',
      entityType: 'Property',
      entityId: 'multiple',
      metadata: { success: results.success, failed: results.failed },
    });

    return results;
  }

  // ---------------------------------------------------------------------------
  // List (current user)
  // ---------------------------------------------------------------------------
  async findManyForUser(userId: string, query: ListPropertiesQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true, role: true },
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    const where: Prisma.PropertyWhereInput = {
      OR: [
        { ownerUserId: userId },
        { assignments: { some: { agentId: userId } } },
        ...(user?.role === 'AGENCY_ADMIN' && user.agencyId ? [{ agencyId: user.agencyId }] : []),
      ],
      ...(query.status ? { status: query.status } : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.transactionType ? { transactionType: query.transactionType } : {}),
      ...(query.city ? {
        location: {
          path: ['city'],
          equals: query.city.toLowerCase().trim(),
        },
      } : {}),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined)
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              {
                location: {
                  path: ['city'],
                  string_contains: query.q,
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      sortBy === 'price' ? { price: sortDir } : { [sortBy]: sortDir };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          media: {
            orderBy: { orderIndex: 'asc' },
            take: 3,
          },
          _count: {
            select: { smartLinks: true, leads: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const sanitizedItems = items.map((item) => this.sanitizeProperty(item));
    return { items: sanitizedItems, total, page, pageSize };
  }

  // ---------------------------------------------------------------------------
  // Get one (owner OR agency member)
  // ---------------------------------------------------------------------------
  async findById(userId: string, id: string, agencyId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        media: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { smartLinks: true, leads: true } },
        smartLinks: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const isOwner = property.ownerUserId === userId;
    const isAgencyMember =
      agencyId !== undefined && agencyId !== null && property.agencyId === agencyId;

    if (!isOwner && !isAgencyMember) {
      throw new ForbiddenException('Access denied');
    }

    return this.sanitizeProperty(property);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  async update(userId: string, id: string, dto: UpdatePropertyDto) {
    await this.assertOwner(userId, id);

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.propertyType !== undefined ? { propertyType: dto.propertyType } : {}),
        ...(dto.transactionType !== undefined ? { transactionType: dto.transactionType } : {}),
        ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
        ...(dto.priceNegotiable !== undefined ? { priceNegotiable: dto.priceNegotiable } : {}),
        ...(dto.priceOnRequest !== undefined ? { priceOnRequest: dto.priceOnRequest } : {}),
        ...(dto.ownershipType !== undefined ? { ownershipType: dto.ownershipType } : {}),
        ...(dto.location !== undefined
          ? { location: dto.location as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.specs !== undefined
          ? { specs: dto.specs as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.approvals !== undefined
          ? { approvals: dto.approvals as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.amenities !== undefined
          ? { amenities: dto.amenities as unknown as Prisma.InputJsonValue }
          : {}),
        ...(dto.internalNotes !== undefined ? { internalNotes: dto.internalNotes } : {}),
        ...(dto.reraId !== undefined ? { reraId: dto.reraId } : {}),
        ...(dto.lpNumber !== undefined ? { lpNumber: dto.lpNumber } : {}),
        ...(dto.isBankLoanAvailable !== undefined ? { isBankLoanAvailable: dto.isBankLoanAvailable } : {}),
      },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'update_property',
      entityType: 'Property',
      entityId: id,
    });

    await this.invalidatePropertyCache(id);

    return property;
  }

  // ---------------------------------------------------------------------------
  // Archive (soft delete)
  // ---------------------------------------------------------------------------
  async archive(userId: string, id: string) {
    await this.assertOwner(userId, id);

    const property = await this.prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.ARCHIVED },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'archive_property',
      entityType: 'Property',
      entityId: id,
    });

    await this.invalidatePropertyCache(id);

    return property;
  }

  // ---------------------------------------------------------------------------
  // Unique Cities
  // ---------------------------------------------------------------------------
  async getUniqueCities(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true, role: true },
    });

    const where: Prisma.PropertyWhereInput = {
      OR: [
        { ownerUserId: userId },
        { assignments: { some: { agentId: userId } } },
        ...(user?.role === 'AGENCY_ADMIN' && user.agencyId ? [{ agencyId: user.agencyId }] : []),
      ],
      status: { not: PropertyStatus.ARCHIVED },
    };

    const properties = await this.prisma.property.findMany({
      where,
      select: { location: true },
    });

    const cities = new Set<string>();
    properties.forEach((p) => {
      const loc = p.location as any;
      if (loc && typeof loc.city === 'string') {
        cities.add(loc.city.trim().toLowerCase());
      }
    });

    return Array.from(cities).sort();
  }

  // ---------------------------------------------------------------------------
  // Add media
  // ---------------------------------------------------------------------------
  async addMedia(userId: string, id: string, files: Express.Multer.File[]) {
    this.logger.log(`addMedia called for property ${id} with ${files?.length} files`);
    
    try {
      await this.processMediaUpload(userId, id, files);

      const updatedProperty = await this.prisma.property.findUnique({
        where: { id },
        include: { media: { orderBy: { orderIndex: 'asc' } } },
      });
      return this.sanitizeProperty(updatedProperty);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`addMedia FAILED: ${(err as Error).message}`, (err as Error).stack);
      throw new BadRequestException(`Media upload failed: ${(err as Error).message}`);
    }
  }

  /**
   * Internal helper to handle media upload and storage.
   */
  private async processMediaUpload(
    userId: string,
    id: string,
    files: Express.Multer.File[],
    options: { skipAuth?: boolean } = {},
  ) {
    if (!options.skipAuth) {
      await this.assertOwner(userId, id);
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files received or empty files list');
    }

    if (files.length > MAX_MEDIA_PER_UPLOAD) {
      throw new BadRequestException(`Cannot upload more than ${MAX_MEDIA_PER_UPLOAD} files at once`);
    }

    for (const file of files) {
      if (file.size > MAX_MEDIA_FILE_SIZE) {
        throw new BadRequestException(`File ${file.originalname} exceeds the 10 MB limit`);
      }
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException(`File ${file.originalname} has no content.`);
      }
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (subscription) {
      const limits = subscription.plan.limits as Record<string, unknown>;
      const photosLimit = limits['photosPerProperty'] as number | undefined;
      if (photosLimit !== undefined && photosLimit !== -1) {
        const existingCount = await this.prisma.propertyMedia.count({ where: { propertyId: id } });
        if (existingCount + files.length > photosLimit) {
          throw new ForbiddenException(`Photo limit (${photosLimit}) reached`);
        }
      }
    }

    const existingCover = await this.prisma.propertyMedia.findFirst({
      where: { propertyId: id, isCover: true },
    });

    const uploadedMedia = await Promise.all(
      files.map(async (file, index) => {
        const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.mimetype);
        const key = this.storage.generateKey(`properties/${id}/media`, file.originalname);
        let result;
        if (!isImage) {
          const res = await this.storage.uploadFile(file.buffer, key, file.mimetype);
          result = { fileUrl: res.fileUrl, cdnUrl: res.fileUrl, sizeBytes: file.size, width: null, height: null };
        } else {
          result = await this.storage.uploadImage(file.buffer, key, file.mimetype);
        }
        return { file, result, index, isImage };
      }),
    );

    const existingMax = await this.prisma.propertyMedia.findFirst({
      where: { propertyId: id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const baseOrderIndex = (existingMax?.orderIndex ?? -1) + 1;

    return this.prisma.$transaction(
      uploadedMedia.map(({ result, index, isImage }) =>
        this.prisma.propertyMedia.create({
          data: {
            propertyId: id,
            fileUrl: result.fileUrl,
            cdnUrl: result.cdnUrl,
            fileType: isImage ? 'PHOTO' : 'AUDIO',
            orderIndex: baseOrderIndex + index,
            isCover: !existingCover && index === 0 && isImage,
            sizeBytes: BigInt(result.sizeBytes),
            width: result.width,
            height: result.height,
          },
        }),
      ),
    );
  }


  // ---------------------------------------------------------------------------
  // Remove media
  // ---------------------------------------------------------------------------
  async removeMedia(userId: string, id: string, mediaId: string) {
    await this.assertOwner(userId, id);

    const media = await this.prisma.propertyMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.propertyId !== id) {
      throw new NotFoundException('Media not found');
    }

    await this.storage.deleteFile(media.fileUrl);
    await this.prisma.propertyMedia.delete({ where: { id: mediaId } });

    // If deleted media was cover, reassign to next available
    if (media.isCover) {
      const next = await this.prisma.propertyMedia.findFirst({
        where: { propertyId: id },
        orderBy: { orderIndex: 'asc' },
      });
      if (next) {
        await this.prisma.propertyMedia.update({
          where: { id: next.id },
          data: { isCover: true },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reorder media
  // ---------------------------------------------------------------------------
  async reorderMedia(userId: string, id: string, dto: ReorderMediaDto) {
    await this.assertOwner(userId, id);

    await this.prisma.$transaction(
      dto.order.map((item) =>
        this.prisma.propertyMedia.updateMany({
          where: { id: item.id, propertyId: id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );

    const media = await this.prisma.propertyMedia.findMany({
      where: { propertyId: id },
      orderBy: { orderIndex: 'asc' },
    });
    return media.map((m) => this.sanitizeMedia(m));
  }

  // ---------------------------------------------------------------------------
  // Set cover
  // ---------------------------------------------------------------------------
  async setCover(userId: string, id: string, mediaId: string) {
    await this.assertOwner(userId, id);

    const media = await this.prisma.propertyMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.propertyId !== id) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.$transaction([
      this.prisma.propertyMedia.updateMany({
        where: { propertyId: id },
        data: { isCover: false },
      }),
      this.prisma.propertyMedia.update({
        where: { id: mediaId },
        data: { isCover: true },
      }),
    ]);

    const allMedia = await this.prisma.propertyMedia.findMany({
      where: { propertyId: id },
      orderBy: { orderIndex: 'asc' },
    });
    return allMedia.map((m) => this.sanitizeMedia(m));
  }

  // ---------------------------------------------------------------------------
  // Submit for verification
  // ---------------------------------------------------------------------------
  async submitForVerification(userId: string, id: string) {
    const property = await this.assertOwner(userId, id);

    if (
      property.verificationStatus !== VerificationStatus.UNVERIFIED &&
      property.verificationStatus !== VerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Property must be UNVERIFIED or REJECTED to submit for verification',
      );
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data: { verificationStatus: VerificationStatus.SUBMITTED },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'submit_verification',
      entityType: 'Property',
      entityId: id,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Change status
  // ---------------------------------------------------------------------------
  async changeStatus(userId: string, id: string, status: PropertyStatus) {
    await this.assertOwner(userId, id);

    const property = await this.prisma.property.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'change_property_status',
      entityType: 'Property',
      entityId: id,
      metadata: { status },
    });

    await this.invalidatePropertyCache(id);

    return property;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  private sanitizeMedia(media: any) {
    if (!media) return media;
    return {
      ...media,
      sizeBytes: media.sizeBytes !== null && media.sizeBytes !== undefined ? Number(media.sizeBytes) : null,
    };
  }

  private sanitizeProperty(property: any) {
    if (!property) return property;
    const sanitized = { ...property };
    if (property.media) {
      sanitized.media = property.media.map((m: any) => this.sanitizeMedia(m));
    }
    return sanitized;
  }

  private async assertOwner(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerUserId !== userId) throw new ForbiddenException('Access denied');
    return property;
  }

  private async invalidatePropertyCache(propertyId: string) {
    try {
      const links = await this.prisma.smartLink.findMany({
        where: { propertyId },
        select: { slug: true }
      });
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const secret = process.env.REVALIDATION_SECRET || '';

      await Promise.all(links.map(async (link) => {
        const tag = `property-${link.slug}`;
        await fetch(`${frontendUrl}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag, secret }),
        }).catch(() => {});
      }));
    } catch (err) {
      this.logger.warn(`Failed to invalidate cache for property ${propertyId}`, err);
    }
  }
}
