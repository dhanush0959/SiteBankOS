'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Edit, Eye, Users, Sparkles, Share2, MapPin, Building2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useProperty,
  useSubmitForVerification,
  useChangePropertyStatus,
} from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';
import {
  formatINR,
  propertyTypeLabel,
  statusBadgeClass,
  verificationBadgeClass,
} from '@/lib/property-helpers';
import { PropertyGallery } from '@/components/properties/property-gallery';
import { useCreateSmartLink } from '@/hooks/useSmartLinks';
import { ShareDialog } from '@/components/properties/share-dialog';

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const { data: property, isLoading, isError } = useProperty(id);
  const submit = useSubmitForVerification(id);
  const changeStatus = useChangePropertyStatus(id);
  const createLink = useCreateSmartLink();
  const [isSharing, setIsSharing] = useState(false);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = async () => {
    if (shareUrl) {
      setIsShareOpen(true);
      return;
    }
    if (isSharing) return;
    setIsSharing(true);
    try {
      const link = await createLink.mutateAsync({ propertyId: id });
      const url = `${window.location.origin}/p/${link.slug}`;
      setShareUrl(url);
      setIsShareOpen(true);
    } catch (error) {
      toast({ title: 'Failed to share', description: 'Could not generate smart link.', variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-4">
        <div className="h-8 w-40 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-[400px] bg-slate-50 rounded-[32px] animate-pulse" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="text-center py-20 px-6">
        <Building2 className="h-16 w-16 mx-auto text-slate-200 mb-4" />
        <h2 className="text-xl font-black text-slate-900">Property not found</h2>
        <Button asChild variant="outline" className="mt-6 rounded-2xl h-12 px-8 font-bold">
          <Link href="/properties">Return to List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 animate-fade-in px-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/properties"
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-all shadow-sm active:bg-slate-50 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
        </Link>
        
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="sm" className="rounded-xl h-10 px-3 border-slate-200 font-black text-slate-700 shadow-sm active:bg-slate-50 text-[11px] uppercase tracking-wider">
            <Link href={`/properties/${id}/edit`}>
              <Edit className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl h-10 px-3 border-slate-200 font-black text-slate-700 shadow-sm active:bg-slate-50 text-[11px] uppercase tracking-wider">
            <Link href={`/properties/${id}/banner`}>
              <ImageIcon className="h-4 w-4 sm:mr-1.5 text-primary" /> <span className="hidden sm:inline">Banner</span>
            </Link>
          </Button>
          <Button onClick={handleShare} disabled={isSharing} className="rounded-xl h-10 px-4 bg-primary text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-95 border-0 text-[11px] uppercase tracking-wider">
            {isSharing ? <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" /> : <Share2 className="h-4 w-4 sm:mr-1.5" />} Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Gallery Section */}
        <div className="rounded-[40px] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
          <PropertyGallery media={property.media || []} title={property.title} />
          
          <div className="p-8 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${statusBadgeClass(property.status)}`}>
                {property.status.replace(/_/g, ' ')}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${verificationBadgeClass(property.verificationStatus)}`}>
                {property.verificationStatus}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                {propertyTypeLabel(property.propertyType)} · {property.transactionType}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {property.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {property.location.address}, {property.location.city}
                {property.location.state ? `, ${property.location.state}` : ''}
              </p>
            </div>

            <div className="pt-2">
              <p className="text-4xl font-black text-slate-900 tracking-tighter">
                {property.priceOnRequest ? 'Price on Request' : formatINR(property.price ?? null)}
                {property.priceNegotiable && !property.priceOnRequest && (
                  <span className="ml-3 text-xs font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2.5 py-1 rounded-lg">Negotiable</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Direct Leads" value={property._count?.leads ?? 0} icon={Users} gradient="from-blue-600 to-blue-500" />
          <StatCard label="Gallery Views" value={property.media?.length ?? 0} icon={Eye} gradient="from-indigo-600 to-indigo-500" />
          <StatCard label="Visibility" value={property.status === 'ACTIVE' ? 'Live' : 'Hidden'} icon={Sparkles} gradient="from-emerald-600 to-emerald-500" />
        </div>

        {/* Details Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {property.aiGeneratedDescription && (
              <div className="rounded-[32px] bg-white border border-slate-100 p-8 shadow-sm">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-primary" />
                  Description
                </h2>
                <p className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-line font-plus">
                  {property.aiGeneratedDescription}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="rounded-[32px] bg-white border border-slate-100 p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-primary" />
                Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(property.specs ?? {})
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([k, v]) => (
                    <div key={k} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors hover:bg-slate-100/50">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 font-heading">
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm font-black text-slate-900 font-plus">{String(v)}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Map Preview Placeholder */}
            {property.location?.lat && property.location?.lng && (
              <div className="rounded-[32px] bg-white border border-slate-100 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-slate-900">Location</h2>
                  <Link href={`/map?propertyId=${property.id}`} className="text-xs font-black text-primary hover:underline">
                    View on Map
                  </Link>
                </div>
                <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                  <MapPin className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-[10px] text-slate-400 font-black mt-4 text-center tracking-widest">
                  COORDS: {property.location.lat.toFixed(4)}, {property.location.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {shareUrl && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          url={shareUrl}
          title={property.title}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient?: string;
}) {
  return (
    <Card className="border-0 shadow-premium card-hover">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
            <p className="text-xl font-bold mt-1 tabular-nums font-heading">{value}</p>
          </div>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
