'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, MapBounds } from '@/lib/types';

const PAGE_SIZE = 1000;

async function fetchPage(bounds: MapBounds, now: string, from: number): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id,title,description,lat,lng,category,source,external_id,starts_at,ends_at,location_name,image_url,url,last_synced_at,created_at'
    )
    .gte('starts_at', now)
    .gte('lat', bounds.south)
    .lte('lat', bounds.north)
    .gte('lng', bounds.west)
    .lte('lng', bounds.east)
    .order('starts_at', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;
  return (data as Event[]) ?? [];
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByBounds = useCallback(async (bounds: MapBounds) => {
    setLoading(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      const all: Event[] = [];
      let from = 0;
      while (true) {
        const page = await fetchPage(bounds, now, from);
        all.push(...page);
        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      setEvents(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe ladattaessa tapahtumia');
    }
    setLoading(false);
  }, []);

  const addEvent = async (event: EventInsert) => {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    setEvents((prev) =>
      [...prev, data as Event].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    );
    return data as Event;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, loading, error, fetchByBounds, addEvent, deleteEvent };
}
