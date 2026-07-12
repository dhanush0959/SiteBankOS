import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditQueryDto } from './dto/audit-query.dto';

interface AuditLogInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

interface QueryScope {
  agencyId?: string;
}

export interface QueryResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    if (input.actorUserId === 'system') {
      // Don't write system events to audit log
      return;
    }
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  async query(filters: AuditQueryDto, scope: QueryScope): Promise<QueryResult<unknown>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build base where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;

    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    // When scoped to an agency, restrict to actors belonging to that agency
    if (scope.agencyId) {
      const members = await this.prisma.user.findMany({
        where: { agencyId: scope.agencyId },
        select: { id: true },
      });
      const memberIds = members.map((m) => m.id);

      // Intersect with existing actorUserId filter if present
      if (filters.actorUserId) {
        if (!memberIds.includes(filters.actorUserId)) {
          // Requested actor is not in this agency
          return { items: [], total: 0, page, pageSize };
        }
      } else {
        where.actorUserId = { in: memberIds };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string, scope: QueryScope): Promise<unknown> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { actor: { select: { id: true, name: true, email: true } } },
    });

    if (!log) throw new NotFoundException('Audit log entry not found');

    if (scope.agencyId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: log.actorUserId },
        select: { agencyId: true },
      });
      if (actor?.agencyId !== scope.agencyId) {
        throw new ForbiddenException('Access denied to this audit log entry');
      }
    }

    return log;
  }
}
