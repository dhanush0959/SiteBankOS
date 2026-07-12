import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import type { CreateAgencyDto } from './dto/create-agency.dto';
import type { UpdateAgencyDto } from './dto/update-agency.dto';

@Injectable()
export class AgenciesService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async findById(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: { members: { select: { id: true, name: true, email: true, role: true, status: true } } },
    });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  async getMyAgency(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { agencyId: true } });
    if (!user?.agencyId) throw new NotFoundException('No agency found for user');
    return this.findById(user.agencyId);
  }

  async updateBranding(agencyId: string, actorId: string, data: Record<string, unknown>) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== actorId) throw new ForbiddenException('Only owner can update agency');

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: { brandingSettings: data as Prisma.InputJsonValue },
    });

    await this.audit.log({ actorUserId: actorId, action: 'update_agency_branding', entityType: 'Agency', entityId: agencyId });
    return updated;
  }

  async createForOwner(userId: string, dto: CreateAgencyDto) {
    // 409 if user already owns an agency
    const existing = await this.prisma.agency.findUnique({ where: { ownerUserId: userId } });
    if (existing) {
      throw new ConflictException('User already owns an agency');
    }

    const agency = await this.prisma.$transaction(async (tx) => {
      const newAgency = await tx.agency.create({
        data: {
          name: dto.name,
          address: dto.address,
          customDomain: dto.customDomain,
          ownerUserId: userId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          agencyId: newAgency.id,
          role: UserRole.AGENCY_ADMIN,
        },
      });

      return newAgency;
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'create_agency',
      entityType: 'Agency',
      entityId: agency.id,
    });

    return agency;
  }

  async updateAgency(agencyId: string, actorId: string, dto: UpdateAgencyDto) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== actorId) throw new ForbiddenException('Only owner can update agency');

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.customDomain !== undefined && { customDomain: dto.customDomain }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'update_agency',
      entityType: 'Agency',
      entityId: agencyId,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }

  async inviteMember(agencyId: string, actorId: string, email: string, role: 'AGENT' | 'AGENCY_ADMIN') {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== actorId) throw new ForbiddenException('Only owner can invite members');

    const targetUser = await this.prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      throw new NotFoundException('User not found. User must register first.');
    }

    if (targetUser.agencyId) {
      throw new ConflictException('User already belongs to an agency');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUser.id },
      data: {
        agencyId,
        role: role as UserRole,
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    // Send invitation email
    const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
    await this.notifications.emailAgencyInvite({
      to: email,
      agencyName: agency.name,
      ownerName: actor?.name ?? 'The Agency Owner',
      inviteUrl: `${this.config.get('FRONTEND_URL')}/dashboard`,
    }).catch(err => this.logger.error(`Failed to send agency invite email to ${email}`, err));

    await this.audit.log({
      actorUserId: actorId,
      action: 'invite_member',
      entityType: 'Agency',
      entityId: agencyId,
      metadata: { memberId: targetUser.id, email, role },
    });

    return updated;
  }

  async removeMember(agencyId: string, actorId: string, memberUserId: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== actorId) throw new ForbiddenException('Only owner can remove members');

    if (agency.ownerUserId === memberUserId) {
      throw new ForbiddenException('Cannot remove the agency owner');
    }

    const member = await this.prisma.user.findUnique({ where: { id: memberUserId } });
    if (!member || member.agencyId !== agencyId) {
      throw new NotFoundException('Member not found in this agency');
    }

    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { agencyId: null },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'remove_member',
      entityType: 'Agency',
      entityId: agencyId,
      metadata: { memberId: memberUserId },
    });
  }

  async uploadLogo(agencyId: string, actorId: string, file: Express.Multer.File) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    if (agency.ownerUserId !== actorId) throw new ForbiddenException('Only owner can upload logo');

    const key = this.storage.generateKey(`agencies/${agencyId}`, file.originalname);
    const result = await this.storage.uploadImage(file.buffer, key, file.mimetype);

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: { logoUrl: result.cdnUrl },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'upload_logo',
      entityType: 'Agency',
      entityId: agencyId,
      metadata: { logoUrl: result.cdnUrl },
    });

    return updated;
  }
}
