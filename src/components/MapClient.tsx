'use client';

import { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event, EventCategory, MapBounds } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 12 possible icons (6 categories × 2 sizes) — cached to avoid recreating on every render
const iconCache = new Map<string, L.DivIcon>();
function createCategoryIcon(category: EventCategory, size: 'normal' | 'hover' = 'normal') {
  const key = `${category}-${size}`;
  if (iconCache.has(key)) return iconCache.get(key)!;
  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];
  const px = size === 'hover' ? 32 : 24;
  const fontSize = size === 'hover' ? 13 : 10;
  const border = size === 'hover' ? 3 : 2;
  const shadow = size === 'hover' ? '0 3px 10px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.3)';
  const divIcon = L.divIcon({
    html: `<div style="background-color:${color};width:${px}px;height:${px}px;border-radius:50%;border:${border}px solid white;box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;line-height:1;color:white;">${icon}</div>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px],
    popupAnchor: [0, -(px + 4)],
    className: '',
  });
  iconCache.set(key, divIcon);
  return divIcon;
}

function createClusterIcon(count: number) {
  const px = count < 10 ? 36 : count < 100 ? 44 : 52;
  const fontSize = count < 10 ? 14 : count < 100 ? 13 : 12;
  return L.divIcon({
    html: `<div style="background:#1d4ed8;color:white;width:${px}px;height:${px}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:700;">${count}</div>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    className: '',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function inBounds(event: Event, bounds: MapBounds): boolean {
  return (
    Number.isFinite(event.lat) && Number.isFinite(event.lng) &&
    event.lat >= bounds.south && event.lat <= bounds.north &&
    event.lng >= bounds.west && event.lng <= bounds.east
  );
}

function BoundsController({ onBoundsChange }: { onBoundsChange: (b: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    },
    zoomend: () => {
      const b = map.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    },
  });
  useEffect(() => {
    const b = map.getBounds();
    onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function MapController({ flyTarget }: { flyTarget: Event | null }) {
  const map = useMap();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (!flyTarget) return;
    if (prev.current === flyTarget.id) return;
    prev.current = flyTarget.id;
    if (Number.isFinite(flyTarget.lat) && Number.isFinite(flyTarget.lng)) {
      map.flyTo([flyTarget.lat, flyTarget.lng], 15, { duration: 1 });
    }
  }, [flyTarget, map]);
  return null;
}

function MapClickHandler({ onMapClick, addingMode }: { onMapClick?: (lat: number, lng: number) => void; addingMode?: boolean }) {
  useMapEvents({
    click: (e) => { if (addingMode && onMapClick) onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

const EventMarker = memo(function EventMarker({
  event, isSelected, isHovered, onSelect,
}: {
  event: Event;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (e: Event | null) => void;
}) {
  return (
    <Marker
      position={[event.lat, event.lng]}
      icon={createCategoryIcon(event.category, isHovered ? 'hover' : 'normal')}
      zIndexOffset={isHovered ? 1000 : isSelected ? 500 : 0}
      eventHandlers={{ click: () => onSelect(isSelected ? null : event) }}
    >
      <Popup>
        <div className="min-w-[180px] max-w-[240px]">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt={event.title} className="w-full h-28 object-cover rounded mb-2" />
          )}
          <p className="font-semibold text-sm leading-snug">{event.title}</p>
          {event.location_name && <p className="text-xs text-gray-500 mt-0.5">{event.location_name}</p>}
          <p className="text-xs text-gray-400 mt-1">{CATEGORY_LABELS[event.category]}</p>
          <p className="text-xs mt-1">{formatDateTime(event.starts_at)}</p>
          {event.ends_at && <p className="text-xs text-gray-400">– {formatDateTime(event.ends_at)}</p>}
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-2 block">
              Lue lisää →
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

interface MapClientProps {
  events: Event[];
  selectedEvent: Event | null;
  hoveredEvent: Event | null;
  flyTarget: Event | null;
  onSelectEvent: (event: Event | null) => void;
  onSearchArea: (bounds: MapBounds) => void;
  onMapClick?: (lat: number, lng: number) => void;
  addingMode?: boolean;
  loading: boolean;
}

export default function MapClient({
  events, selectedEvent, hoveredEvent, flyTarget,
  onSelectEvent, onSearchArea, onMapClick, addingMode, loading,
}: MapClientProps) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(true);

  const handleBoundsChange = useCallback((b: MapBounds) => {
    setBounds(b);
    setShowSearchButton(true);
  }, []);

  const handleSearch = () => {
    if (bounds) {
      onSearchArea(bounds);
      setShowSearchButton(false);
    }
  };

  const visibleEvents = useMemo(
    () => bounds ? events.filter((e) => inBounds(e, bounds)) : events,
    [events, bounds]
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[60.1699, 24.9384]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className={addingMode ? 'cursor-crosshair' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <BoundsController onBoundsChange={handleBoundsChange} />
        <MapController flyTarget={flyTarget} />
        <MapClickHandler onMapClick={onMapClick} addingMode={addingMode} />
        <MarkerClusterGroup
          chunkedLoading
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          iconCreateFunction={(cluster: any) => createClusterIcon(cluster.getChildCount())}
          maxClusterRadius={50}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
        >
          {visibleEvents.map((event) => (
            <EventMarker
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              isHovered={hoveredEvent?.id === event.id}
              onSelect={onSelectEvent}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {showSearchButton && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400]">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Haetaan...' : 'Etsi tältä alueelta'}
          </button>
        </div>
      )}

      {loading && !showSearchButton && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400]">
          <div className="bg-white shadow-md rounded-full px-4 py-2 text-sm text-gray-500 border border-gray-200">
            Haetaan...
          </div>
        </div>
      )}
    </div>
  );
}
