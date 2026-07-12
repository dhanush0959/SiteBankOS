'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PROPERTY_TYPES, TRANSACTION_TYPES, FACING_OPTIONS } from '@/lib/constants';
import {
  MapPin,
  Navigation,
  Loader2,
  Building2,
  IndianRupee,
  Ruler,
  FileText,
  CheckCircle2,
  Link as LinkIcon,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useMyAgency } from '@/hooks/useAgencies';
import { useMe } from '@/hooks/useAuth';

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters').max(150),
  propertyType: z.enum([
    'PLOT', 'VILLA', 'APARTMENT', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL', 'FARM_LAND', 'INDEPENDENT_HOUSE',
  ]),
  transactionType: z.enum(['SALE', 'RENT', 'LEASE', 'JOINT_DEVELOPMENT']),
  price: z.string().optional(),
  priceNegotiable: z.boolean().optional(),
  priceOnRequest: z.boolean().optional(),
  ownershipType: z.string().optional(),
  internalNotes: z.string().max(2000).optional(),
  reraId: z.string().max(50).optional(),
  lpNumber: z.string().max(50).optional(),
  isBankLoanAvailable: z.boolean().default(false),
  location: z.object({
    address: z.string().min(5).max(200),
    city: z.string().min(1).max(100),
    state: z.string().optional(),
    village: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    landmark: z.string().max(150).optional(),
    pincode: z.string().regex(/^\d{6}$/, '6-digit pincode').optional().or(z.literal('')),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    googleMapsLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
  specs: z.object({
    bedrooms: z.coerce.number().int().min(0).max(50).optional(),
    bathrooms: z.coerce.number().int().min(0).max(50).optional(),
    areaSqft: z.coerce.number().min(0).optional(),
    plotSizeSqft: z.coerce.number().min(0).optional(),
    facing: z.string().optional(),
    floor: z.coerce.number().int().min(-5).max(200).optional(),
    totalFloors: z.coerce.number().int().min(0).max(200).optional(),
    ageYears: z.coerce.number().min(0).max(200).optional(),
  }),
  amenitiesText: z.string().optional(),
  assignedAgentIds: z.array(z.string()).optional(),
  assignToAllAgents: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

const RESIDENTIAL = ['VILLA', 'APARTMENT', 'INDEPENDENT_HOUSE'];
const PLOT_LIKE = ['PLOT', 'AGRICULTURAL', 'FARM_LAND'];

export interface PropertyFormProps {
  defaultValues?: Partial<FormData> & { amenities?: string[] };
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  busy?: boolean;
}

export function PropertyForm({ defaultValues, onSubmit, submitLabel = 'Save', busy }: PropertyFormProps) {
  const amenitiesText = defaultValues?.amenities?.join(', ') ?? defaultValues?.amenitiesText ?? '';
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      propertyType: 'APARTMENT',
      transactionType: 'SALE',
      priceNegotiable: false,
      priceOnRequest: false,
      ...defaultValues,
      amenitiesText,
      location: {
        address: '',
        city: '',
        googleMapsLink: '',
        ...(defaultValues?.location ?? {}),
      },
      specs: {
        ...(defaultValues?.specs ?? {}),
      },
    },
  });

  const propertyType = form.watch('propertyType');
  const priceOnRequest = form.watch('priceOnRequest');
  const googleMapsLink = form.watch('location.googleMapsLink');

  useEffect(() => {
    if (!googleMapsLink) return;
    
    // Pattern to match @lat,lng in Google Maps URLs
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = googleMapsLink.match(regex);
    
    if (match && match[1] && match[2]) {
      form.setValue('location.lat', parseFloat(match[1]));
      form.setValue('location.lng', parseFloat(match[2]));
    }
  }, [googleMapsLink, form]);

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue('location.lat', latitude);
        form.setValue('location.lng', longitude);

        // Try reverse geocoding with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            const address = data.display_name?.split(',').slice(0, 3).join(',').trim() ?? '';
            if (address && !form.getValues('location.address')) {
              form.setValue('location.address', address);
            }
            if (addr.city || addr.town || addr.village) {
              const city = addr.city || addr.town || addr.village || '';
              if (!form.getValues('location.city')) {
                form.setValue('location.city', city);
              }
            }
            if (addr.state && !form.getValues('location.state')) {
              form.setValue('location.state', addr.state);
            }
            if (addr.postcode && !form.getValues('location.pincode')) {
              form.setValue('location.pincode', addr.postcode);
            }
          }
        } catch {
          // Reverse geocoding failed; GPS coordinates are still captured
        }

        setGeoLoading(false);
        setGeoSuccess(true);
        setTimeout(() => setGeoSuccess(false), 3000);
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission denied. Please allow location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out.');
            break;
          default:
            setGeoError('Unable to get location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [form]);

  async function handleSubmit(values: FormData) {
    const amenities = (values.amenitiesText ?? '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 30);

    const { amenitiesText: _at, ...rest } = values;
    void _at;

    // Strip googleMapsLink from location before sending to backend
    const { googleMapsLink: _, ...locData } = values.location;
    void _;

    const payload: Record<string, unknown> = {
      ...rest,
      location: locData,
      amenities,
    };
    if (values.priceOnRequest) {
      delete payload.price;
    } else if (values.price) {
      payload.price = values.price.toString();
    } else {
      delete payload.price;
    }

    if (values.location.pincode === '') {
      (payload.location as any).pincode = undefined;
    }

    // Clean up 0s from coerce.number when inputs are empty
    const loc = payload.location as any;
    if (loc.lat === 0 && loc.lng === 0) {
      delete loc.lat;
      delete loc.lng;
    }

    // Auto-geocode if lat/lng are missing
    if (!loc.lat || !loc.lng) {
      try {
        const queryParts = [
          values.location.address,
          values.location.city,
          values.location.state,
          values.location.pincode
        ].filter(Boolean);
        const query = encodeURIComponent(queryParts.join(', '));
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          loc.lat = parseFloat(data[0].lat);
          loc.lng = parseFloat(data[0].lon);
        }
      } catch (err) {
        // Ignore geocoding errors, just proceed without coordinates
      }
    }

    await onSubmit(payload);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basics */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Basic Information</h2>
              <p className="text-sm text-muted-foreground">The core details of the property.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 p-6 sm:p-8">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="e.g. 2BHK in Jubilee Hills with park view"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Type</Label>
            <select
              {...form.register('propertyType')}
              className="h-12 w-full px-4 rounded-xl border border-border/50 bg-muted/30 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Type</Label>
            <select
              {...form.register('transactionType')}
              className="h-12 w-full px-4 rounded-xl border border-border/50 bg-muted/30 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownershipType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ownership</Label>
            <Input
              id="ownershipType"
              {...form.register('ownershipType')}
              placeholder="Freehold / Leasehold"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Pricing</h2>
              <p className="text-sm text-muted-foreground">Set the asking price and terms.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 p-6 sm:p-8">
          <div className="sm:col-span-2 flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                {...form.register('priceOnRequest')}
                className="w-4 h-4 rounded border-2 text-primary focus:ring-primary/20"
              />
              <span className="font-medium group-hover:text-primary transition-colors">Price on request</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                {...form.register('priceNegotiable')}
                className="w-4 h-4 rounded border-2 text-primary focus:ring-primary/20"
              />
              <span className="font-medium group-hover:text-primary transition-colors">Negotiable</span>
            </label>
          </div>
          {!priceOnRequest && (
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="any"
                {...form.register('price')}
                placeholder="e.g. 12500000"
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Location</h2>
                <p className="text-sm text-muted-foreground">Where is the property located?</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className={`rounded-xl h-10 px-4 transition-all shadow-sm ${
                geoSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                  : 'hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {geoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : geoSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Location captured!
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </>
              )}
            </Button>
          </div>
          {geoError && (
            <p className="text-xs font-medium text-destructive mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
              {geoError}
            </p>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 p-6 sm:p-8">
          <div className="sm:col-span-2 space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <LinkIcon className="h-3.5 w-3.5" /> Google Maps Link
            </Label>
            <Input
              {...form.register('location.googleMapsLink')}
              placeholder="https://www.google.com/maps/place/..."
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
            <p className="text-[10px] text-muted-foreground">Paste a Google Maps link to automatically extract GPS coordinates.</p>
            {form.formState.errors.location?.googleMapsLink && (
              <p className="text-xs text-destructive">{form.formState.errors.location.googleMapsLink.message}</p>
            )}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
            <Input
              {...form.register('location.address')}
              placeholder="Plot 42, Road No. 12, …"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
            {form.formState.errors.location?.address && (
              <p className="text-xs text-destructive">{form.formState.errors.location.address.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
            <Input
              {...form.register('location.city')}
              placeholder="Hyderabad"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
            {form.formState.errors.location?.city && (
              <p className="text-xs text-destructive">{form.formState.errors.location.city.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State</Label>
            <Input
              {...form.register('location.state')}
              placeholder="Telangana"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pincode</Label>
            <Input
              {...form.register('location.pincode')}
              maxLength={6}
              placeholder="500033"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
            {form.formState.errors.location?.pincode && (
              <p className="text-xs text-destructive">{form.formState.errors.location.pincode.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GPS Coordinates</Label>
            <div className="flex gap-3">
              <Input
                type="number"
                step="any"
                {...form.register('location.lat')}
                placeholder="Lat"
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors font-mono text-sm"
              />
              <Input
                type="number"
                step="any"
                {...form.register('location.lng')}
                placeholder="Lng"
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors font-mono text-sm"
              />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground pt-1">
              Auto-filled by &ldquo;Use Current Location&rdquo; or enter manually
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Village / Area</Label>
            <Input
              {...form.register('location.village')}
              placeholder="Jubilee Hills / Gachibowli"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">District</Label>
            <Input
              {...form.register('location.district')}
              placeholder="Hyderabad / Rangareddy"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Landmark</Label>
            <Input
              {...form.register('location.landmark')}
              placeholder="Opposite Metro Station, Near Apollo Hospital, …"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal & Trust */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Legal & Trust Information</h2>
              <p className="text-sm text-muted-foreground">Verification details to build buyer confidence.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 p-6 sm:p-8">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RERA ID</Label>
            <Input
              {...form.register('reraId')}
              placeholder="P0240000..."
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LP / Approval Number</Label>
            <Input
              {...form.register('lpNumber')}
              placeholder="LP/123/2024"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Bank Loan Available</p>
              <p className="text-xs text-muted-foreground">Is this project pre-approved by major banks?</p>
            </div>
            <input 
              type="checkbox" 
              className="w-6 h-6 rounded-lg accent-primary"
              {...form.register('isBankLoanAvailable')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specs */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-inner">
              <Ruler className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Specifications</h2>
              <p className="text-sm text-muted-foreground">Physical details of the property.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3 p-6 sm:p-8">
          {RESIDENTIAL.includes(propertyType) && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bedrooms</Label>
                <Input type="number" {...form.register('specs.bedrooms')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bathrooms</Label>
                <Input type="number" {...form.register('specs.bathrooms')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Built-up area (sq.ft)</Label>
                <Input type="number" {...form.register('specs.areaSqft')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floor</Label>
                <Input type="number" {...form.register('specs.floor')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total floors</Label>
                <Input type="number" {...form.register('specs.totalFloors')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age (years)</Label>
                <Input type="number" {...form.register('specs.ageYears')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
            </>
          )}
          {PLOT_LIKE.includes(propertyType) && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plot size (sq.ft)</Label>
                <Input type="number" {...form.register('specs.plotSizeSqft')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
              </div>
              <Controller
                name="specs.facing"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facing</Label>
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="h-12 w-full px-4 rounded-xl border border-border/50 bg-muted/30 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="">—</option>
                      {FACING_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
            </>
          )}
          {propertyType === 'COMMERCIAL' && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carpet area (sq.ft)</Label>
              <Input type="number" {...form.register('specs.areaSqft')} className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities + Notes */}
      <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shadow-inner">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Amenities & Notes</h2>
              <p className="text-sm text-muted-foreground">Add features and private agent notes.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amenities (comma-separated, up to 30)</Label>
            <Input
              {...form.register('amenitiesText')}
              placeholder="Lift, Power backup, Covered parking, …"
              className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal notes (private)</Label>
            <textarea
              {...form.register('internalNotes')}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/30 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="For your reference only — never shown to buyers or clients."
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Access (Only for Agency Members) */}
      <TeamAccessSection form={form} />

      <div className="flex justify-end pt-2 pb-8">
        <Button
          type="submit"
          disabled={busy}
          className="h-12 px-10 rounded-xl bg-primary-gradient text-white hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-semibold text-base"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

function TeamAccessSection({ form }: { form: any }) {
  const { data: me } = useMe();
  const { data: agency, isLoading } = useMyAgency();
  
  const isAgencyUser = !!me?.agencyId;
  const assignToAll = form.watch('assignToAllAgents');
  const selectedAgentIds = form.watch('assignedAgentIds') || [];

  if (!isAgencyUser || isLoading || !agency) return null;

  // Filter out the current user (owner) from the assignment list
  const otherMembers = agency.members.filter(m => m.id !== me?.sub);

  if (otherMembers.length === 0) return null;

  const toggleAgent = (id: string) => {
    if (selectedAgentIds.includes(id)) {
      form.setValue('assignedAgentIds', selectedAgentIds.filter((aid: string) => aid !== id));
    } else {
      form.setValue('assignedAgentIds', [...selectedAgentIds, id]);
    }
  };

  return (
    <Card className="border-0 shadow-premium overflow-hidden bg-card/60 backdrop-blur-xl">
      <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shadow-inner">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Team Access</h2>
            <p className="text-sm text-muted-foreground">Who else in your agency can manage this property?</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Assign to all agents</p>
              <p className="text-xs text-muted-foreground">Automatically share with every current and future team member.</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            className="w-6 h-6 rounded-lg accent-indigo-600"
            {...form.register('assignToAllAgents')}
          />
        </div>

        {!assignToAll && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Specific Agents</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherMembers.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => toggleAgent(member.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedAgentIds.includes(member.id) 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedAgentIds.includes(member.id) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    selectedAgentIds.includes(member.id) ? 'bg-primary border-primary' : 'bg-white border-slate-300'
                  }`}>
                    {selectedAgentIds.includes(member.id) && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
