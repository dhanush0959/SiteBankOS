import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { SmartLinkStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { createHash, randomUUID } from 'crypto';
import type { CreateSmartLinkDto } from './dto/create-smart-link.dto';
import type { UpdateSmartLinkDto } from './dto/update-smart-link.dto';
import type { TrackEventDto } from './dto/track-event.dto';
import { PublicChatDto } from './dto/public-chat.dto';

const BCRYPT_ROUNDS = 12;
const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LENGTH = 10;
const generateSlug = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH);

export interface PublicSmartLinkResponse {
  property: {
    title: string;
    propertyType?: string;
    aiGeneratedDescription?: string;
    price?: string;
    priceOnRequest: boolean;
    priceNegotiable?: boolean;
    location: { address: string; city: string; state?: string; lat?: number; lng?: number };
    verificationStatus: string;
    specs?: Record<string, unknown>;
    amenities?: string[] | null;
    nearbyAmenities?: { category: string; name: string; distanceKm: number; rating?: number }[];
    media?: { fileUrl: string; cdnUrl: string | null; isCover: boolean; fileType: string }[];
  };
  agent: {
    name: string;
    phone?: string;
    whatsappNumber?: string;
    profilePhotoUrl?: string;
    agencyName?: string;
  };
  smartLink: { slug: string; status: string };
}

@Injectable()
export class SmartLinksService {
  private readonly logger = new Logger(SmartLinksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {}

  // ─── Authenticated operations ──────────────────────────────────────────────

  async create(userId: string, dto: CreateSmartLinkDto) {
    // Verify property ownership
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: { ownerUserId: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this property');
    }

    // Generate unique slug — retry up to 3 times on conflict
    let slug = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      slug = generateSlug();
      const existing = await this.prisma.smartLink.findUnique({ where: { slug } });
      if (!existing) break;
      if (attempt === 2) {
        throw new Error('Failed to generate unique slug after 3 attempts');
      }
    }

    const expiryAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
      : undefined;

    const smartLink = await this.prisma.smartLink.create({
      data: {
        propertyId: dto.propertyId,
        slug,
        expiryAt,
        passwordHash,
      },
      include: { property: { select: { title: true } } },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'smart_link_created',
      entityType: 'SmartLink',
      entityId: smartLink.id,
      metadata: { slug, propertyId: dto.propertyId },
    });

    return smartLink;
  }

  async findAll(
    userId: string,
    query: { propertyId?: string; status?: SmartLinkStatus; page?: number; pageSize?: number },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      property: { ownerUserId: userId },
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.smartLink.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { title: true, propertyType: true } },
          _count: { select: { events: true } },
        },
      }),
      this.prisma.smartLink.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(userId: string, id: string) {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id },
      include: {
        property: { select: { ownerUserId: true, title: true, propertyType: true } },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!smartLink) throw new NotFoundException('SmartLink not found');
    if (smartLink.property.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this smart link');
    }

    return smartLink;
  }

  async update(userId: string, id: string, dto: UpdateSmartLinkDto) {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id },
      include: { property: { select: { ownerUserId: true } } },
    });

    if (!smartLink) throw new NotFoundException('SmartLink not found');
    if (smartLink.property.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this smart link');
    }

    const expiryAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // password=null → clear; password=string → hash; undefined → no change
    let passwordHash: string | null | undefined;
    if (dto.password === null) {
      passwordHash = null;
    } else if (typeof dto.password === 'string') {
      passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    const updated = await this.prisma.smartLink.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(expiryAt !== undefined ? { expiryAt } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'smart_link_updated',
      entityType: 'SmartLink',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  async remove(userId: string, id: string) {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id },
      include: { property: { select: { ownerUserId: true } } },
    });

    if (!smartLink) throw new NotFoundException('SmartLink not found');
    if (smartLink.property.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this smart link');
    }

    await this.prisma.smartLink.delete({ where: { id } });

    await this.audit.log({
      actorUserId: userId,
      action: 'smart_link_deleted',
      entityType: 'SmartLink',
      entityId: id,
      metadata: { slug: smartLink.slug },
    });
  }

  async regenerateSlug(userId: string, id: string) {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id },
      include: { property: { select: { ownerUserId: true } } },
    });

    if (!smartLink) throw new NotFoundException('SmartLink not found');
    if (smartLink.property.ownerUserId !== userId) {
      throw new ForbiddenException('You do not own this smart link');
    }

    // Generate new unique slug + audit-log in a transaction
    let newSlug = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      newSlug = generateSlug();
      const existing = await this.prisma.smartLink.findUnique({ where: { slug: newSlug } });
      if (!existing) break;
      if (attempt === 2) {
        throw new Error('Failed to generate unique slug after 3 attempts');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.smartLink.update({
        where: { id },
        data: { slug: newSlug },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'regenerate_slug',
          entityType: 'SmartLink',
          entityId: id,
          metadata: { oldSlug: smartLink.slug, newSlug },
        },
      });
      return result;
    });

    return updated;
  }

  // ─── Public operations ─────────────────────────────────────────────────────

  async verifyPassword(slug: string, password: string): Promise<{ ok: boolean }> {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { slug },
      select: { passwordHash: true },
    });

    if (!smartLink || !smartLink.passwordHash) {
      return { ok: false };
    }

    const ok = await bcrypt.compare(password, smartLink.passwordHash);
    return { ok };
  }

  async getPublic(slug: string, submittedPassword?: string): Promise<PublicSmartLinkResponse> {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { slug },
      include: {
        property: {
          include: {
            owner: {
              include: {
                ownedAgency: true,
                agency: true,
              },
            },
            nearbyAmenities: {
              orderBy: [{ category: 'asc' }, { distanceKm: 'asc' }],
            },
            media: {
              orderBy: [{ isCover: 'desc' }, { orderIndex: 'asc' }],
              take: 12,
              select: { fileUrl: true, cdnUrl: true, isCover: true, fileType: true },
            },
          },
        },
      },
    });

    if (!smartLink) {
      throw new NotFoundException('Smart link not found');
    }

    // Check expiry — update status on the fly
    if (smartLink.expiryAt && smartLink.expiryAt < new Date()) {
      if (smartLink.status !== SmartLinkStatus.EXPIRED) {
        await this.prisma.smartLink.update({
          where: { id: smartLink.id },
          data: { status: SmartLinkStatus.EXPIRED },
        }).catch((err) => this.logger.warn('Failed to mark link as expired', err));
      }
      throw new GoneException({ status: SmartLinkStatus.EXPIRED, slug });
    }

    // If not active (but not expired by timer), still return 410 with status info
    if (smartLink.status !== SmartLinkStatus.ACTIVE) {
      throw new GoneException({ status: smartLink.status, slug });
    }

    // Password check
    if (smartLink.passwordHash) {
      if (!submittedPassword) {
        throw new UnauthorizedException('Password required');
      }
      const valid = await bcrypt.compare(submittedPassword, smartLink.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    const { property } = smartLink;
    const owner = property.owner;
    const agencyName = owner.ownedAgency?.name ?? owner.agency?.name;

    // Parse location JSON safely
    const locationRaw = property.location as Record<string, unknown>;
    const lat = typeof locationRaw['lat'] === 'number' ? locationRaw['lat'] : NaN;
    const lng = typeof locationRaw['lng'] === 'number' ? locationRaw['lng'] : NaN;

    // If nearby amenities are missing, trigger a background fetch for next time
    if (property.nearbyAmenities.length === 0 && !isNaN(lat) && !isNaN(lng)) {
      this.fetchNearbyFacilities(property.id, lat, lng).catch(() => {});
    }

    return {
      property: {
        title: property.title,
        propertyType: property.propertyType ?? undefined,
        aiGeneratedDescription: property.aiGeneratedDescription ?? undefined,
        price: property.price != null ? property.price.toString() : undefined,
        priceOnRequest: property.priceOnRequest,
        priceNegotiable: property.priceNegotiable,
        location: {
          address: (locationRaw['address'] as string | undefined) ?? '',
          city: (locationRaw['city'] as string | undefined) ?? '',
          state: (locationRaw['state'] as string | undefined) ?? undefined,
          lat: isNaN(lat) ? undefined : lat,
          lng: isNaN(lng) ? undefined : lng,
        },
        verificationStatus: property.verificationStatus,
        specs: (property.specs ?? {}) as Record<string, unknown>,
        amenities: Array.isArray(property.amenities)
          ? (property.amenities as string[])
          : null,
        nearbyAmenities: property.nearbyAmenities.map(a => ({
          category: a.category,
          name: a.name,
          distanceKm: a.distanceKm,
          rating: a.rating ?? undefined,
        })),
        media: property.media
          .filter((m) => m.fileType === 'PHOTO' || m.fileType === 'THUMBNAIL' || m.fileType === 'AUDIO')
          .map((m) => ({ fileUrl: m.fileUrl, cdnUrl: m.cdnUrl, isCover: m.isCover, fileType: m.fileType })),
      },
      agent: {
        name: owner.name,
        phone: owner.phone ?? undefined,
        whatsappNumber: owner.whatsappNumber ?? undefined,
        profilePhotoUrl: owner.profilePhotoUrl ?? undefined,
        agencyName,
      },
      smartLink: {
        slug: smartLink.slug,
        status: smartLink.status,
      },
    };
  }

  async trackEvent(
    slug: string,
    dto: TrackEventDto,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!smartLink) {
      throw new NotFoundException('Smart link not found');
    }

    const ipHash = createHash('sha256')
      .update(ip + (process.env['IP_HASH_SALT'] ?? 'sitebank'))
      .digest('hex')
      .substring(0, 16);

    const deviceHash = createHash('sha256')
      .update(userAgent + (process.env['IP_HASH_SALT'] ?? 'sitebank'))
      .digest('hex')
      .substring(0, 16);

    await this.prisma.linkEvent.create({
      data: {
        smartLinkId: smartLink.id,
        eventType: dto.eventType,
        sessionId: dto.sessionId,
        referrer: dto.referrer,
        timeOnPageSeconds: dto.timeOnPageSeconds,
        scrollDepthPct: dto.scrollDepthPct,
        ipHash,
        deviceHash,
      },
    });
  }

  async fetchNearbyFacilities(propertyId: string, lat: number, lng: number): Promise<string> {
    // 1. Check Database for cached amenities
    const cached = await this.prisma.nearbyAmenity.findMany({
      where: { propertyId },
      orderBy: [{ category: 'asc' }, { distanceKm: 'asc' }],
    });

    if (cached.length > 0) {
      return this.formatAmenitiesSummary(cached);
    }

    // 2. Fetch from External API
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    let amenities: Array<{
      category: string;
      name: string;
      distanceKm: number;
      rating?: number;
      lat?: number;
      lng?: number;
    }> = [];

    if (apiKey) {
      const cleanKey = apiKey.split('&')[0] ?? apiKey;
      amenities = await this.fetchFromGoogleMaps(lat, lng, cleanKey);
    } else {
      amenities = await this.fetchFromOSM(lat, lng);
    }

    // 3. Store results in Database
    if (amenities.length > 0) {
      try {
        await this.prisma.nearbyAmenity.createMany({
          data: amenities.map((a) => ({
            propertyId,
            category: a.category,
            name: a.name,
            distanceKm: a.distanceKm,
            rating: a.rating,
            lat: a.lat,
            lng: a.lng,
          })),
        });
      } catch (err) {
        this.logger.error(`Failed to cache nearby amenities for property ${propertyId}`, err);
      }
    }

    return this.formatAmenitiesSummary(amenities);
  }

  private async fetchFromGoogleMaps(
    lat: number,
    lng: number,
    apiKey: string,
  ): Promise<
    Array<{ category: string; name: string; distanceKm: number; rating?: number; lat?: number; lng?: number }>
  > {
    const categories = [
      { type: 'school', radius: 5000, label: 'School', keyword: 'school' },
      { type: 'hospital', radius: 7000, label: 'Hospital', keyword: 'hospital' },
      { type: 'university', radius: 5000, label: 'College/University', keyword: 'college' },
      { type: 'subway_station', radius: 10000, label: 'Metro Station', keyword: 'metro' },
      { type: 'bus_station', radius: 3000, label: 'Bus Stop', keyword: 'bus stop' },
      { type: 'shopping_mall', radius: 8000, label: 'Mall', keyword: 'mall' },
      { type: 'supermarket', radius: 3000, label: 'Grocery Store', keyword: 'supermarket' },
      { type: 'restaurant', radius: 2000, label: 'Restaurant', keyword: 'restaurant' },
      { type: 'park', radius: 3000, label: 'Park', keyword: 'park' },
    ];

    const results: any[] = [];

    for (const cat of categories) {
      try {
        // Migration to Places API (New) - v1
        const url = 'https://places.googleapis.com/v1/places:searchNearby';
        const body = {
          includedTypes: [cat.type],
          maxResultCount: 5,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: cat.radius,
            },
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.rating',
          },
          body: JSON.stringify(body),
        });

        const data = (await response.json()) as any;

        if (response.ok && data.places) {
          const topResults = data.places.map((p: any) => ({
            category: cat.label,
            name: p.displayName?.text || 'Unnamed Facility',
            distanceKm: this.haversineDistance(
              lat,
              lng,
              p.location.latitude,
              p.location.longitude,
            ),
            rating: p.rating,
            lat: p.location.latitude,
            lng: p.location.longitude,
          }));
          results.push(...topResults);
        } else if (!response.ok) {
          this.logger.error(`Google Places (New) failure [${cat.label}]: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        this.logger.warn(`Google Maps fetch failed for category ${cat.label}`, err);
      }
    }

    return results;
  }

  private async fetchFromOSM(
    lat: number,
    lng: number,
  ): Promise<
    Array<{ category: string; name: string; distanceKm: number; rating?: number; lat?: number; lng?: number }>
  > {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"~"school|college|university|hospital"](around:5000, ${lat}, ${lng});
        way["amenity"~"school|college|university|hospital"](around:5000, ${lat}, ${lng});
        node["shop"="mall"](around:8000, ${lat}, ${lng});
        way["shop"="mall"](around:8000, ${lat}, ${lng});
        node["leisure"="park"](around:3000, ${lat}, ${lng});
        way["leisure"="park"](around:3000, ${lat}, ${lng});
        node["railway"="station"](around:10000, ${lat}, ${lng});
        node["highway"="bus_stop"](around:3000, ${lat}, ${lng});
      );
      out center 50;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'SiteBank/1.0'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`OSM failed: ${response.status}`);
      const data = (await response.json()) as any;

      const results: any[] = [];
      if (!data.elements) return [];

      for (const el of data.elements) {
        const itemLat = el.lat ?? el.center?.lat;
        const itemLon = el.lon ?? el.center?.lon;
        const name = el.tags?.['name'] || el.tags?.['operator'] || 'Unnamed Facility';
        if (!itemLat || !itemLon) continue;

        let category = 'Facility';
        const amenity = el.tags?.['amenity'];
        const shop = el.tags?.['shop'];
        const leisure = el.tags?.['leisure'];
        const railway = el.tags?.['railway'];
        const highway = el.tags?.['highway'];

        if (amenity === 'school') category = 'School';
        else if (amenity === 'college' || amenity === 'university') category = 'College/University';
        else if (amenity === 'hospital') category = 'Hospital';
        else if (shop === 'mall') category = 'Mall';
        else if (leisure === 'park') category = 'Park';
        else if (railway === 'station') category = 'Train/Metro Station';
        else if (highway === 'bus_stop') category = 'Bus Stop';

        results.push({
          category,
          name,
          distanceKm: this.haversineDistance(lat, lng, itemLat, itemLon),
          lat: itemLat,
          lng: itemLon,
        });
      }
      return results;
    } catch (err) {
      this.logger.warn('OSM fallback fetch failed', err);
      return [];
    }
  }

  private formatAmenitiesSummary(amenities: any[]): string {
    if (amenities.length === 0) {
      return 'No major facilities found within the search radius of this property location.';
    }

    const grouped: Record<string, string[]> = {};
    for (const item of amenities) {
      if (!grouped[item.category]) grouped[item.category] = [];
      if (grouped[item.category].length < 5) {
        grouped[item.category].push(`${item.name} (${item.distanceKm.toFixed(2)} km)`);
      }
    }

    let summary = 'Nearby Facilities (Verified):\n';
    for (const [cat, items] of Object.entries(grouped)) {
      summary += `- **${cat}**:\n  ` + items.join('\n  ') + '\n';
    }

    summary += '\n*Nearby amenities and distances are approximate and may change over time.*';
    return summary;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  async chat(slug: string, dto: PublicChatDto): Promise<{ id: string; replyToId?: string; answer: string }> {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { slug },
      include: {
        property: {
          include: {
            owner: {
              include: {
                ownedAgency: true,
                agency: true,
              },
            },
          },
        },
      },
    });

    if (!smartLink) {
      throw new NotFoundException('Smart link not found');
    }

    const { property } = smartLink;
    const owner = property.owner;
    const locationRaw = (property.location ?? {}) as Record<string, unknown>;

    const lat = typeof locationRaw['lat'] === 'number' ? locationRaw['lat'] : NaN;
    const lng = typeof locationRaw['lng'] === 'number' ? locationRaw['lng'] : NaN;

    let nearbyFacilitiesSummary = 'No coordinates available for nearby facilities lookup.';
    if (!isNaN(lat) && !isNaN(lng)) {
      nearbyFacilitiesSummary = await this.fetchNearbyFacilities(property.id, lat, lng);
    }

    const systemPrompt = `
You are a premium property assistant for the property listing "${property.title}".
Your job is to assist potential buyers by answering questions strictly related to this property and its surrounding location/facilities.

Property Information:
- Title: ${property.title}
- Property Type: ${property.propertyType || 'N/A'}
- Transaction Type: ${property.transactionType || 'N/A'}
- Price: ${property.price ? `${property.price.toString()} INR` : 'On Request'}
- Description: ${property.aiGeneratedDescription || 'No description available.'}
- Location Address: ${locationRaw['address'] || 'N/A'}, ${locationRaw['city'] || 'N/A'}, ${locationRaw['state'] || 'N/A'}
- Specs: ${JSON.stringify(property.specs || {})}
- Amenities: ${Array.isArray(property.amenities) ? property.amenities.join(', ') : 'None listed'}

${nearbyFacilitiesSummary}

CRITICAL RULES:
1. Only answer questions related to this property, its details, specs, price, location, and the surrounding facilities/neighborhood.
2. If the user asks a question that is not related to this property (for example: programming questions, recipes, unrelated news, general knowledge, writing code, or chat about other topics), politely decline to answer, stating that you are only here to help with this property listing.
3. Be professional, helpful, and welcoming. Keep your answers concise, engaging, and premium.
`;

    if (this.aiService.isConfigured()) {
      try {
        console.log(`[Chat] Attempting AI generation for slug: ${slug}`);
        const answer = await this.aiService.chatConversation(
          systemPrompt,
          dto.messages,
          { temperature: 0.3, max_tokens: 400 }
        );
        console.log(`[Chat] AI generated answer length: ${answer?.length || 0}`);
        return { id: randomUUID(), replyToId: dto.messages[dto.messages.length - 1]?.id, answer: answer || 'I am sorry, I could not generate a response.' };
      } catch (err) {
        this.logger.error('DeepSeek AI execution failed, falling back to mock response', err);
        console.error('[Chat] AI error:', err);
      }
    } else {
      console.log('[Chat] AI service not configured, using fallback engine');
    }

    // Heuristic Fallback Engine
    const lastMessageObj = dto.messages[dto.messages.length - 1];
    const q = (lastMessageObj?.content || '').toLowerCase();
    console.log(`[Chat] Fallback engine processing question: "${q}"`);
    const replyToId = lastMessageObj?.id;
    const responseId = randomUUID();
    let answer = '';

    if (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('rate') || q.includes('pricing')) {
      answer = property.priceOnRequest
        ? `The pricing for ${property.title} is available on request. Please reach out to the listing agent, ${owner.name}, to get the current quote.`
        : `The price for ${property.title} is ₹${property.price ? parseFloat(property.price.toString()).toLocaleString('en-IN') : '—'}.${property.priceNegotiable ? ' The price is negotiable.' : ''}`;
    } else if (q.includes('location') || q.includes('address') || q.includes('where is') || q.includes('situated')) {
      answer = `${property.title} is located at: ${locationRaw['address'] || ''}, ${locationRaw['city'] || ''}, ${locationRaw['state'] || ''}.`;
    } else if (q.includes('school') || q.includes('college') || q.includes('university') || q.includes('mall') || q.includes('hospital') || q.includes('park') || q.includes('station') || q.includes('near') || q.includes('around') || q.includes('facility') || q.includes('facilities')) {
      answer = `Based on the location map coordinates, here is what is nearby:\n\n${nearbyFacilitiesSummary}`;
    } else if (q.includes('bedroom') || q.includes('bhk') || q.includes('bathroom') || q.includes('sqft') || q.includes('area') || q.includes('size') || q.includes('specs') || q.includes('specification')) {
      const specs = (property.specs ?? {}) as Record<string, unknown>;
      const specLines = Object.entries(specs)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `- **${k.replace(/([A-Z])/g, ' $1').trim()}**: ${v}`);
      
      answer = `Here are the specifications for ${property.title}:\n\n` + 
        (specLines.length > 0 ? specLines.join('\n') : 'No detailed specifications have been shared yet.');
    } else if (q.includes('amenities') || q.includes('amenity') || q.includes('pool') || q.includes('gym') || q.includes('club') || q.includes('wifi') || q.includes('parking')) {
      const amenities = Array.isArray(property.amenities) ? property.amenities : [];
      answer = amenities.length > 0
        ? `The property features the following amenities:\n\n${amenities.map(a => `- ${a}`).join('\n')}`
        : `No specific amenities have been registered for this property listing.`;
    } else if (q.includes('agent') || q.includes('broker') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('whatsapp')) {
      answer = `This property is listed by agent **${owner.name}**${owner.ownedAgency?.name ? ` from **${owner.ownedAgency.name}**` : ''}. You can contact them at ${owner.phone || 'the details listed on the page'} or chat with them directly on WhatsApp.`;
    } else if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('greetings')) {
      answer = `Hello! I am your premium virtual property assistant for **${property.title}**. How can I help you today? You can ask me about pricing, specifications, amenities, or nearby schools/hospitals/malls!`;
    } else if (q.includes('desc') || q.includes('about') || q.includes('details') || q.includes('info')) {
      answer = property.aiGeneratedDescription 
        ? `Here is an overview of the property:\n\n${property.aiGeneratedDescription}`
        : `This is a premium listing for ${property.title} (${property.propertyType || 'Residential'}). Let me know if you have questions about specific details!`;
    } else {
      answer = `I can only answer questions related to this property (${property.title}) and its nearby location/facilities. Please let me know if you would like information about its price, specifications, amenities, or local neighborhood details!`;
    }

    return { id: responseId, replyToId, answer };
  }
}
