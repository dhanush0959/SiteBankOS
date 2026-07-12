import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
  agencyId?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
