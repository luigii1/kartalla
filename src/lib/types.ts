export interface Event {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  category: EventCategory;
  date: string;
  created_at: string;
}

export type EventCategory = 'music' | 'sports' | 'food' | 'culture' | 'other';

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
