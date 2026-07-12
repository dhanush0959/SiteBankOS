'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProperty, useUpdateProperty } from '@/hooks/useProperties';
import { PropertyForm } from '@/components/properties/property-form';
import { MediaUploader } from '@/components/properties/media-uploader';

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const { toast } = useToast();
  const { data: property, isLoading } = useProperty(id);
  const update = useUpdateProperty(id);
  const initialTab = searchParams.get('step') === 'media' ? 'media' : 'details';
  const [tab, setTab] = useState<'details' | 'media'>(initialTab);

  if (isLoading || !property) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="h-5 w-32 bg-muted/40 rounded-lg animate-pulse" />
        <div className="h-7 w-40 bg-muted/40 rounded-lg animate-pulse" />
        <div className="h-96 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <Link
          href={`/properties/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to property
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit property</h1>
      </div>

      <div className="flex gap-1 border-b">
        <TabButton active={tab === 'details'} onClick={() => setTab('details')}>Details</TabButton>
        <TabButton active={tab === 'media'} onClick={() => setTab('media')}>
          Media {property.media && property.media.length > 0 ? `(${property.media.length})` : ''}
        </TabButton>
      </div>

      {tab === 'details' && (
        <PropertyForm
          defaultValues={{
            title: property.title,
            propertyType: property.propertyType as never,
            transactionType: property.transactionType as never,
            price: property.price ? String(property.price) : undefined,
            priceNegotiable: property.priceNegotiable,
            priceOnRequest: property.priceOnRequest,
            ownershipType: property.ownershipType ?? '',
            internalNotes: property.internalNotes ?? '',
            location: {
              address: property.location.address,
              city: property.location.city,
              state: property.location.state ?? '',
              pincode: property.location.pincode ?? '',
              lat: property.location.lat,
              lng: property.location.lng,
            },
            specs: property.specs as never,
            amenities: property.amenities ?? [],
          }}
          submitLabel="Save changes"
          busy={update.isPending}
          onSubmit={async (data) => {
            try {
              await update.mutateAsync(data);
              toast({ title: 'Saved' });
            } catch (err: unknown) {
              toast({
                title: 'Save failed',
                description: extractErrorMessage(err) ?? 'Try again.',
                variant: 'destructive',
              });
            }
          }}
        />
      )}

      {tab === 'media' && (
        <Card>
          <CardContent className="pt-6">
            <MediaUploader property={property} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
        active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function extractErrorMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { data?: { message?: string | string[] } } }).response;
    const m = r?.data?.message;
    if (Array.isArray(m)) return m.join('; ');
    if (typeof m === 'string') return m;
  }
  return undefined;
}
