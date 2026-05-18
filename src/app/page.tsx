'use client';

import { useState, useMemo } from 'react';
import Map from '@/components/Map';
import EventSidebar from '@/components/EventSidebar';
import AddEventModal from '@/components/AddEventModal';
import AuthModal from '@/components/AuthModal';
import FilterBar, { defaultFilters } from '@/components/FilterBar';
import type { Filters } from '@/components/FilterBar';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import type { Event, EventInsert, MapBounds } from '@/lib/types';

export default function Home() {
  const { events, loading, fetchByBounds, addEvent, deleteEvent } = useEvents();
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [flyTarget, setFlyTarget] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    let result = events.filter((e) => {
      if (!filters.categories.has(e.category)) return false;
      const day = e.starts_at.slice(0, 10);
      if (filters.dateFrom && day < filters.dateFrom) return false;
      if (filters.dateTo && day > filters.dateTo) return false;
      return true;
    });
    if (filters.sort === 'date_desc') {
      result = [...result].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    } else if (filters.sort === 'name_asc') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fi'));
    }
    return result;
  }, [events, filters]);

  const handleSelectFromMap = (event: Event | null) => setSelectedEvent(event);

  const handleSelectFromList = (event: Event | null) => {
    setSelectedEvent(event);
    setFlyTarget(event);
    if (event) setSheetOpen(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (addingMode) { setPendingCoords({ lat, lng }); setAddingMode(false); }
  };

  const handleAddEvent = async (event: EventInsert) => {
    await addEvent(event);
    setPendingCoords(null);
  };

  const filterBar = (
    <FilterBar
      filters={filters}
      onChange={setFilters}
      total={events.length}
      filtered={filteredEvents.length}
    />
  );

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Kartalla</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => { setAddingMode((prev) => !prev); setPendingCoords(null); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    addingMode ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {addingMode ? '✕ Peruuta' : '+ Lisää'}
                </button>
                <button onClick={() => signOut()}
                  className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                  Ulos
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} disabled={authLoading}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Kirjaudu
              </button>
            )}
          </div>
        </div>
      </header>

      {addingMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 text-center flex-shrink-0">
          Klikkaa karttaa lisätäksesi tapahtuman
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <Map
            events={filteredEvents}
            selectedEvent={selectedEvent}
            flyTarget={flyTarget}
            hoveredEvent={hoveredEvent}
            onSelectEvent={handleSelectFromMap}
            onMapClick={handleMapClick}
            addingMode={addingMode}
            onSearchArea={fetchByBounds}
            loading={loading}
          />
        </div>

        <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-72 bg-white shadow-md flex-col" style={{ zIndex: 400 }}>
          {filterBar}
          <EventSidebar
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={handleSelectFromList}
            onHoverEvent={setHoveredEvent}
            onDeleteEvent={deleteEvent}
            canDelete={!!user}
            loading={loading}
          />
        </div>

        <div
          className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 flex flex-col"
          style={{
            zIndex: 1001,
            maxHeight: '80dvh',
            transform: sheetOpen
              ? 'translateY(0)'
              : 'translateY(calc(100% - 56px - env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="w-full h-14 flex flex-col items-center justify-center gap-0.5 flex-shrink-0"
          >
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Ladataan...' : `${filteredEvents.length} tapahtumaa`}
            </span>
          </button>
          {sheetOpen && (
            <>
              {filterBar}
              <div className="flex-1 overflow-y-auto">
                <EventSidebar
                  events={filteredEvents}
                  selectedEvent={selectedEvent}
                  onSelectEvent={handleSelectFromList}
                  onHoverEvent={setHoveredEvent}
                  onDeleteEvent={deleteEvent}
                  canDelete={!!user}
                  loading={loading}
                />
              </div>
            </>
          )}
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)', flexShrink: 0 }} />
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

      {showAuth && <AuthModal onSignIn={signIn} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
