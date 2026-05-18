export interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string | null } | null;
  start: { utc: string };
  end: { utc: string } | null;
  url: string;
  logo: { original: { url: string } } | null;
  category_id: string | null;
  venue: {
    name: string | null;
    address: {
      latitude: string | null;
      longitude: string | null;
    };
  } | null;
}

interface EventbriteResponse {
  events: EventbriteEvent[];
  pagination: {
    has_more_items: boolean;
    page_number: number;
    page_count: number;
  };
}

export async function fetchEventbriteEvents(): Promise<EventbriteEvent[]> {
  // Eventbrite /events/search/ was deprecated in 2020 — no public discovery API exists anymore
  console.log('[sync] Eventbrite: public search API no longer available, skipping');
  return [];

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 60);

  const baseParams = new URLSearchParams({
    'location.country': 'FI',
    'start_date.range_start': now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    'start_date.range_end': future.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    expand: 'venue,logo',
    page_size: '50',
    status: 'live',
  });

  const all: EventbriteEvent[] = [];
  let page = 1;
  const PAGE_LIMIT = 20; // max 1000 events per sync

  while (page <= PAGE_LIMIT) {
    const url = `https://www.eventbriteapi.com/v3/events/search/?${baseParams}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Eventbrite API error: ${res.status} — ${body.slice(0, 300)}`);
    }

    const json: EventbriteResponse = await res.json();
    all.push(...(json.events ?? []));

    if (!json.pagination.has_more_items) break;
    page++;
  }

  return all;
}
