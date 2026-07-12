import type {
  PropertyType,
  TransactionType,
  PropertyStatus,
  VerificationStatus,
  MediaType,
  DocumentVisibility,
} from './enums';

export interface PropertyLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  approachRoad?: string;
  directionNotes?: string;
}

export interface PropertySpecs {
  plotSize?: number;
  plotSizeUnit?: 'sqft' | 'sqyrd' | 'acres' | 'guntas';
  builtUp?: number;
  facing?: 'East' | 'West' | 'North' | 'South' | 'Corner';
  dimensions?: string;
  roadWidth?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  ageYears?: number;
}

export interface PropertyApprovals {
  rera?: string;
  lpNumber?: string;
  authority?: 'HMDA' | 'VUDA' | 'DTCP' | 'GramPanchayat' | 'YSRCDMA' | 'BDA' | 'Other';
  bankLoan?: 'Available' | 'Not Available' | 'Specific Banks';
  bankLoanBanks?: string[];
  encumbrance?: 'EC Available' | 'No Encumbrance' | 'Encumbrance Exists';
}

export interface PropertyAmenities {
  water?: boolean;
  electricity?: boolean;
  drainage?: boolean;
  compoundWall?: boolean;
  borewell?: boolean;
  gatedCommunity?: boolean;
  security?: boolean;
  clubhouse?: boolean;
  schoolNearby?: boolean;
  hospitalNearby?: boolean;
  highwayAccess?: boolean;
  metroAccess?: boolean;
  busStop?: boolean;
  market?: boolean;
  park?: boolean;
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  fileUrl: string;
  cdnUrl?: string;
  fileType: MediaType;
  orderIndex: number;
  isCover: boolean;
  sizeBytes?: bigint;
  width?: number;
  height?: number;
  durationSeconds?: number;
  createdAt: Date;
}

export interface PropertyDocument {
  id: string;
  propertyId: string;
  fileUrl: string;
  docType: string;
  visibility: DocumentVisibility;
  verificationStatus: VerificationStatus;
  createdAt: Date;
}

export interface Property {
  id: string;
  ownerUserId: string;
  agencyId?: string;
  title: string;
  aiGeneratedTitle?: string;
  aiGeneratedDescription?: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  price?: string;
  priceNegotiable: boolean;
  priceOnRequest: boolean;
  ownershipType?: string;
  location: PropertyLocation;
  specs: PropertySpecs;
  approvals?: PropertyApprovals;
  amenities?: PropertyAmenities;
  internalNotes?: string;
  status: PropertyStatus;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  media?: PropertyMedia[];
  documents?: PropertyDocument[];
}

export interface PublicProperty extends Omit<Property, 'internalNotes' | 'documents'> {
  documents?: Array<Omit<PropertyDocument, 'fileUrl'> & { signedUrl?: string }>;
}
