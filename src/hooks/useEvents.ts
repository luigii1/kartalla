'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event, EventInsert } from '@/lib/types';

const PAGE_SIZE = 1000;

async function fetchAllEvents(now: string): Promise<Event[]> {
  const all: Event[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('events')
      .select(
        'id,title,description,lat,lng,category,source,external_id,starts_at,ends_at,location_name,image_url,url,last_synced_at,created_at'
      )
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Event[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();
    try {
      const data = await fetchAllEvents(now);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe ladattaessa tapahtumia');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  return { events, loading, error, addEvent, deleteEvent, refetch: fetchEvents };
}
