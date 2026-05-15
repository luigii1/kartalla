export type EventCategory = 'music' | 'sports' | 'food' | 'culture' | 'other';
export type EventSource = 'manual' | 'linked_events';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  category: EventCategory;
  source: EventSource;
  external_id: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  image_url: string | null;
  url: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export type EventInsert = Omit<Event, 'id' | 'created_at'>;

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Musiikki',
  sports: 'Urheilu',
  food: 'Ruoka & juoma',
  culture: 'Kulttuuri',
  other: 'Muu',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  music: '#8b5cf6',
  sports: '#10b981',
  food: '#f59e0b',
  culture: '#3b82f6',
  other: '#6b7280',
};
