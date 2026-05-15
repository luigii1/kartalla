'use client';

import type { Event } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';

interface EventSidebarProps {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  onHoverEvent?: (event: Event | null) => void;
  onDeleteEvent: (id: string) => void;
  canDelete: boolean;
  loading: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function EventSidebar({ events, selectedEvent, onSelectEvent, onHoverEvent, onDeleteEvent, canDelete, loading }: EventSidebarProps) {
  return (
    <div className="bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="font-semibold text-gray-800">
          Tapahtumat <span className="text-gray-400 font-normal text-sm">({events.length})</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-gray-400">Ladataan...</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">Ei tulevia tapahtumia.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(selectedEvent?.id === event.id ? null : event)}
              onMouseEnter={() => onHoverEvent?.(event)}
              onMouseLeave={() => onHoverEvent?.(null)}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedEvent?.id === event.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[event.category] }} />
                    <span className="text-xs text-gray-500">{CATEGORY_LABELS[event.category]}</span>
                    {event.source === 'linked_events' && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-1 rounded">LE</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                  {event.location_name && <p className="text-xs text-gray-400 truncate">{event.location_name}</p>}
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
    </div>
  );
}
