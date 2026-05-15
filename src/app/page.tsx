'use client';

import { useState } from 'react';
import Map from '@/components/Map';
import EventSidebar from '@/components/EventSidebar';
import AddEventModal from '@/components/AddEventModal';
import { useEvents } from '@/hooks/useEvents';
import type { Event } from '@/lib/types';

export default function Home() {
  const { events, loading, addEvent, deleteEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    if (addingMode) {
      setPendingCoords({ lat, lng });
      setAddingMode(false);
    }
  };

  const handleAddEvent = async (event: Omit<Event, 'id' | 'created_at'>) => {
    await addEvent(event);
    setPendingCoords(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-900">Kartalla</h1>
        <button
          onClick={() => {
            setAddingMode((prev) => !prev);
            setPendingCoords(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            addingMode
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {addingMode ? '✕ Peruuta' : '+ Lisää tapahtuma'}
        </button>
      </header>

      {addingMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 text-center">
          Klikkaa karttaa lisätäksesi tapahtuman
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <EventSidebar
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          onDeleteEvent={deleteEvent}
          loading={loading}
        />
        <div className="flex-1 relative">
          <Map
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            onMapClick={handleMapClick}
            addingMode={addingMode}
          />
        </div>
      </div>

      {pendingCoords && (
        <AddEventModal
          lat={pendingCoords.lat}
          lng={pendingCoords.lng}
          onAdd={handleAddEvent}
          onClose={() => setPendingCoords(null)}
        />
      )}
    </div>
  );
}
