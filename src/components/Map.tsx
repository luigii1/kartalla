'use client';

import dynamic from 'next/dynamic';
import type { Event, MapBounds } from '@/lib/types';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

interface MapProps {
  events: Event[];
  hoveredEvent: Event | null;
  flyTarget: Event | null;
  onSearchArea: (bounds: MapBounds) => void;
  onMapClick?: (lat: number, lng: number) => void;
  addingMode?: boolean;
  loading: boolean;
}

export default function Map(props: MapProps) {
  return (
    <div className="w-full h-full">
      <MapClient {...props} />
    </div>
  );
}
