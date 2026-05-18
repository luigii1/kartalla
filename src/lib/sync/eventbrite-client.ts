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
}
