'use client';

import type { Event } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/types';

interface EventSidebarProps {
  events: Event[];
  selectedEvent: Event | null;
  hoveredEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onHoverEvent: (event: Event | null) => void;
  canDelete: boolean;
  loading: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric', month: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventSidebar({
  events, selectedEvent, hoveredEvent, onSelectEvent, onDeleteEvent, onHoverEvent, canDelete, loading,
}: EventSidebarProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <p className="p-4 text-sm text-gray-400">Haetaan tapahtumia...</p>
      ) : events.length === 0 ? (
        <p className="p-4 text-sm text-gray-400">
          Ei tapahtumia. Paina &ldquo;Etsi tältä alueelta&rdquo; kartalla.
        </p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            onMouseEnter={() => onHoverEvent(event)}
            onMouseLeave={() => onHoverEvent(null)}
            className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
              selectedEvent?.id === event.id
                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                : hoveredEvent?.id === event.id
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white leading-none"
                    style={{ backgroundColor: CATEGORY_COLORS[event.category], fontSize: '9px' }}
                  >
                    {CATEGORY_ICONS[event.category]}
                  </span>
                  <span className="text-xs text-gray-500">{CATEGORY_LABELS[event.category]}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                {event.location_name && (
                  <p className="text-xs text-gray-400 truncate">{event.location_name}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.starts_at)}</p>
              </div>
              {canDelete && event.source === 'manual' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none flex-shrink-0 mt-0.5"
                  title="Poista"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
