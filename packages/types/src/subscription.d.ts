import type { EntityType, PaymentStatus } from './enums';
export interface PlanLimits {
    properties: number;
    photosPerProperty: number;
    videosPerProperty: number;
    thumbnailsPerMonth: number;
    teamMembers: number;
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    limits: PlanLimits;
    priceInr: string;
    features: Record<string, boolean>;
    isActive: boolean;
}
export interface Subscription {
    id: string;
    entityType: EntityType;
    userId?: string;
    agencyId?: string;
    planId: string;
    startDate: Date;
    endDate: Date;
    paymentStatus: PaymentStatus;
    plan: SubscriptionPlan;
}
export interface UsageStats {
    properties: {
        used: number;
        limit: number;
    };
    photosThisMonth: {
        used: number;
        limit: number;
    };
    thumbnailsThisMonth: {
        used: number;
        limit: number;
    };
    teamMembers: {
        used: number;
        limit: number;
    };
}
//# sourceMappingURL=subscription.d.ts.map