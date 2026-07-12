import { Injectable, NotFoundException } from '@nestjs/common';
import { AgencyStatus, PaymentStatus, UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AdminUsersQueryDto, AdminAgenciesQueryDto, AdminPropertiesQueryDto } from './dto/admin-query.dto';

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  agencyId: true,
  reraNumber: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  profilePhotoUrl: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getStats() {
    const [
      users,
      agencies,
      properties,
      smartLinks,
      leads,
      subscriptionsActive,
      subscriptionsTrial,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.agency.count(),
      this.prisma.property.count(),
      this.prisma.smartLink.count(),
      this.prisma.lead.count(),
      this.prisma.subscription.count({ where: { paymentStatus: PaymentStatus.ACTIVE } }),
      this.prisma.subscription.count({ where: { paymentStatus: PaymentStatus.TRIAL } }),
    ]);

    return { users, agencies, properties, smartLinks, leads, subscriptionsActive, subscriptionsTrial };
  }

  async searchUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.q ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' as const } },
          { email: { contains: query.q, mode: 'insensitive' as const } },
        ],
      } : {}),
      ...(query.status ? { status: query.status as UserStatus } : {}),
      ...(query.role ? { role: query.role as UserRole } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SAFE_SELECT,
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { properties: true, leads: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async suspendUser(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
      select: USER_SAFE_SELECT,
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'suspend_user',
      entityType: 'User',
      entityId: userId,
    });

    return updated;
  }

  async activateUser(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
      select: USER_SAFE_SELECT,
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'activate_user',
      entityType: 'User',
      entityId: userId,
    });

    return updated;
  }

  async setUserRole(userId: string, role: UserRole, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_SAFE_SELECT,
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'set_user_role',
      entityType: 'User',
      entityId: userId,
      metadata: { from: user.role, to: role },
    });

    return updated;
  }

  async searchAgencies(query: AdminAgenciesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' as const } } : {}),
      ...(query.status ? { status: query.status as AgencyStatus } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, properties: true } },
        },
      }),
      this.prisma.agency.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async suspendAgency(agencyId: string, actorId: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: { status: AgencyStatus.SUSPENDED },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'suspend_agency',
      entityType: 'Agency',
      entityId: agencyId,
    });

    return updated;
  }

  async activateAgency(agencyId: string, actorId: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: { status: AgencyStatus.ACTIVE },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'activate_agency',
      entityType: 'Agency',
      entityId: agencyId,
    });

    return updated;
  }

  async searchProperties(query: AdminPropertiesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.verificationStatus ? { verificationStatus: query.verificationStatus as VerificationStatus } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          agency: { select: { id: true, name: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async verifyProperty(propertyId: string, actorId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'verify_property',
      entityType: 'Property',
      entityId: propertyId,
    });

    return updated;
  }

  async rejectProperty(propertyId: string, actorId: string, reason: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { verificationStatus: VerificationStatus.REJECTED },
    });

    await this.audit.log({
      actorUserId: actorId,
      action: 'reject_property',
      entityType: 'Property',
      entityId: propertyId,
      metadata: { reason },
    });

    return updated;
  }
}
