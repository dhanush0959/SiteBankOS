import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RangeOption } from './dto/range.query.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSince(range: RangeOption): Date {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return since;
}

function toBigintNumber(value: bigint | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

interface TimeseriesRow {
  date: Date;
  views: bigint;
  leads: bigint;
}

interface ReferrerRow {
  referrer: string | null;
  count: bigint;
}

interface DeviceRow {
  deviceHash: string | null;
  count: bigint;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  async getDashboard(userId: string, range: RangeOption) {
    const since = parseSince(range);

    // Totals: properties
    const [properties, activeProperties] = await Promise.all([
      this.prisma.property.count({ where: { ownerUserId: userId } }),
      this.prisma.property.count({ where: { ownerUserId: userId, status: 'ACTIVE' } }),
    ]);

    // Smart links
    const smartLinks = await this.prisma.smartLink.count({
      where: { property: { ownerUserId: userId } },
    });

    // Views & unique visitors in range
    const viewsAgg = await this.prisma.linkEvent.count({
      where: {
        eventType: 'VIEW',
        createdAt: { gte: since },
        smartLink: { property: { ownerUserId: userId } },
      },
    });

    const uniqueVisitorsResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT e."deviceHash") AS count
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."ownerUserId" = ${userId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
    `;
    const uniqueVisitors = toBigintNumber(uniqueVisitorsResult[0]?.count);

    // Leads
    const [leadsTotal, hotLeads] = await Promise.all([
      this.prisma.lead.count({
        where: { property: { ownerUserId: userId }, createdAt: { gte: since } },
      }),
      this.prisma.lead.count({
        where: { property: { ownerUserId: userId }, hotScore: { gte: 7 }, createdAt: { gte: since } },
      }),
    ]);

    // Timeseries
    const timeseries = await this.getTimeseriesForUser(userId, since);

    // Funnel
    const contactClicks = await this.prisma.linkEvent.count({
      where: {
        eventType: 'CLICK_CONTACT',
        createdAt: { gte: since },
        smartLink: { property: { ownerUserId: userId } },
      },
    });
    const leadSubmissions = await this.prisma.linkEvent.count({
      where: {
        eventType: 'LEAD_FORM_SUBMIT',
        createdAt: { gte: since },
        smartLink: { property: { ownerUserId: userId } },
      },
    });
    const conversionPct =
      viewsAgg > 0 ? parseFloat(((leadSubmissions / viewsAgg) * 100).toFixed(1)) : 0;

    // Top 5 properties by views
    const topPropertiesRaw = await this.prisma.$queryRaw<
      Array<{ propertyId: string; title: string; views: bigint; leads: bigint }>
    >`
      SELECT p.id AS "propertyId", p.title,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."ownerUserId" = ${userId}
        AND e."createdAt" >= ${since}
      GROUP BY p.id, p.title
      ORDER BY views DESC
      LIMIT 5
    `;

    const topProperties = topPropertiesRaw.map((row) => ({
      propertyId: row.propertyId,
      title: row.title,
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));

    return {
      range,
      totals: {
        properties,
        activeProperties,
        smartLinks,
        totalViews: viewsAgg,
        uniqueVisitors,
        leads: leadsTotal,
        hotLeads,
      },
      timeseries,
      funnel: {
        views: viewsAgg,
        contactClicks,
        leadSubmissions,
        conversionPct,
      },
      topProperties,
    };
  }

  // -------------------------------------------------------------------------
  // Per-property analytics
  // -------------------------------------------------------------------------

  async getPropertyAnalytics(userId: string, propertyId: string, range: RangeOption) {
    // Owner check
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerUserId: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.ownerUserId !== userId) {
      throw new ForbiddenException('Access denied: you do not own this property');
    }

    const since = parseSince(range);

    const [views, contactClicks, whatsappClicks, callClicks, leadSubmissions] = await Promise.all([
      this.prisma.linkEvent.count({
        where: { eventType: 'VIEW', createdAt: { gte: since }, smartLink: { propertyId } },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_CONTACT', createdAt: { gte: since }, smartLink: { propertyId } },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_WHATSAPP', createdAt: { gte: since }, smartLink: { propertyId } },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_CALL', createdAt: { gte: since }, smartLink: { propertyId } },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'LEAD_FORM_SUBMIT', createdAt: { gte: since }, smartLink: { propertyId } },
      }),
    ]);

    // Unique visitors
    const uniqueVisitorsResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT e."deviceHash") AS count
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      WHERE sl."propertyId" = ${propertyId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
    `;
    const uniqueVisitors = toBigintNumber(uniqueVisitorsResult[0]?.count);

    // Averages
    const avgsResult = await this.prisma.$queryRaw<
      Array<{ avgTime: number | null; avgScroll: number | null }>
    >`
      SELECT
        AVG(e."timeOnPageSeconds") AS "avgTime",
        AVG(e."scrollDepthPct") AS "avgScroll"
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      WHERE sl."propertyId" = ${propertyId}
        AND e."createdAt" >= ${since}
    `;
    const avgTimeOnPageSec = avgsResult[0]?.avgTime != null ? Math.round(Number(avgsResult[0].avgTime)) : 0;
    const avgScrollDepthPct = avgsResult[0]?.avgScroll != null ? Math.round(Number(avgsResult[0].avgScroll)) : 0;

    // Timeseries
    const timeseriesRaw = await this.prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('day', e."createdAt") AS date,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      WHERE sl."propertyId" = ${propertyId}
        AND e."createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `;
    const timeseries = timeseriesRaw.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));

    // Top 10 referrers
    const referrersRaw = await this.prisma.$queryRaw<ReferrerRow[]>`
      SELECT e."referrer", COUNT(*) AS count
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      WHERE sl."propertyId" = ${propertyId}
        AND e."createdAt" >= ${since}
        AND e."referrer" IS NOT NULL
      GROUP BY e."referrer"
      ORDER BY count DESC
      LIMIT 10
    `;
    const referrers = referrersRaw.map((row) => ({
      referrer: row.referrer ?? '',
      count: toBigintNumber(row.count),
    }));

    // Device approximation (top 10 device hashes)
    const devicesRaw = await this.prisma.$queryRaw<DeviceRow[]>`
      SELECT e."deviceHash", COUNT(*) AS count
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      WHERE sl."propertyId" = ${propertyId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
      GROUP BY e."deviceHash"
      ORDER BY count DESC
      LIMIT 10
    `;
    const devices = devicesRaw.map((row) => ({
      deviceHash: row.deviceHash ?? '',
      count: toBigintNumber(row.count),
    }));

    return {
      range,
      summary: {
        views,
        uniqueVisitors,
        contactClicks,
        whatsappClicks,
        callClicks,
        leadSubmissions,
        avgTimeOnPageSec,
        avgScrollDepthPct,
      },
      timeseries,
      referrers,
      devices,
    };
  }

  // -------------------------------------------------------------------------
  // Per-smart-link analytics
  // -------------------------------------------------------------------------

  async getSmartLinkAnalytics(userId: string, smartLinkId: string, range: RangeOption) {
    // Owner check via property
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id: smartLinkId },
      select: { propertyId: true, property: { select: { ownerUserId: true } } },
    });
    if (!smartLink) {
      throw new NotFoundException('SmartLink not found');
    }
    if (smartLink.property.ownerUserId !== userId) {
      throw new ForbiddenException('Access denied: you do not own the property for this smart link');
    }

    const since = parseSince(range);

    const [views, contactClicks, whatsappClicks, callClicks, leadSubmissions] = await Promise.all([
      this.prisma.linkEvent.count({
        where: { eventType: 'VIEW', createdAt: { gte: since }, smartLinkId },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_CONTACT', createdAt: { gte: since }, smartLinkId },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_WHATSAPP', createdAt: { gte: since }, smartLinkId },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'CLICK_CALL', createdAt: { gte: since }, smartLinkId },
      }),
      this.prisma.linkEvent.count({
        where: { eventType: 'LEAD_FORM_SUBMIT', createdAt: { gte: since }, smartLinkId },
      }),
    ]);

    // Unique visitors
    const uniqueVisitorsResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT e."deviceHash") AS count
      FROM "LinkEvent" e
      WHERE e."smartLinkId" = ${smartLinkId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
    `;
    const uniqueVisitors = toBigintNumber(uniqueVisitorsResult[0]?.count);

    // Averages
    const avgsResult = await this.prisma.$queryRaw<
      Array<{ avgTime: number | null; avgScroll: number | null }>
    >`
      SELECT
        AVG(e."timeOnPageSeconds") AS "avgTime",
        AVG(e."scrollDepthPct") AS "avgScroll"
      FROM "LinkEvent" e
      WHERE e."smartLinkId" = ${smartLinkId}
        AND e."createdAt" >= ${since}
    `;
    const avgTimeOnPageSec = avgsResult[0]?.avgTime != null ? Math.round(Number(avgsResult[0].avgTime)) : 0;
    const avgScrollDepthPct = avgsResult[0]?.avgScroll != null ? Math.round(Number(avgsResult[0].avgScroll)) : 0;

    // Timeseries
    const timeseriesRaw = await this.prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('day', e."createdAt") AS date,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      WHERE e."smartLinkId" = ${smartLinkId}
        AND e."createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `;
    const timeseries = timeseriesRaw.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));

    // Top 10 referrers
    const referrersRaw = await this.prisma.$queryRaw<ReferrerRow[]>`
      SELECT e."referrer", COUNT(*) AS count
      FROM "LinkEvent" e
      WHERE e."smartLinkId" = ${smartLinkId}
        AND e."createdAt" >= ${since}
        AND e."referrer" IS NOT NULL
      GROUP BY e."referrer"
      ORDER BY count DESC
      LIMIT 10
    `;
    const referrers = referrersRaw.map((row) => ({
      referrer: row.referrer ?? '',
      count: toBigintNumber(row.count),
    }));

    // Device approximation
    const devicesRaw = await this.prisma.$queryRaw<DeviceRow[]>`
      SELECT e."deviceHash", COUNT(*) AS count
      FROM "LinkEvent" e
      WHERE e."smartLinkId" = ${smartLinkId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
      GROUP BY e."deviceHash"
      ORDER BY count DESC
      LIMIT 10
    `;
    const devices = devicesRaw.map((row) => ({
      deviceHash: row.deviceHash ?? '',
      count: toBigintNumber(row.count),
    }));

    return {
      range,
      summary: {
        views,
        uniqueVisitors,
        contactClicks,
        whatsappClicks,
        callClicks,
        leadSubmissions,
        avgTimeOnPageSec,
        avgScrollDepthPct,
      },
      timeseries,
      referrers,
      devices,
    };
  }

  // -------------------------------------------------------------------------
  // Live counter
  // -------------------------------------------------------------------------

  async getLiveCount(userId: string, propertyId: string | undefined, minutes: number) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    if (propertyId) {
      // Verify ownership
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerUserId: true },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
      if (property.ownerUserId !== userId) {
        throw new ForbiddenException('Access denied: you do not own this property');
      }

      const count = await this.prisma.linkEvent.count({
        where: {
          createdAt: { gte: since },
          smartLink: { propertyId },
        },
      });
      return { minutes, propertyId, count };
    }

    // All properties for user
    const count = await this.prisma.linkEvent.count({
      where: {
        createdAt: { gte: since },
        smartLink: { property: { ownerUserId: userId } },
      },
    });
    return { minutes, propertyId: null, count };
  }

  async getAgencyDashboard(userId: string, range: RangeOption) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      throw new ForbiddenException('Not part of an agency');
    }

    const agencyId = user.agencyId;
    const since = parseSince(range);

    // Totals: properties
    const [properties, activeProperties] = await Promise.all([
      this.prisma.property.count({ where: { agencyId } }),
      this.prisma.property.count({ where: { agencyId, status: 'ACTIVE' } }),
    ]);

    // Views
    const viewsAgg = await this.prisma.linkEvent.count({
      where: {
        eventType: 'VIEW',
        createdAt: { gte: since },
        smartLink: { property: { agencyId } },
      },
    });

    // Unique visitors
    const uniqueVisitorsResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT e."deviceHash") AS count
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."agencyId" = ${agencyId}
        AND e."createdAt" >= ${since}
        AND e."deviceHash" IS NOT NULL
    `;
    const uniqueVisitors = toBigintNumber(uniqueVisitorsResult[0]?.count);

    // Leads
    const [leadsTotal, hotLeads] = await Promise.all([
      this.prisma.lead.count({
        where: { property: { agencyId }, createdAt: { gte: since } },
      }),
      this.prisma.lead.count({
        where: { property: { agencyId }, hotScore: { gte: 7 }, createdAt: { gte: since } },
      }),
    ]);

    // Timeseries
    const timeseries = await this.getTimeseriesForAgency(agencyId, since);

    // Funnel
    const contactClicks = await this.prisma.linkEvent.count({
      where: {
        eventType: 'CLICK_CONTACT',
        createdAt: { gte: since },
        smartLink: { property: { agencyId } },
      },
    });
    const leadSubmissions = await this.prisma.linkEvent.count({
      where: {
        eventType: 'LEAD_FORM_SUBMIT',
        createdAt: { gte: since },
        smartLink: { property: { agencyId } },
      },
    });
    const conversionPct =
      viewsAgg > 0 ? parseFloat(((leadSubmissions / viewsAgg) * 100).toFixed(1)) : 0;

    // Top 5 properties by views
    const topPropertiesRaw = await this.prisma.$queryRaw<
      Array<{ propertyId: string; title: string; views: bigint; leads: bigint }>
    >`
      SELECT p.id AS "propertyId", p.title,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."agencyId" = ${agencyId}
        AND e."createdAt" >= ${since}
      GROUP BY p.id, p.title
      ORDER BY views DESC
      LIMIT 5
    `;

    const topProperties = topPropertiesRaw.map((row) => ({
      propertyId: row.propertyId,
      title: row.title,
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));

    return {
      range,
      totals: {
        properties,
        activeProperties,
        totalViews: viewsAgg,
        uniqueVisitors,
        leads: leadsTotal,
        hotLeads,
      },
      timeseries,
      funnel: {
        views: viewsAgg,
        contactClicks,
        leadSubmissions,
        conversionPct,
      },
      topProperties,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async getTimeseriesForUser(userId: string, since: Date) {
    const rows = await this.prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('day', e."createdAt") AS date,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."ownerUserId" = ${userId}
        AND e."createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `;
    return rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));
  }

  private async getTimeseriesForAgency(agencyId: string, since: Date) {
    const rows = await this.prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('day', e."createdAt") AS date,
        COUNT(*) FILTER (WHERE e."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE e."eventType" = 'LEAD_FORM_SUBMIT') AS leads
      FROM "LinkEvent" e
      JOIN "SmartLink" sl ON sl.id = e."smartLinkId"
      JOIN "Property" p ON p.id = sl."propertyId"
      WHERE p."agencyId" = ${agencyId}
        AND e."createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `;
    return rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      views: toBigintNumber(row.views),
      leads: toBigintNumber(row.leads),
    }));
  }
}
