import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LINKED_EVENTS_SOURCES, fetchLinkedEvents } from '@/lib/sync/linked-events-client';
import { transformLinkedEvent } from '@/lib/sync/event-transformer';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { synced: 0, skipped: 0, errors: 0 };

  for (const source of LINKED_EVENTS_SOURCES) {
    try {
      const raw = await fetchLinkedEvents(source);

      // Debug: log first event to inspect structure
      if (raw.length > 0) {
        const first = raw[0];
        console.log('[sync] first event id:', first.id);
        console.log('[sync] first event start_time:', first.start_time);
        console.log('[sync] first event location:', JSON.stringify(first.location));
        const transformed = transformLinkedEvent(first);
        console.log('[sync] first event transformed:', transformed ? 'OK' : 'NULL');
      }

      const events = raw
        .map(transformLinkedEvent)
        .filter((e): e is NonNullable<typeof e> => e !== null);

      results.skipped += raw.length - events.length;

      for (let i = 0; i < events.length; i += 50) {
        const batch = events.slice(i, i + 50);
        const { error } = await supabaseAdmin
          .from('events')
          .upsert(batch as unknown as Record<string, unknown>[], { onConflict: 'source,external_id' });

        if (error) {
          console.error(`[sync] upsert error (${source.label}):`, error.message);
          results.errors += batch.length;
        } else {
          results.synced += batch.length;
        }
      }
    } catch (err) {
      console.error(`[sync] failed for ${source.label}:`, err);
      results.errors++;
    }
  }

  console.log('[sync] done', results);
  return NextResponse.json({ ok: true, ...results });
}
