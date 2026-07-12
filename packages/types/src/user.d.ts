import type { UserRole, UserStatus, AgencyStatus } from './enums';
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    whatsappNumber?: string;
    role: UserRole;
    profilePhotoUrl?: string;
    agencyId?: string;
    reraNumber?: string;
    isVerified: boolean;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface Agency {
    id: string;
    name: string;
    logoUrl?: string;
    ownerUserId: string;
    address?: string;
    customDomain?: string;
    brandingSettings?: AgencyBrandingSettings;
    status: AgencyStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface AgencyBrandingSettings {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    tagline?: string;
}
export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    agencyId?: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=user.d.ts.map