export const PROPERTY_TYPES = [
  { value: 'PLOT', label: 'Plot' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'AGRICULTURAL', label: 'Agricultural' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'FARM_LAND', label: 'Farm Land' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House' },
] as const;

export const TRANSACTION_TYPES = [
  { value: 'SALE', label: 'Sale' },
  { value: 'RENT', label: 'Rent' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'JOINT_DEVELOPMENT', label: 'Joint Development' },
] as const;

export const FACING_OPTIONS = [
  { value: 'East', label: 'East' },
  { value: 'West', label: 'West' },
  { value: 'North', label: 'North' },
  { value: 'South', label: 'South' },
  { value: 'Corner', label: 'Corner Plot' },
] as const;

export const AREA_UNITS = [
  { value: 'sqft', label: 'sq.ft' },
  { value: 'sqyrd', label: 'sq.yd' },
  { value: 'acres', label: 'Acres' },
  { value: 'guntas', label: 'Guntas' },
] as const;

export const APPROVAL_AUTHORITIES = [
  { value: 'HMDA', label: 'HMDA' },
  { value: 'VUDA', label: 'VUDA' },
  { value: 'DTCP', label: 'DTCP' },
  { value: 'GramPanchayat', label: 'Gram Panchayat' },
  { value: 'YSRCDMA', label: 'YSRCDMA' },
  { value: 'BDA', label: 'BDA' },
  { value: 'Other', label: 'Other' },
] as const;

export const HOT_SCORE_THRESHOLD = 60;
export const MAX_PHOTOS_FREE = 5;
export const MAX_PHOTOS_PAID = 50;
