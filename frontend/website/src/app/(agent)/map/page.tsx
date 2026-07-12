'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, MapPin, Filter, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProperties, type Property } from '@/hooks/useProperties';
import { formatINR, propertyTypeLabel } from '@/lib/property-helpers';
import { PROPERTY_TYPES } from '@/lib/constants';
import Link from 'next/link';

const PropertyMap = dynamic(() => import('@/components/map/property-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted/30 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 animate-float" />
        <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('propertyId');
  
  const [propertyType, setPropertyType] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useProperties({
    propertyType: propertyType || undefined,
    pageSize: 100,
    status: 'ACTIVE',
  });

  const allProperties = useMemo(() => {
    if (!data?.items) return [];
    if (initialId) return data.items.filter((p) => p.id === initialId);
    return data.items;
  }, [data, initialId]);

  const propertiesWithLocation = useMemo(() => {
    return allProperties.filter(
      (p) => p.location?.lat && p.location?.lng
    );
  }, [allProperties]);

  useEffect(() => {
    if (initialId && allProperties.length > 0 && !selectedProperty) {
      const p = allProperties.find(x => x.id === initialId);
      if (p) setSelectedProperty(p);
    }
  }, [initialId, allProperties, selectedProperty]);

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Site Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {propertiesWithLocation.length} of {allProperties.length} properties mapped
            {allProperties.length > propertiesWithLocation.length && (
              <span className="text-foreground ml-1">
                · {allProperties.length - propertiesWithLocation.length} without coordinates
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {initialId && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border-0"
            >
              <Link href="/map">Show All Properties</Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-lg"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-slide-in-up">
          <button
            type="button"
            onClick={() => setPropertyType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !propertyType
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Types
          </button>
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPropertyType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                propertyType === t.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Map + sidebar layout */}
      <div className="flex gap-4 h-[calc(100%-5rem)]">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-premium border relative">
          {isLoading ? (
            <div className="h-full w-full bg-muted/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Loading properties...</p>
              </div>
            </div>
          ) : (
            <PropertyMap
              properties={propertiesWithLocation}
              selectedProperty={selectedProperty}
              onSelect={setSelectedProperty}
            />
          )}
        </div>

        {/* Property list sidebar */}
        <div className="hidden lg:flex flex-col w-80 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              Properties ({allProperties.length})
            </h2>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          {allProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mt-2">
                No properties found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allProperties.map((property) => {
                const hasLocation = property.location?.lat && property.location?.lng;
                const isSelected = selectedProperty?.id === property.id;
                return (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => setSelectedProperty(property)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                      isSelected
                        ? 'bg-primary/5 border-primary/30 shadow-md'
                        : 'bg-card border-transparent hover:bg-muted/50 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          hasLocation
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{property.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {property.location?.city ?? '—'}
                          {property.location?.state ? `, ${property.location.state}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                            {propertyTypeLabel(property.propertyType)}
                          </span>
                          <span className="font-semibold text-foreground">
                            {property.priceOnRequest
                              ? 'On Request'
                              : formatINR(property.price ?? null)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Property Detail (mobile-friendly bottom sheet) */}
      {selectedProperty && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-in-up">
          <Card className="border-0 shadow-premium-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{selectedProperty.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProperty.location?.city ?? '—'}
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {selectedProperty.priceOnRequest
                      ? 'Price on Request'
                      : formatINR(selectedProperty.price ?? null)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="outline" className="rounded-lg">
                    <Link href={`/properties/${selectedProperty.id}`}>View</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProperty(null)}
                    className="rounded-lg"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
