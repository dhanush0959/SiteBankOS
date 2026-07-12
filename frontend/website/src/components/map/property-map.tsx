'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Property } from '@/hooks/useProperties';
import { formatINR, propertyTypeLabel } from '@/lib/property-helpers';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createMarkerIcon(isSelected: boolean) {
  const size = isSelected ? 40 : 30;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${isSelected
          ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
          : 'linear-gradient(135deg, #2563eb, #3b82f6)'};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isSelected
          ? '0 0 0 4px rgba(139,92,246,0.3), 0 6px 20px rgba(59,130,246,0.5)'
          : '0 3px 12px rgba(37,99,235,0.4)'};
        border: 2.5px solid white;
        transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function MapController({ selectedProperty }: { selectedProperty: Property | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedProperty?.location?.lat && selectedProperty?.location?.lng) {
      map.flyTo(
        [Number(selectedProperty.location.lat), Number(selectedProperty.location.lng)],
        15,
        { duration: 1.2 }
      );
    }
  }, [selectedProperty, map]);
  return null;
}

function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();
  useEffect(() => {
    if (properties.length === 0) return;
    const fit = () => {
      map.invalidateSize();
      const bounds = L.latLngBounds(
        properties
          .filter((p) => p.location?.lat && p.location?.lng)
          .map((p) => [Number(p.location.lat!), Number(p.location.lng!)] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    };
    fit();
    const timer = setTimeout(fit, 100);
    return () => clearTimeout(timer);
  }, [map, properties]);
  return null;
}

// Re-invalidate map size when fullscreen changes
function MapResizer({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [trigger, map]);
  return null;
}

interface PropertyMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelect: (property: Property) => void;
}

export default function PropertyMap({ properties, selectedProperty, onSelect }: PropertyMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const center: [number, number] = useMemo(() => {
    const valid = properties.filter((p) => p.location?.lat && p.location?.lng);
    if (valid.length === 0) return defaultCenter;
    return [
      valid.reduce((s, p) => s + Number(p.location?.lat ?? 0), 0) / valid.length,
      valid.reduce((s, p) => s + Number(p.location?.lng ?? 0), 0) / valid.length,
    ];
  }, [properties]);

  const zoom = properties.length > 0 ? 10 : 5;

  const toggleFullscreen = useCallback(() => setIsFullscreen((f) => !f), []);

  const tileUrl =
    mapStyle === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttr =
    mapStyle === 'satellite'
      ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <>
      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
          onClick={toggleFullscreen}
        />
      )}

      <div
        className={
          isFullscreen
            ? 'fixed inset-4 md:inset-8 z-[1000] rounded-2xl overflow-hidden shadow-2xl flex flex-col'
            : 'relative h-full w-full rounded-2xl overflow-hidden flex flex-col'
        }
      >
        {/* Map toolbar */}
        <div className="absolute top-3 right-3 z-[1001] flex flex-col gap-2">
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-white/30 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-150"
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              </svg>
            )}
          </button>

          {/* Map style toggle */}
          <button
            onClick={() => setMapStyle((s) => (s === 'streets' ? 'satellite' : 'streets'))}
            title={mapStyle === 'streets' ? 'Switch to Satellite' : 'Switch to Streets'}
            className="w-9 h-9 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-white/30 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-150"
          >
            {mapStyle === 'streets' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
            )}
          </button>
        </div>

        {/* Property count badge */}
        {properties.length > 0 && (
          <div className="absolute top-3 left-3 z-[1001]">
            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-white/30 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </span>
            </div>
          </div>
        )}

        <MapContainer
          center={center}
          zoom={zoom}
          className="flex-1 w-full"
          zoomControl={false}
          style={{ background: '#e8edf3', minHeight: '100%' }}
        >
          <TileLayer attribution={tileAttr} url={tileUrl} />
          <MapController selectedProperty={selectedProperty} />
          <MapResizer trigger={isFullscreen} />
          {properties.length > 0 && <FitBounds properties={properties} />}
          {properties.map((property) => {
            if (!property.location?.lat || !property.location?.lng) return null;
            const isSelected = selectedProperty?.id === property.id;
            return (
              <Marker
                key={property.id}
                position={[Number(property.location.lat), Number(property.location.lng)]}
                icon={createMarkerIcon(isSelected)}
                eventHandlers={{ click: () => onSelect(property) }}
              >
                <Popup
                  className="property-popup"
                  offset={[0, -8]}
                >
                  <div style={{
                    minWidth: '200px',
                    padding: '4px 2px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    <p style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '4px',
                      color: '#111827',
                      lineHeight: '1.4',
                    }}>
                      {property.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                      📍 {property.location?.city ?? ''}
                      {property.location?.state ? `, ${property.location.state}` : ''}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {propertyTypeLabel(property.propertyType)}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1d4ed8' }}>
                        {property.priceOnRequest ? 'On Request' : formatINR(property.price ?? null)}
                      </span>
                    </div>
                    <a
                      href={`/properties/${property.id}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '12px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      View Details →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
