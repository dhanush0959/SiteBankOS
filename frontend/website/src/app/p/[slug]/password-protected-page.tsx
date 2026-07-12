'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  CheckCircle2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Layers,
  Calendar,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { PasswordGate } from './password-gate';
import { EventTracker } from './event-tracker';
import { LeadForm } from './lead-form';
import { ContactBar } from './contact-bar';
import { MicrositeGallery } from '@/components/properties/microsite-gallery';
import { MicrositeGridGallery } from './microsite-grid-gallery';
import MicrositeChatbot from './microsite-chatbot';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

// Dynamic import for public property map
const PublicPropertyMap = dynamic(() => import('@/components/map/public-property-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-muted-foreground animate-pulse rounded-2xl">
      Loading map location...
    </div>
  ),
});

function formatINR(value: string | undefined): string {
  if (!value) return '—';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '—';
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

// Helper to resolve specs icons
function getSpecIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes('bedroom')) return <Bed className="h-4.5 w-4.5 text-blue-600" />;
  if (k.includes('bathroom') || k.includes('washroom')) return <Bath className="h-4.5 w-4.5 text-blue-600" />;
  if (k.includes('area') || k.includes('sqft')) return <Ruler className="h-4.5 w-4.5 text-blue-600" />;
  if (k.includes('floor')) return <Layers className="h-4.5 w-4.5 text-blue-600" />;
  if (k.includes('age') || k.includes('year')) return <Calendar className="h-4.5 w-4.5 text-blue-600" />;
  return <HelpCircle className="h-4.5 w-4.5 text-blue-600" />;
}

export function PasswordProtectedPage({ slug }: { slug: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!password) return;

    async function loadContent() {
      try {
        const res = await fetch(`${API}/smart-links/${slug}/public`, {
          headers: { 'x-smart-link-password': password! },
        });

        if (res.status === 401) {
          setPassword(null);
          setError('Password was rejected.');
          return;
        }
        if (!res.ok) {
          setError('Failed to load property details.');
          return;
        }

        const json = await res.json();
        setData(json.data);
      } catch {
        setError('Network error loading property.');
      }
    }
    loadContent();
  }, [slug, password]);

  if (!password) {
    return <PasswordGate slug={slug} onSuccess={setPassword} error={error} />;
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { property, agent } = data;
  const cover = property.media?.find((m: any) => m.isCover) ?? property.media?.find((m: any) => m.fileType !== 'AUDIO');
  const coverUrl = cover?.cdnUrl ?? cover?.fileUrl;
  const gallery = (property.media ?? []).filter((m: any) => m.fileType !== 'AUDIO').slice(0, 8);
  const audioNotes = (property.media ?? []).filter((m: any) => m.fileType === 'AUDIO');

  const lat = property.location?.lat ? parseFloat(String(property.location.lat)) : NaN;
  const lng = property.location?.lng ? parseFloat(String(property.location.lng)) : NaN;
  const hasMap = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="min-h-dvh bg-slate-50/50 text-slate-800 font-sans flex flex-col">
      {/* Premium Sticky Header */}
      <header className="h-16 border-b border-slate-200/80 bg-white sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Site<span className="text-blue-600">Bank</span>
          </span>
        </div>
      </header>

      <EventTracker slug={slug} />

      {/* Modern Banner Container */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 border border-slate-200/60">
          <MicrositeGallery media={property.media || []} title={property.title} />
        </div>
      </div>

      {/* Main Info Header (Below Cover Photo) */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="bg-white border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {property.verificationStatus === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Listing
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {property.title}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-blue-600 shrink-0" /> {property.location.address}, {property.location.city}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Price</p>
              <p className="text-3xl font-black text-blue-600 mt-0.5">
                {property.priceOnRequest ? 'On Request' : formatINR(property.price)}
              </p>
              {property.priceNegotiable && !property.priceOnRequest && (
                <p className="text-[10px] bg-primary text-foreground border border-foreground/20 px-2 py-0.5 rounded-md inline-block font-semibold mt-1">
                  Negotiable
                </p>
              )}
            </div>
            <ContactBar
              slug={slug}
              agentPhone={agent.phone}
              agentWhatsapp={agent.whatsappNumber}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </div>

      {/* Mobile-only Agent + Lead Form (Early scroll visibility) */}
      <div className="md:hidden max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {/* Agent Card */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Listed By</p>
          <div className="flex items-center gap-3.5">
            {agent.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.profilePhotoUrl}
                alt={agent.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-extrabold text-base border">
                {agent.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-800 leading-snug">{agent.name}</p>
              {agent.agencyName && (
                <p className="text-xs text-slate-500 mt-0.5">{agent.agencyName}</p>
              )}
            </div>
          </div>
        </div>

        <LeadForm slug={slug} propertyTitle={property.title} />
      </div>

      {/* Details Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-6 mb-12 grid md:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* About description */}
          {property.aiGeneratedDescription && (
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-3">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3">About this property</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.aiGeneratedDescription}
              </p>
            </div>
          )}

          {/* Voice Notes */}
          {audioNotes.length > 0 && (
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8" />
                </svg>
                Voice Notes
              </h2>
              <div className="space-y-3">
                {audioNotes.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="animate-pulse"
                      >
                        <path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4" />
                      </svg>
                    </div>
                    <audio controls className="w-full h-9">
                      <source src={a.fileUrl} />
                    </audio>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          {property.specs && Object.keys(property.specs).length > 0 && (
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {Object.entries(property.specs)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .map(([k, v]) => {
                    const icon = getSpecIcon(k);
                    return (
                      <div
                        key={k}
                        className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {k.replace(/([A-Z])/g, ' $1').trim()}
                          </dt>
                          <dd className="font-extrabold text-sm text-slate-700 mt-0.5 truncate">
                            {String(v)}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Map Location Section */}
          {hasMap && (
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Location Map
                </h2>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 underline md:no-underline md:hover:underline"
                >
                  Get Directions{' '}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                  </svg>
                </a>
              </div>
              <div className="h-[300px] w-full rounded-2xl overflow-hidden border relative shadow-inner">
                <PublicPropertyMap
                  lat={lat}
                  lng={lng}
                  title={property.title}
                  address={`${property.location.address}, ${property.location.city}`}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">Address:</span> {property.location.address}, {property.location.city}, {property.location.state || ''}
              </p>
            </div>
          )}

          {/* Photos/Gallery */}
          <MicrositeGridGallery media={property.media || []} propertyTitle={property.title} />

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Amenities</h2>
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((a: string) => (
                  <li
                    key={a}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-slate-600"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden md:block space-y-6">
          {/* Agent Card */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Listed By</p>
            <div className="flex items-center gap-3.5">
              {agent.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agent.profilePhotoUrl}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-extrabold text-base border">
                  {agent.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-800 leading-snug">{agent.name}</p>
                {agent.agencyName && (
                  <p className="text-xs text-slate-500 mt-0.5">{agent.agencyName}</p>
                )}
              </div>
            </div>
          </div>

          <LeadForm slug={slug} propertyTitle={property.title} />
        </aside>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-4 pb-[88px] md:pb-4 border-t border-slate-200 bg-white">
        <p className="text-xs text-center text-slate-400">
          Powered by <span className="font-bold text-slate-500">SiteBank</span>
        </p>
      </footer>

      <MicrositeChatbot slug={slug} propertyTitle={property.title} />
    </div>
  );
}
