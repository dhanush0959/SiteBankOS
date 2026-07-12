'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Image as ImageIcon, Eye, Users, MapPin, ArrowUpRight, Share2, Loader2 } from 'lucide-react';
import type { Property } from '@/hooks/useProperties';
import { useCreateSmartLink } from '@/hooks/useSmartLinks';
import { useToast } from '@/hooks/use-toast';
import {
  formatINR,
  propertyTypeLabel,
  statusBadgeClass,
  verificationBadgeClass,
} from '@/lib/property-helpers';
import { ShareDialog } from '@/components/properties/share-dialog';

export function PropertyCard({ property }: { property: Property }) {
  const createLink = useCreateSmartLink();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shareUrl) {
      setIsShareOpen(true);
      return;
    }
    if (isSharing) return;
    setIsSharing(true);
    try {
      const link = await createLink.mutateAsync({ propertyId: property.id });
      const url = `${window.location.origin}/p/${link.slug}`;
      setShareUrl(url);
      setIsShareOpen(true);
    } catch (error) {
      toast({ title: 'Failed to share', description: 'Could not generate smart link.', variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  const cover = property.media?.find((m) => m.isCover) ?? property.media?.[0];
  const coverUrl = cover?.cdnUrl ?? cover?.fileUrl;

  return (
    <>
      <Link
        href={`/properties/${property.id}`}
        className="group block relative rounded-2xl bg-card border-2 border-slate-200 dark:border-slate-800 overflow-hidden hover-lift w-full hover:border-primary/40 transition-colors shadow-sm"
      >
        {/* Top Image Section */}
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Top badges (Overlay) */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
            <div className="flex flex-col gap-1">
              <span
                className={`text-[8px] uppercase tracking-wider font-extrabold border px-2 py-1 rounded-full shadow-sm w-max bg-white/90 ${statusBadgeClass(property.status)}`}
              >
                {property.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-1.5 bg-black/50 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-md"
              title="Generate Smart Link"
            >
              {isSharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Content Section (Below Image) */}
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md">
              {propertyTypeLabel(property.propertyType)}
            </span>
          </div>
          
          <h3 className="font-bold text-xs text-foreground leading-tight line-clamp-1">
            {property.title}
          </h3>
          
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="truncate">
              {property.location?.city ?? '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm font-extrabold text-foreground tracking-tight">
              {property.priceOnRequest ? 'On Request' : formatINR(property.price ?? null)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" /> {property._count?.leads ?? 0}
            </span>
          </div>
        </div>
      </Link>
      {shareUrl && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          url={shareUrl}
          title={property.title}
        />
      )}
    </>
  );
}
