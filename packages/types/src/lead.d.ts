import type { LeadStatus, ReminderStatus } from './enums';
export interface Lead {
    id: string;
    propertyId: string;
    agentId: string;
    name?: string;
    phone?: string;
    source?: string;
    hotScore: number;
    status: LeadStatus;
    lastActivityAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FollowUpReminder {
    id: string;
    agentId: string;
    leadId?: string;
    propertyId?: string;
    remindAt: Date;
    note?: string;
    status: ReminderStatus;
    createdAt: Date;
}
//# sourceMappingURL=lead.d.ts.map