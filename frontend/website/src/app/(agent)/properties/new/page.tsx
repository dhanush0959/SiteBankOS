'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Building2, Sparkles } from 'lucide-react';
import { PropertyForm } from '@/components/properties/property-form';
import { useCreateProperty } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';

export default function NewPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const create = useCreateProperty();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <Link
          href="/properties"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to properties
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow-blue">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add Property</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              You can add photos and generate AI titles after creating the listing.
            </p>
          </div>
        </div>
      </div>

      <PropertyForm
        busy={create.isPending}
        submitLabel="Create property"
        onSubmit={async (data) => {
          try {
            const created = await create.mutateAsync(data);
            toast({ title: 'Property created', description: created.title });
            router.push(`/properties/${created.id}/edit?step=media`);
          } catch (err: unknown) {
            const msg = extractErrorMessage(err) ?? 'Failed to create property';
            toast({ title: 'Could not create', description: msg, variant: 'destructive' });
          }
        }}
      />
    </div>
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
