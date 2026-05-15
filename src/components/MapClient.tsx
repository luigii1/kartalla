'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import type { Event, EventCategory, MapBounds } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function hasValidCoords(event: Event): boolean {
  return Number.isFinite(event.lat as number) && Number.isFinite(event.lng as number);
}

function getBounds(map: L.Map): MapBounds {
  const b = map.getBounds();
  return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
}

function inBounds(event: Event, bounds: MapBounds): boolean {
  return (
    event.lat >= bounds.south && event.lat <= bounds.north &&
    event.lng >= bounds.west && event.lng <= bounds.east
  );
}

function createCategoryIcon(category: EventCategory) {
  const color = CATEGORY_COLORS[category];
  return L.divIcon({
    html: `<div style="background-color:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
    iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -26], className: '',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function MapClickHandler({ onMapClick, addingMode }: { onMapClick: (lat: number, lng: number) => void; addingMode: boolean }) {
  useMapEvents({
    click: (e) => { if (addingMode) onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function MapController({ selectedEvent }: { selectedEvent: Event | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedEvent && hasValidCoords(selectedEvent)) {
      map.flyTo([selectedEvent.lat, selectedEvent.lng], Math.max(map.getZoom(), 14), {
        animate: true, duration: 0.8,
      });
    }
  }, [selectedEvent, map]);
  return null;
}

function BoundsController({
  onChanged,
}: {
  onChanged: (bounds: MapBounds, moved: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onChanged(getBounds(map), false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({
    moveend: () => onChanged(getBounds(map), true),
    zoomend: () => onChanged(getBounds(map), true),
  });

  return null;
}

function EventMarker({ event, isSelected, onSelectEvent }: {
  event: Event;
  isSelected: boolean;
  onSelectEvent: (event: Event) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) markerRef.current.openPopup();
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[event.lat, event.lng]}
      icon={createCategoryIcon(event.category)}
      eventHandlers={{ click: () => onSelectEvent(event) }}
    >
      <Popup>
        <div className="min-w-[180px] max-w-[240px]">
          {event.image_url && (
            <div className="relative w-full h-28 mb-2">
              <Image src={event.image_url} alt={event.title} fill className="object-cover rounded" unoptimized />
            </div>
          )}
          <p className="font-semibold text-sm leading-snug">{event.title}</p>
          {event.location_name && <p className="text-xs text-gray-500 mt-0.5">{event.location_name}</p>}
          <p className="text-xs text-gray-400 mt-1">{CATEGORY_LABELS[event.category]}</p>
          <p className="text-xs mt-1">{formatDateTime(event.starts_at)}</p>
          {event.ends_at && <p className="text-xs text-gray-400">– {formatDateTime(event.ends_at)}</p>}
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-2 block">Lue lisää →</a>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

interface MapClientProps {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  addingMode: boolean;
  onSearchArea: (bounds: MapBounds) => void;
  loading: boolean;
}

export default function MapClient({
  events, selectedEvent, onSelectEvent, onMapClick, addingMode, onSearchArea, loading,
}: MapClientProps) {
  const center: [number, number] = [60.1699, 24.9384];
  const [showSearchButton, setShowSearchButton] = useState(true);
  const [viewBounds, setViewBounds] = useState<MapBounds | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleBoundsChanged = useCallback((bounds: MapBounds, moved: boolean) => {
    setViewBounds(bounds);
    if (moved) setShowSearchButton(true);
  }, []);

  const handleSearch = useCallback(() => {
    if (!mapRef.current) return;
    onSearchArea(getBounds(mapRef.current));
    setShowSearchButton(false);
  }, [onSearchArea]);

  // Vain nykyisessä näkymässä olevat markerit renderoidaan
  const validEvents = events.filter(hasValidCoords);
  const visibleEvents = viewBounds
    ? validEvents.filter((e) => inBounds(e, viewBounds))
    : validEvents;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className={addingMode ? 'cursor-crosshair' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />
        <MapClickHandler onMapClick={onMapClick} addingMode={addingMode} />
        <MapController selectedEvent={selectedEvent} />
        <BoundsController onChanged={handleBoundsChanged} />
        {visibleEvents.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            isSelected={selectedEvent?.id === event.id}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </MapContainer>

      {loading ? (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 md:left-[calc(50%+9rem)] bg-white px-4 py-2 rounded-full shadow-md text-sm text-gray-500 border border-gray-200"
          style={{ zIndex: 1000 }}
        >
          Ladataan...
        </div>
      ) : showSearchButton ? (
        <button
          onClick={handleSearch}
          className="absolute top-3 left-1/2 -translate-x-1/2 md:left-[calc(50%+9rem)] bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          style={{ zIndex: 1000 }}
        >
          Etsi tältä alueelta
        </button>
      ) : null}
    </div>
  );
}
