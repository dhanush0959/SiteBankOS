import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        profilePhotoUrl: true,
        agencyId: true,
        reraNumber: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        whatsappNumber: dto.whatsappNumber,
        reraNumber: dto.reraNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        profilePhotoUrl: true,
        agencyId: true,
        reraNumber: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'update_profile',
      entityType: 'User',
      entityId: userId,
    });

    return user;
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG and WebP images allowed');
    }

    const key = this.storage.generateKey(`profiles/${userId}`, file.originalname);
    const result = await this.storage.uploadImage(file.buffer, key, file.mimetype);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: result.cdnUrl },
    });

    return { profilePhotoUrl: result.cdnUrl };
  }

  async softDelete(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'delete_account',
      entityType: 'User',
      entityId: userId,
    });
  }
}
