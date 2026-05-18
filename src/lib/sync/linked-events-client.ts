export interface LinkedEventsSource {
  baseUrl: string;
  label: string;
  supportsEventStatus?: boolean;
  supportsInclude?: boolean;
}

// Lisää kaupunkeja tähän listaan kun endpoints on varmistettu
export const LINKED_EVENTS_SOURCES: LinkedEventsSource[] = [
  {
    baseUrl: 'https://api.hel.fi/linkedevents/v1',
    label: 'Helsinki',
    supportsEventStatus: true,
    supportsInclude: true,
  },
  {
    baseUrl: 'http://linkedevents.tampere.fi/v1',
    label: 'Tampere',
    supportsEventStatus: false,
    supportsInclude: false,
  },
];

export interface LinkedEventsEvent {
  id: string;
  name: { fi?: string; en?: string; sv?: string } | null;
  description: { fi?: string; en?: string; sv?: string } | null;
  short_description: { fi?: string; en?: string } | null;
  start_time: string | null;
  end_time: string | null;
  location: {
    position?: { type: string; coordinates: [number, number] };
    name?: { fi?: string; en?: string };
  } | null;
  images: Array<{ url: string }>;
  info_url: { fi?: string; en?: string } | null;
  keywords: Array<{ '@id': string }>;
}

interface ApiResponse {
  data: LinkedEventsEvent[];
  meta: { next: string | null };
}

export async function fetchLinkedEvents(
  source: LinkedEventsSource
): Promise<LinkedEventsEvent[]> {
  const paramObj: Record<string, string> = {
    start: todayIso(),
    end: daysFromNow(60),
    page_size: '100',
  };
  if (source.supportsEventStatus !== false) {
    paramObj.event_status = 'EventScheduled';
  }
  if (source.supportsInclude !== false) {
    paramObj.include = 'location,keywords';
  }
  const params = new URLSearchParams(paramObj);

  const all: LinkedEventsEvent[] = [];
  let url: string | null = `${source.baseUrl}/event/?${params}`;

  while (url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${source.label} API error: ${res.status} — url: ${url} — body: ${body.slice(0, 300)}`);
    }
    const json: ApiResponse = await res.json();
    all.push(...json.data);
    url = json.meta.next;
  }

  return all;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
