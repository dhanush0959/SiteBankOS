import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  GoneException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LeadStatus, ReminderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import type { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import type { CreateReminderDto } from './dto/create-reminder.dto';
import type { UpdateReminderDto } from './dto/update-reminder.dto';
import type { ListLeadsQueryDto } from './dto/list-leads-query.dto';

export interface IdempotencyContext {
  idempotencyKey: string;
  protocolVersion: string;
  payloadHash: string;
  path: string;
}
const STATUS_SCORE: Record<LeadStatus, number> = {
  NEW: 0,
  CONTACTED: 15,
  SITE_VISIT_SCHEDULED: 35,
  NEGOTIATING: 50,
  CLOSED: -100,
  DEAD: -100,
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {}

  // ───────────────────────────────────────────────
  // Hot-score helper
  // ───────────────────────────────────────────────

  private async computeHotScore(
    leadId: string | null,
    status: LeadStatus,
    phone: string | null | undefined,
    lastActivityAt: Date | null | undefined,
    agentId: string,
  ): Promise<number> {
    let score = 0;

    // Phone presence
    if (phone) score += 20;

    // Status
    score += STATUS_SCORE[status] ?? 0;

    // Recency
    const now = new Date();
    if (lastActivityAt) {
      const msSince = now.getTime() - lastActivityAt.getTime();
      const hours = msSince / (1000 * 60 * 60);
      const days = hours / 24;
      if (hours <= 24) {
        score += 20;
      } else if (days <= 7) {
        score += 10;
      } else if (days > 30) {
        score -= 10;
      }
    }

    // Reminders: 2+ DONE in last 14 days
    if (leadId) {
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const doneCount = await this.prisma.followUpReminder.count({
        where: {
          leadId,
          agentId,
          status: ReminderStatus.DONE,
          createdAt: { gte: fourteenDaysAgo },
        },
      });
      if (doneCount >= 2) score += 15;
    }

    // Clamp 0-100
    return Math.min(100, Math.max(0, score));
  }

  // ───────────────────────────────────────────────
  // Create lead (authenticated agent)
  // ───────────────────────────────────────────────

  async create(agentId: string, dto: CreateLeadDto) {
    const status = dto.status ?? LeadStatus.NEW;
    const hotScore = await this.computeHotScore(null, status, dto.phone ?? null, null, agentId);

    const lead = await this.prisma.lead.create({
      data: {
        propertyId: dto.propertyId,
        agentId,
        name: dto.name,
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
        status,
        hotScore,
        lastActivityAt: new Date(),
      },
    });

    await this.audit.log({
      actorUserId: agentId,
      action: 'create_lead',
      entityType: 'Lead',
      entityId: lead.id,
      metadata: { propertyId: dto.propertyId, source: dto.source },
    });

    return lead;
  }

  // ───────────────────────────────────────────────
  // List leads for current agent (paginated)
  // ───────────────────────────────────────────────

  async findManyForAgent(agentId: string, query: ListLeadsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    const where: Prisma.LeadWhereInput = {
      agentId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.hotScoreMin !== undefined ? { hotScore: { gte: query.hotScoreMin } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { phone: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.LeadOrderByWithRelationInput =
      sortBy === 'lastActivityAt'
        ? { lastActivityAt: sortDir }
        : sortBy === 'hotScore'
          ? { hotScore: sortDir }
          : { createdAt: sortDir };

    const [total, items] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          property: { select: { id: true, title: true, location: true } },
        },
      }),
    ]);

    return { total, page, pageSize, items };
  }

  // ───────────────────────────────────────────────
  // Get one lead (ownership enforced)
  // ───────────────────────────────────────────────

  async findById(leadId: string, agentId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        property: { select: { id: true, title: true, location: true } },
        reminders: {
          where: { status: ReminderStatus.PENDING },
          orderBy: { remindAt: 'asc' },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.agentId !== agentId) throw new ForbiddenException('Access denied');

    return lead;
  }

  // ───────────────────────────────────────────────
  // Update lead
  // ───────────────────────────────────────────────

  async update(leadId: string, agentId: string, dto: UpdateLeadDto) {
    const existing = await this.findById(leadId, agentId);

    const statusChanged = dto.status !== undefined && dto.status !== existing.status;
    const lastActivityAt = statusChanged ? new Date() : existing.lastActivityAt;

    const newStatus = dto.status ?? existing.status;
    const newPhone = dto.phone !== undefined ? dto.phone : existing.phone;

    const hotScore = await this.computeHotScore(leadId, newStatus, newPhone, lastActivityAt, agentId);

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(statusChanged ? { lastActivityAt } : {}),
        hotScore,
      },
    });

    if (statusChanged) {
      await this.audit.log({
        actorUserId: agentId,
        action: 'lead_status_change',
        entityType: 'Lead',
        entityId: leadId,
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return updated;
  }

  // ───────────────────────────────────────────────
  // Delete lead
  // ───────────────────────────────────────────────

  async remove(leadId: string, agentId: string) {
    await this.findById(leadId, agentId);

    await this.prisma.lead.delete({ where: { id: leadId } });

    await this.audit.log({
      actorUserId: agentId,
      action: 'delete_lead',
      entityType: 'Lead',
      entityId: leadId,
    });
  }

  // ───────────────────────────────────────────────
  // Reminders
  // ───────────────────────────────────────────────

  async createReminder(leadId: string, agentId: string, dto: CreateReminderDto) {
    await this.findById(leadId, agentId);

    return this.prisma.followUpReminder.create({
      data: {
        agentId,
        leadId,
        remindAt: new Date(dto.remindAt),
        note: dto.note,
      },
    });
  }

  async listRemindersForLead(leadId: string, agentId: string) {
    await this.findById(leadId, agentId);

    return this.prisma.followUpReminder.findMany({
      where: { leadId },
      orderBy: { remindAt: 'asc' },
    });
  }

  async updateReminder(reminderId: string, agentId: string, dto: UpdateReminderDto) {
    const reminder = await this.prisma.followUpReminder.findUnique({
      where: { id: reminderId },
      include: { lead: { select: { agentId: true } } },
    });

    if (!reminder) throw new NotFoundException('Reminder not found');

    const ownerAgentId = reminder.agentId ?? reminder.lead?.agentId;
    if (ownerAgentId !== agentId) throw new ForbiddenException('Access denied');

    return this.prisma.followUpReminder.update({
      where: { id: reminderId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.remindAt !== undefined ? { remindAt: new Date(dto.remindAt) } : {}),
      },
    });
  }

  // ───────────────────────────────────────────────
  // Stats
  // ───────────────────────────────────────────────

  async getStats(agentId: string): Promise<Record<LeadStatus, number> & { total: number }> {
    const statuses = Object.values(LeadStatus);

    const counts = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { agentId },
      _count: { id: true },
    });

    const result = Object.fromEntries(statuses.map((s) => [s, 0])) as Record<LeadStatus, number>;
    let total = 0;
    for (const row of counts) {
      result[row.status] = row._count.id;
      total += row._count.id;
    }

    return { ...result, total };
  }

  // ───────────────────────────────────────────────
  // Public lead capture (smart-link form)
  // ───────────────────────────────────────────────

  
  async capturePublicLead(dto: CreatePublicLeadDto, ctx: IdempotencyContext): Promise<{ ok: boolean; leadId: string }> {
    const { idempotencyKey, protocolVersion, payloadHash, path } = ctx;
    const TTL_HOURS = 24;
    const nowTime = new Date().getTime();

    // Fast check (outside transaction)
    let existing = await this.prisma.idempotentRequest.findUnique({
      where: { idempotencyKey_protocolVersion: { idempotencyKey, protocolVersion } },
    });

    if (existing) {
      const ageHours = (nowTime - existing.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > TTL_HOURS) {
        // Expired TTL: treat as new mutation. Log it for observability.
        this.logger.warn(`Idempotency TTL expired for key ${idempotencyKey}. Processing as new mutation.`);
        existing = null; // Proceed to overwrite it
      } else {
        if (existing.payloadHash !== payloadHash) {
          this.logger.warn(`Idempotency hash mismatch for key ${idempotencyKey}.`);
          throw new ConflictException('Idempotency conflict: The provided key was already used with a different payload.');
        }
        this.logger.log(`Idempotency replay hit for key ${idempotencyKey}.`);
        return existing.responseBody as any;
      }
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Find smart-link by slug — must be ACTIVE and not expired
        const smartLink = await tx.smartLink.findUnique({
          where: { slug: dto.slug },
          include: {
            property: { select: { id: true, ownerUserId: true } },
          },
        });

        if (
          !smartLink ||
          smartLink.status !== 'ACTIVE' ||
          (smartLink.expiryAt && smartLink.expiryAt < new Date())
        ) {
          throw new GoneException('Smart link is no longer available');
        }

        const propertyId = smartLink.property.id;
        const agentId = smartLink.property.ownerUserId;

        // 2. Compute hot score for new lead
        const now = new Date();
        const hotScore = this.computeHotScoreSync(LeadStatus.NEW, dto.phone, now);

        // 3. Create Lead
        const lead = await tx.lead.create({
          data: {
            propertyId,
            agentId,
            name: dto.name,
            phone: dto.phone,
            source: 'SMART_LINK',
            notes: dto.message,
            status: LeadStatus.NEW,
            hotScore,
            lastActivityAt: now,
          },
        });

        // 4. Insert LinkEvent
        await tx.linkEvent.create({
          data: {
            smartLinkId: smartLink.id,
            eventType: 'LEAD_SUBMIT',
          },
        });

        const responseBody = { ok: true, leadId: lead.id };

        // 5. Insert Idempotency Journal Entry (in SAME transaction)
        await tx.idempotentRequest.upsert({
          where: { idempotencyKey_protocolVersion: { idempotencyKey, protocolVersion } },
          update: {
            path,
            payloadHash,
            statusCode: 201,
            responseBody: responseBody as any,
            createdAt: now,
          },
          create: {
            idempotencyKey,
            protocolVersion,
            path,
            payloadHash,
            statusCode: 201,
            responseBody: responseBody as any,
            createdAt: now,
          },
        });

        return { ok: true, leadId: lead.id, agentId };
      });

      // Audit log outside transaction (non-critical)
      await this.audit
        .log({
          actorUserId: result.agentId,
          action: 'public_lead_capture',
          entityType: 'Lead',
          entityId: result.leadId,
          metadata: { slug: dto.slug },
        })
        .catch((err: unknown) => this.logger.error('Audit log failed for public lead', err));

      // Send hot lead alert via WhatsApp + email (non-blocking)
      this.notifyAgentOfLead(result.agentId, dto.name, dto.phone, result.leadId).catch(
        (err: unknown) => this.logger.error('Lead notification failed', err),
      );

      return { ok: result.ok, leadId: result.leadId };
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey')) {
        // Race condition: another request won the race and committed successfully.
        this.logger.log(`Concurrency race detected for idempotency key ${idempotencyKey}. Rolling back and refetching.`);
        const existingRefetched = await this.prisma.idempotentRequest.findUnique({
          where: { idempotencyKey_protocolVersion: { idempotencyKey, protocolVersion } },
        });

        if (existingRefetched) {
          if (existingRefetched.payloadHash !== payloadHash) {
            throw new ConflictException('Idempotency conflict: The provided key was already used with a different payload.');
          }
          return existingRefetched.responseBody as any;
        }
      }
      throw error;
    }
  }

  /**
   * Synchronous hot-score estimate used inside transactions where we can't
   * do async DB queries. Reminder bonus is skipped (new lead has no reminders yet).
   */
  private computeHotScoreSync(
    status: LeadStatus,
    phone: string | null | undefined,
    lastActivityAt: Date | null | undefined,
  ): number {
    let score = 0;
    if (phone) score += 20;
    score += STATUS_SCORE[status] ?? 0;

    if (lastActivityAt) {
      const now = new Date();
      const msSince = now.getTime() - lastActivityAt.getTime();
      const hours = msSince / (1000 * 60 * 60);
      const days = hours / 24;
      if (hours <= 24) score += 20;
      else if (days <= 7) score += 10;
      else if (days > 30) score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Send lead notification to agent via WhatsApp and email.
   * Non-blocking — failures are logged but don't affect lead capture.
   */
  private async notifyAgentOfLead(
    agentId: string,
    leadName: string | undefined,
    leadPhone: string | undefined,
    leadId: string,
  ): Promise<void> {
    try {
      const [agent, lead] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: agentId },
          select: { name: true, email: true, whatsappNumber: true },
        }),
        this.prisma.lead.findUnique({
          where: { id: leadId },
          select: { property: { select: { title: true } } },
        }),
      ]);

      if (!agent) return;
      const propertyTitle = lead?.property?.title ?? 'a property';

      // WhatsApp alert
      if (agent.whatsappNumber) {
        const waBody = `🔔 Hot Lead!\n\nProperty: ${propertyTitle}\nName: ${leadName ?? 'Not provided'}\nPhone: ${leadPhone ?? 'Not provided'}\n\nLogin to your dashboard to follow up.\n\n— SiteBank`;
        await this.notifications.sendWhatsApp({
          to: agent.whatsappNumber,
          body: waBody,
        }).catch((err: unknown) => this.logger.error('WhatsApp lead alert failed', err));
      }

      // Email alert
      if (agent.email) {
        await this.notifications.emailNewLead(
          { name: agent.name, email: agent.email },
          { name: leadName, phone: leadPhone, propertyTitle },
        ).catch((err: unknown) => this.logger.error('Email lead alert failed', err));
      }
    } catch (err) {
      this.logger.error('notifyAgentOfLead failed', err);
    }
  }
}
