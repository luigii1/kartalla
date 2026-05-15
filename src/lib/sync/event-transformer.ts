import type { LinkedEventsEvent } from './linked-events-client';
import type { EventInsert } from '@/lib/types';
import { mapKeywordsToCategory } from './category-mapper';

type SyncInsert = EventInsert & { raw_data: unknown };

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
