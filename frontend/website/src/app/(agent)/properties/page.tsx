'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, List, MapPin, Building2, X, Filter, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useProperties, useCities, type Property } from '@/hooks/useProperties';
import { useMe } from '@/hooks/useAuth';
import { PropertyCard } from '@/components/properties/property-card';
import { PropertiesEmptyState, CardSkeleton } from '@/components/properties/empty-state';
import { BulkUploadDialog } from '@/components/properties/bulk-upload-dialog';
import { PROPERTY_TYPES } from '@/lib/constants';
import { formatINR } from '@/lib/property-helpers';

const PropertyMap = dynamic(() => import('@/components/map/property-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-2">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 animate-bounce" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

function useGreeting() {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);
  return greeting;
}

export default function PropertiesPage() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [page, setPage] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [minPrice, maxPrice] = useMemo(() => {
    if (!priceRange) return [undefined, undefined];
    const [min, max] = priceRange.split('-').map(Number);
    return [min, max];
  }, [priceRange]);

  const { data: me } = useMe();
  const greeting = useGreeting();
  const firstName = me?.name?.split(' ')[0] ?? me?.email?.split('@')[0] ?? 'Agent';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, refetch } = useProperties({
    q: debouncedQ || undefined,
    propertyType: propertyType || undefined,
    status: status || undefined,
    city: city || undefined,
    minPrice,
    maxPrice,
    page,
    pageSize: 20,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });

  const { data: cities } = useCities();

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const propertiesWithLocation = useMemo(
    () => data?.items?.filter((p) => p.location?.lat && p.location?.lng) || [],
    [data]
  );

  return (
    <div className="space-y-8 pb-24 animate-fade-in px-4 pt-4 w-full">
      {/* ─── Greeting Section ─── */}
      <div className="space-y-0.5 px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* ─── Search & Filters Section ─── */}
      {/* ─── Search & Filters Section ─── */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
          {/* Left Actions */}
          <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
            <button onClick={() => setMapOpen(true)} className="flex flex-1 xl:flex-none justify-center items-center gap-2 h-12 px-5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold transition-all hover:bg-slate-50">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Map</span>
            </button>
            <button onClick={() => setBulkUploadOpen(true)} className="flex flex-1 xl:flex-none justify-center items-center gap-2 h-12 px-5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold transition-all hover:bg-slate-50">
              <Upload className="h-4 w-4 text-primary" />
              <span>Bulk</span>
            </button>
            {/* Filter Button */}
            <Button
              variant={filtersOpen || status || priceRange || city ? "default" : "outline"}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`rounded-lg w-12 h-12 p-0 flex items-center justify-center shrink-0 border-slate-200 transition-all duration-300 ${filtersOpen || status || priceRange || city ? 'bg-primary text-white shadow-md border-0' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 w-full max-w-3xl xl:mx-auto">
            <div className="flex w-full items-center h-12 rounded-lg border border-primary bg-white overflow-hidden">
              {/* Custom Styled Dropdown */}
              <div className="relative h-full flex items-center bg-slate-100 hover:bg-slate-200 transition-colors border-r border-slate-300 group/dropdown shrink-0">
                <select
                  value={propertyType}
                  onChange={(e) => { setPropertyType(e.target.value); setPage(1); }}
                  className="h-full pl-3 pr-7 sm:pl-4 sm:pr-9 max-w-[90px] sm:max-w-[140px] bg-transparent text-xs sm:text-sm font-medium text-slate-700 outline-none cursor-pointer appearance-none focus:ring-0 z-10 relative text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/dropdown:text-slate-700 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </div>
              
              {/* Input */}
              <input
                type="text"
                placeholder="Search by title, location, or features..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="flex-1 h-full px-3 sm:px-5 text-sm font-medium outline-none placeholder:text-slate-400 bg-transparent text-slate-800 min-w-0"
              />
              
              {/* Integrated Search Button */}
              <button
                className="h-full px-4 sm:px-6 shrink-0 bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors text-white gap-2 font-bold text-sm"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
          
          {/* Right Spacer (for perfect centering on large screens) */}
          <div className="hidden xl:block w-[280px] shrink-0"></div>
        </div>

        {/* Advanced Filters Card */}
        {filtersOpen && (
          <Card className="rounded-md p-5 border-slate-200 shadow-xl shadow-slate-200/40 animate-slide-in-down bg-white/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-heading">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UNDER_NEGOTIATION">Under Negotiation</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-heading">City</label>
                <select
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none capitalize"
                >
                  <option value="">All Cities</option>
                  {cities?.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-heading">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                >
                  <option value="">Any Price</option>
                  <option value="0-2500000">Under ₹25 Lacs</option>
                  <option value="2500000-5000000">₹25 Lacs - ₹50 Lacs</option>
                  <option value="5000000-10000000">₹50 Lacs - ₹1 Crore</option>
                  <option value="10000000-20000000">₹1 Crore - ₹2 Crores</option>
                  <option value="20000000-50000000">₹2 Crores - ₹5 Crores</option>
                  <option value="50000000-9999999999">Above ₹5 Crores</option>
                </select>
              </div>
            </div>

            {(status || priceRange || city) && (
              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStatus(''); setPriceRange(''); setCity(''); setPage(1); }}
                  className="text-[10px] font-bold text-destructive hover:bg-destructive/5 rounded-lg h-8"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ─── Grid Section ─── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isLoading ? 'Searching portfolio…' : `${total} ${total === 1 ? 'property' : 'properties'} found`}
          </p>
        </div>

        {isError ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-destructive font-bold">Failed to load portfolio.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4 rounded-xl font-bold">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !data || data.items.length === 0 ? (
          <PropertiesEmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {data.items.map((p, i) => (
                <div key={p.id} className="animate-slide-up-fade" style={{ animationDelay: `${i * 40}ms` }}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-12">
                <Button variant="outline" size="sm" disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg h-10 px-6 font-bold border-slate-200">
                  Prev
                </Button>
                <div className="h-10 flex items-center px-4 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-500">
                  {page} / {totalPages}
                </div>
                <Button variant="outline" size="sm" disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)} className="rounded-lg h-10 px-6 font-bold border-slate-200">
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Map */}
      {mapOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-fade-in">
          <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl text-slate-900">Map Explorer</span>
            </div>
            <button
              onClick={() => { setMapOpen(false); setSelectedProperty(null); }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <PropertyMap
              properties={propertiesWithLocation}
              selectedProperty={selectedProperty}
              onSelect={setSelectedProperty}
            />
          </div>

          {selectedProperty && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 animate-slide-up-fade">
              <Card className="rounded-[28px] shadow-2xl border-0 p-2 bg-white">
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={selectedProperty.media?.[0]?.cdnUrl || selectedProperty.media?.[0]?.fileUrl} 
                        className="w-full h-full object-cover" 
                        alt=""
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate text-sm font-plus">{selectedProperty.title}</p>
                      <p className="text-sm font-black text-primary">
                        {selectedProperty.priceOnRequest ? 'On Request' : formatINR(selectedProperty.price ?? null)}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl h-12 px-6 bg-primary shadow-lg shadow-primary/20 shrink-0 font-bold">
                    <Link href={`/properties/${selectedProperty.id}`} onClick={() => setMapOpen(false)}>
                      Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      
      {bulkUploadOpen && <BulkUploadDialog onClose={() => setBulkUploadOpen(false)} />}
    </div>
  );
}
