'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, MapBounds } from '@/lib/types';

const PAGE_SIZE = 1000;

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchByBounds = useCallback(async (
    bounds: MapBounds,
    dateFrom?: string,
    dateTo?: string,
  ) => {
    setLoading(true);
    const fromIso = dateFrom ? `${dateFrom}T00:00:00` : new Date().toISOString();
    const toIso = dateTo ? `${dateTo}T23:59:59` : undefined;
    const all: Event[] = [];
    let from = 0;
    try {
      while (true) {
        let query = supabase
          .from('events')
          .select(
            'id,title,description,lat,lng,category,source,external_id,starts_at,ends_at,location_name,image_url,url,last_synced_at,created_at'
          )
          .gte('starts_at', fromIso)
          .gte('lat', bounds.south)
          .lte('lat', bounds.north)
          .gte('lng', bounds.west)
          .lte('lng', bounds.east)
          .order('starts_at', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (toIso) query = query.lte('starts_at', toIso);

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as Event[]));
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      setEvents(all);
    } finally {
      setLoading(false);
    }
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

  return { events, loading, fetchByBounds, addEvent, deleteEvent };
}
