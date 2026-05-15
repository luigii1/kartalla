'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useCallback } from 'react';
import Map from '@/components/Map';
import EventSidebar from '@/components/EventSidebar';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import AddEventModal from '@/components/AddEventModal';
import AuthModal from '@/components/AuthModal';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import type { Event, EventInsert } from '@/lib/types';

function applyFilters(events: Event[], filters: Filters): Event[] {
  let result = events.filter((e) => filters.categories.has(e.category));
  if (filters.dateFrom) result = result.filter((e) => e.starts_at >= filters.dateFrom);
  if (filters.dateTo) result = result.filter((e) => e.starts_at <= filters.dateTo + 'T23:59:59');
  if (filters.sort === 'date_asc') result = [...result].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  else if (filters.sort === 'date_desc') result = [...result].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  else if (filters.sort === 'name_asc') result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fi'));
  return result;
}

export default function Home() {
  const { events, loading, fetchByBounds, addEvent, deleteEvent } = useEvents();
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [flyTarget, setFlyTarget] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const filteredEvents = useMemo(() => applyFilters(events, filters), [events, filters]);

  const handleSelectFromMap = useCallback((event: Event | null) => {
    setSelectedEvent(event);
  }, []);

  const handleSelectFromList = useCallback((event: Event) => {
    setSelectedEvent(event);
    setFlyTarget(event);
    setSheetOpen(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (addingMode) { setPendingCoords({ lat, lng }); setAddingMode(false); }
  }, [addingMode]);

  const handleAddEvent = async (event: EventInsert) => {
    await addEvent(event);
    setPendingCoords(null);
  };

  const AuthButtons = (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <button
            onClick={() => { setAddingMode((p) => !p); setPendingCoords(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              addingMode ? 'bg-red-100 text-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {addingMode ? '✕ Peruuta' : '+ Lisää'}
          </button>
          <button onClick={() => signOut()} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
            Ulos
          </button>
        </>
      ) : (
        <button
          onClick={() => setShowAuth(true)}
          disabled={authLoading}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Kirjaudu
        </button>
      )}
    </div>
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <Map
          events={filteredEvents}
          selectedEvent={selectedEvent}
          hoveredEvent={hoveredEvent}
          flyTarget={flyTarget}
          onSelectEvent={handleSelectFromMap}
          onSearchArea={fetchByBounds}
          onMapClick={handleMapClick}
          addingMode={addingMode}
          loading={loading}
        />
      </div>

      {/* Desktop sidebar (md+) */}
      <div className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 w-80 z-[400] bg-white border-r border-gray-200 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900">Kartalla</h1>
          {AuthButtons}
        </div>
        {addingMode && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700 text-center flex-shrink-0">
            Klikkaa karttaa lisätäksesi tapahtuman
          </div>
        )}
        <FilterBar filters={filters} eventCount={filteredEvents.length} onChange={setFilters} />
        <EventSidebar
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectFromList}
          onDeleteEvent={deleteEvent}
          onHoverEvent={setHoveredEvent}
          canDelete={!!user}
          loading={loading}
        />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[500] bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Kartalla</h1>
        {AuthButtons}
      </div>

      {addingMode && (
        <div className="md:hidden absolute top-[52px] left-0 right-0 z-[500] bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700 text-center">
          Klikkaa karttaa lisätäksesi tapahtuman
        </div>
      )}

      {/* Mobile bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-[500]">
        <button
          onClick={() => setSheetOpen((p) => !p)}
          className="w-full bg-white border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 flex items-center justify-between shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        >
          <span>Tapahtumat ({filteredEvents.length})</span>
          <span className="text-gray-400">{sheetOpen ? '↓' : '↑'}</span>
        </button>
        {sheetOpen && (
          <div className="bg-white h-[60vh] flex flex-col overflow-hidden border-t border-gray-100">
            <FilterBar filters={filters} eventCount={filteredEvents.length} onChange={setFilters} />
            <EventSidebar
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={handleSelectFromList}
              onDeleteEvent={deleteEvent}
              onHoverEvent={setHoveredEvent}
              canDelete={!!user}
              loading={loading}
            />
          </div>
        )}
      </div>

      {pendingCoords && (
        <AddEventModal
          lat={pendingCoords.lat}
          lng={pendingCoords.lng}
          onAdd={handleAddEvent}
          onClose={() => setPendingCoords(null)}
        />
      )}
      {showAuth && <AuthModal onSignIn={signIn} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
