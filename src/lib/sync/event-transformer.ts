import type { LinkedEventsEvent } from './linked-events-client';
import type { EventbriteEvent } from './eventbrite-client';
import type { EventCategory, EventInsert } from '@/lib/types';
import { mapKeywordsToCategory } from './category-mapper';

export type SyncInsert = EventInsert & { raw_data: unknown };

const EVENTBRITE_CATEGORY_MAP: Record<string, EventCategory> = {
  '103': 'music',
  '104': 'culture',  // film & media
  '105': 'culture',  // performing & visual arts
  '107': 'sports',   // health & wellness
  '108': 'sports',   // sports & fitness
  '109': 'sports',   // travel & outdoor
  '110': 'food',
  '113': 'culture',  // community & culture
  '115': 'family',   // family & education
  '116': 'family',   // school activities
};

const fi = (obj: Record<string, string | undefined> | null | undefined): string | null =>
  obj?.fi ?? obj?.en ?? obj?.sv ?? null;

export function transformLinkedEvent(event: LinkedEventsEvent): SyncInsert | null {
  if (!event.start_time) return null;

  const coords = event.location?.position?.coordinates;
  if (!coords) return null;

  const [lng, lat] = coords; // GeoJSON: [lng, lat]

  return {
    title: fi(event.name ?? undefined) ?? 'Nimetön tapahtuma',
    description: fi(event.description ?? undefined) ?? fi(event.short_description ?? undefined),
    lat,
    lng,
    category: mapKeywordsToCategory(event.keywords ?? []),
    source: 'linked_events',
    external_id: event.id,
    starts_at: event.start_time,
    ends_at: event.end_time ?? null,
    location_name: fi(event.location?.name) ?? null,
    image_url: event.images?.[0]?.url ?? null,
    url: fi(event.info_url ?? undefined),
    last_synced_at: new Date().toISOString(),
    raw_data: event,
  };
}

export function transformEventbriteEvent(event: EventbriteEvent): SyncInsert | null {
  const lat = parseFloat(event.venue?.address.latitude ?? '');
  const lng = parseFloat(event.venue?.address.longitude ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    title: event.name.text,
    description: event.description?.text ?? null,
    lat,
    lng,
    category: EVENTBRITE_CATEGORY_MAP[event.category_id ?? ''] ?? 'other',
    source: 'eventbrite',
    external_id: event.id,
    starts_at: event.start.utc,
    ends_at: event.end?.utc ?? null,
    location_name: event.venue?.name ?? null,
    image_url: event.logo?.original?.url ?? null,
    url: event.url,
    last_synced_at: new Date().toISOString(),
    raw_data: event,
  };
}
