import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { hashString } from '../common/utils/hash.util';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '@sitebank/types';

const REFRESH_TOKEN_EXPIRY_DAYS = 90;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Find free plan to assign
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: 'Free', isActive: true },
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          whatsappNumber: dto.whatsappNumber,
          passwordHash,
          role: dto.isAgency ? 'AGENCY_ADMIN' : 'AGENT',
        },
      });

      if (dto.isAgency && dto.agencyName) {
        await tx.agency.create({
          data: {
            name: dto.agencyName,
            ownerUserId: newUser.id,
            status: 'ACTIVE',
          },
        });
        
        // Update user's agencyId
        const updatedUser = await tx.user.update({
          where: { id: newUser.id },
          data: { agencyId: (await tx.agency.findUnique({ where: { ownerUserId: newUser.id } }))?.id },
        });
        return updatedUser;
      }

      return newUser;
    });

    // Create trial subscription
    if (freePlan) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      await this.prisma.subscription.create({
        data: {
          entityType: dto.isAgency ? 'AGENCY' : 'USER',
          userId: dto.isAgency ? null : user.id,
          agencyId: dto.isAgency ? user.agencyId : null,
          planId: freePlan.id,
          startDate: now,
          endDate: trialEnd,
          paymentStatus: 'TRIAL',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, res);

    this.logger.log(`New user registered: ${user.email}`);

    return { user: this.sanitizeUser(user), accessToken: tokens.accessToken };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordHash) {
      await this.audit.log({
        actorUserId: 'system',
        action: 'login_failed',
        entityType: 'User',
        entityId: dto.email,
        metadata: { reason: 'user_not_found' },
      }).catch(() => null);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account suspended. Contact support.');
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.audit.log({
        actorUserId: user.id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user.id,
        metadata: { reason: 'wrong_password' },
      }).catch(() => null);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, res);
    return { user: this.sanitizeUser(user), accessToken: tokens.accessToken };
  }

  async refreshTokens(userId: string, rawRefreshToken: string, res: Response) {
    const tokenHash = hashString(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account inactive');
    }

    // Delete old refresh token (rotation)
    await this.prisma.refreshToken.delete({ where: { tokenHash } });

    const tokens = await this.generateTokens(user.id, user.email, user.role, res);
    return { accessToken: tokens.accessToken };
  }

  async logout(userId: string, rawRefreshToken: string | undefined, res: Response) {
    if (rawRefreshToken) {
      const tokenHash = hashString(rawRefreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash, userId } });
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
    });
  }

  async googleLogin(
    googleUser: { id: string; email: string; name: string; photo?: string },
    res: Response,
  ) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      const freePlan = await this.prisma.subscriptionPlan.findFirst({
        where: { name: 'Free', isActive: true },
      });

      user = await this.prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          profilePhotoUrl: googleUser.photo,
          role: 'AGENT',
          isVerified: true,
        },
      });

      if (freePlan) {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);
        await this.prisma.subscription.create({
          data: {
            entityType: 'USER',
            userId: user.id,
            planId: freePlan.id,
            startDate: now,
            endDate: trialEnd,
            paymentStatus: 'TRIAL',
          },
        });
      }
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account inactive');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, res);
    return { user: this.sanitizeUser(user), accessToken: tokens.accessToken };
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  }

  // ── Email Verification ──────────────────────────────────────────────────────

  async requestEmailVerification(email: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && !user.isVerified) {
      const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
      const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

      const token = await this.jwtService.signAsync(
        { sub: user.id, purpose: 'verify_email' },
        { secret: jwtSecret, expiresIn: '24h' },
      );

      const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
      await this.notifications.emailVerifyAddress({ name: user.name, email: user.email }, verifyUrl);
    }

    return { ok: true };
  }

  async confirmEmailVerification(token: string): Promise<{ ok: true }> {
    const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');

    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; purpose: string }>(token, {
        secret: jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (payload.purpose !== 'verify_email') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await this.audit.log({
      actorUserId: user.id,
      action: 'email_verified',
      entityType: 'User',
      entityId: user.id,
    }).catch(() => null);

    return { ok: true };
  }

  // ── Password Reset ──────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.passwordHash) {
      const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
      const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

      const pwHashSig = hashString(user.passwordHash).slice(0, 16);

      const token = await this.jwtService.signAsync(
        { sub: user.id, purpose: 'password_reset', pwHashSig },
        { secret: jwtSecret, expiresIn: '30m' },
      );

      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      await this.notifications.emailPasswordReset({ name: user.name, email: user.email }, resetUrl);
    }

    return { ok: true };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ ok: true }> {
    const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');

    let payload: { sub: string; purpose: string; pwHashSig: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; purpose: string; pwHashSig: string }>(
        token,
        { secret: jwtSecret },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Verify pwHashSig still matches (invalidates token if password already changed)
    const currentPwHashSig = hashString(user.passwordHash).slice(0, 16);
    if (currentPwHashSig !== payload.pwHashSig) {
      throw new UnauthorizedException('Password reset token has already been used');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    await this.audit.log({
      actorUserId: user.id,
      action: 'password_reset',
      entityType: 'User',
      entityId: user.id,
    }).catch(() => null);

    return { ok: true };
  }

  // ── Password Change (authenticated) ────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    await this.audit.log({
      actorUserId: userId,
      action: 'password_changed',
      entityType: 'User',
      entityId: userId,
    }).catch(() => null);

    return { ok: true };
  }

  // ── Logout All ──────────────────────────────────────────────────────────────

  async logoutAll(userId: string): Promise<{ ok: true }> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    await this.audit.log({
      actorUserId: userId,
      action: 'logout_all',
      entityType: 'User',
      entityId: userId,
    }).catch(() => null);

    return { ok: true };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const payload: JwtPayload = { sub: userId, email, role: role as JwtPayload['role'] };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshTokenSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const rawRefreshToken = jwt.sign({ sub: userId }, refreshTokenSecret, {
      expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    });

    const tokenHash = hashString(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    // Set httpOnly cookie
    res.cookie('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { accessToken };
  }

  private sanitizeUser(user: { id: string; name: string; email: string; role: string; profilePhotoUrl: string | null; agencyId: string | null; reraNumber: string | null; isVerified: boolean; status: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl,
      agencyId: user.agencyId,
      reraNumber: user.reraNumber,
      isVerified: user.isVerified,
      status: user.status,
    };
  }
}
