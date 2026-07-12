export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatArea(sqft: number | null | undefined): string {
  if (!sqft) return '—';
  return `${formatNumber(sqft)} sq.ft`;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  PLOT: 'Plot',
  VILLA: 'Villa',
  APARTMENT: 'Apartment',
  COMMERCIAL: 'Commercial',
  AGRICULTURAL: 'Agricultural',
  INDUSTRIAL: 'Industrial',
  FARM_LAND: 'Farm Land',
  INDEPENDENT_HOUSE: 'Independent House',
};

export function propertyTypeLabel(value: string): string {
  return PROPERTY_TYPE_LABELS[value] ?? value;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  UNDER_NEGOTIATION: 'bg-primary text-foreground border-foreground/20',
  SOLD: 'bg-blue-100 text-blue-800 border-blue-200',
  RENTED: 'bg-blue-100 text-blue-800 border-blue-200',
  ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function statusBadgeClass(status: string): string {
  return STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

const VERIFICATION_COLOR: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  UNVERIFIED: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function verificationBadgeClass(status: string): string {
  return VERIFICATION_COLOR[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-800',
  CONTACTED: 'bg-indigo-100 text-indigo-800',
  SITE_VISIT_SCHEDULED: 'bg-violet-100 text-violet-800',
  NEGOTIATING: 'bg-primary text-foreground',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  DEAD: 'bg-gray-100 text-gray-600',
};

export function leadStatusBadgeClass(status: string): string {
  return LEAD_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700';
}

export function hotScoreColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-700 border-red-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
