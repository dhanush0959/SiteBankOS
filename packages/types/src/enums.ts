export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENT = 'AGENT',
  OWNER = 'OWNER',
  BUYER = 'BUYER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum AgencyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum PropertyType {
  PLOT = 'PLOT',
  VILLA = 'VILLA',
  APARTMENT = 'APARTMENT',
  COMMERCIAL = 'COMMERCIAL',
  AGRICULTURAL = 'AGRICULTURAL',
  INDUSTRIAL = 'INDUSTRIAL',
  FARM_LAND = 'FARM_LAND',
  INDEPENDENT_HOUSE = 'INDEPENDENT_HOUSE',
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
  LEASE = 'LEASE',
  JOINT_DEVELOPMENT = 'JOINT_DEVELOPMENT',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  ARCHIVED = 'ARCHIVED',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  THUMBNAIL = 'THUMBNAIL',
  AUDIO = 'AUDIO',
}

export enum DocumentVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  ON_REQUEST = 'ON_REQUEST',
}

export enum SmartLinkStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  EXPIRED = 'EXPIRED',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SITE_VISIT_SCHEDULED = 'SITE_VISIT_SCHEDULED',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED = 'CLOSED',
  DEAD = 'DEAD',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  SNOOZED = 'SNOOZED',
}

export enum RewardStatus {
  PENDING = 'PENDING',
  CREDITED = 'CREDITED',
  EXPIRED = 'EXPIRED',
}

export enum EntityType {
  USER = 'USER',
  AGENCY = 'AGENCY',
}

export enum PaymentStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
}

export enum ThumbnailTemplate {
  PREMIUM = 'PREMIUM',
  HOT_PROPERTY = 'HOT_PROPERTY',
  SIMPLE_WHATSAPP = 'SIMPLE_WHATSAPP',
}

export enum AspectRatio {
  WIDE = '16:9',
  SQUARE = '1:1',
  STORY = '9:16',
}

export enum LinkEventType {
  VIEW = 'view',
  WHATSAPP_CLICK = 'whatsapp_click',
  CALL_CLICK = 'call_click',
  MAP_OPEN = 'map_open',
  DOC_REQUEST = 'doc_request',
  QUESTION_ASKED = 'question_asked',
}
