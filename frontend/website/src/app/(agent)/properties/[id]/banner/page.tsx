'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { unwrap } from '@/lib/api';
import { PosterGenerator } from '@/components/PosterGenerator';

interface PropertyInfo {
  id: string;
  title: string;
  aiGeneratedTitle?: string;
  media?: Array<{ fileUrl: string; cdnUrl?: string; isCover: boolean }>;
}

export default function PosterPage() {
  const params = useParams();
  const id = params['id'] as string;
  const api = useApi();

  const property = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      // Try to get public smart-link data (minimal fields needed)
      const res = await api.get(`/properties/${id}`);
      return unwrap<PropertyInfo>(res);
    },
    retry: false,
  });

  const coverUrl =
    property.data?.media?.find((m) => m.isCover)?.cdnUrl ??
    property.data?.media?.find((m) => m.isCover)?.fileUrl ??
    property.data?.media?.[0]?.cdnUrl ??
    property.data?.media?.[0]?.fileUrl;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/properties/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Generate Poster</h1>
          {property.data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {property.data.aiGeneratedTitle ?? property.data.title}
            </p>
          )}
        </div>
      </div>

      {property.isLoading ? (
        <div className="space-y-4">
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : property.error ? (
        <div className="text-center py-12 text-muted-foreground">
          Could not load property details. Check the property ID.
        </div>
      ) : (
        <PosterGenerator
          propertyId={id}
          propertyTitle={property.data?.title ?? ''}
          coverImageUrl={coverUrl}
        />
      )}
    </div>
  );
}
