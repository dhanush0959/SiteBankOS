import type { SmartLinkStatus, LinkEventType } from './enums';
import type { PublicProperty } from './property';
export interface SmartLink {
    id: string;
    propertyId: string;
    slug: string;
    status: SmartLinkStatus;
    expiryAt?: Date;
    hasPassword: boolean;
    shareCount: number;
    createdAt: Date;
}
export interface LinkEvent {
    id: string;
    smartLinkId: string;
    eventType: LinkEventType;
    sessionId?: string;
    ipHash?: string;
    deviceHash?: string;
    referrer?: string;
    timeOnPageSeconds?: number;
    scrollDepthPct?: number;
    createdAt: Date;
}
export interface PublicSmartLinkResponse {
    smartLink: Pick<SmartLink, 'id' | 'slug' | 'status' | 'expiryAt'>;
    property: PublicProperty;
    agent: {
        name: string;
        phone?: string;
        whatsappNumber?: string;
        profilePhotoUrl?: string;
        agencyName?: string;
        agencyLogoUrl?: string;
    };
}
export interface TrackEventDto {
    eventType: LinkEventType;
    sessionId: string;
    timeOnPageSeconds?: number;
    scrollDepthPct?: number;
}
//# sourceMappingURL=smartlink.d.ts.map