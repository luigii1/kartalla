'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event, EventCategory } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';

// Fix Leaflet's broken default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCategoryIcon(category: EventCategory) {
  const color = CATEGORY_COLORS[category];
  return L.divIcon({
    html: `<div style="background-color:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -26],
    className: '',
  });
}

function MapClickHandler({
  onMapClick,
  addingMode,
}: {
  onMapClick: (lat: number, lng: number) => void;
  addingMode: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (addingMode) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapClientProps {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  addingMode: boolean;
}

export default function MapClient({
  events,
  selectedEvent,
  onSelectEvent,
  onMapClick,
  addingMode,
}: MapClientProps) {
  const center: [number, number] = [60.1699, 24.9384]; // Helsinki

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className={addingMode ? 'cursor-crosshair' : ''}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} addingMode={addingMode} />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={createCategoryIcon(event.category)}
          eventHandlers={{ click: () => onSelectEvent(event) }}
        >
          <Popup>
            <div className="min-w-[150px]">
              <p className="font-semibold text-sm">{event.title}</p>
              <p className="text-xs text-gray-500">{CATEGORY_LABELS[event.category]}</p>
              <p className="text-xs mt-1">
                {new Date(event.date).toLocaleDateString('fi-FI')}
              </p>
              {event.description && (
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
