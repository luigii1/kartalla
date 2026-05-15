'use client';

import { useState } from 'react';
import Map from '@/components/Map';
import EventSidebar from '@/components/EventSidebar';
import AddEventModal from '@/components/AddEventModal';
import AuthModal from '@/components/AuthModal';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import type { Event, EventInsert } from '@/lib/types';

export default function Home() {
  const { events, loading, addEvent, deleteEvent } = useEvents();
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const handleMapClick = (lat: number, lng: number) => {
    if (addingMode) { setPendingCoords({ lat, lng }); setAddingMode(false); }
  };

  const handleAddEvent = async (event: EventInsert) => {
    await addEvent(event);
    setPendingCoords(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-900">Kartalla</h1>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => { setAddingMode((prev) => !prev); setPendingCoords(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addingMode ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                {addingMode ? '✕ Peruuta' : '+ Lisää tapahtuma'}
              </button>
              <button onClick={() => signOut()}
                className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                Kirjaudu ulos
              </button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} disabled={authLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Kirjaudu
            </button>
          )}
        </div>
      </header>

      {addingMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 text-center">
          Klikkaa karttaa lisätäksesi tapahtuman
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <EventSidebar
          events={events} selectedEvent={selectedEvent} onSelectEvent={setSelectedEvent}
          onDeleteEvent={deleteEvent} canDelete={!!user} loading={loading}
        />
        <div className="flex-1 relative">
          <Map events={events} selectedEvent={selectedEvent} onSelectEvent={setSelectedEvent}
            onMapClick={handleMapClick} addingMode={addingMode} />
        </div>
      </div>

      {pendingCoords && (
        <AddEventModal lat={pendingCoords.lat} lng={pendingCoords.lng}
          onAdd={handleAddEvent} onClose={() => setPendingCoords(null)} />
      )}

      {showAuth && <AuthModal onSignIn={signIn} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
