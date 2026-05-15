import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LINKED_EVENTS_SOURCES, fetchLinkedEvents } from '@/lib/sync/linked-events-client';
import { transformLinkedEvent } from '@/lib/sync/event-transformer';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { synced: 0, skipped: 0, errors: 0 };

  for (const source of LINKED_EVENTS_SOURCES) {
    try {
      const raw = await fetchLinkedEvents(source);

      const transformed = raw
        .map(transformLinkedEvent)
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .filter((e) => e.external_id != null);

      results.skipped += raw.length - transformed.length;

      // Deduplicate by source:external_id before upserting
      const seen = new Set<string>();
      const events = transformed.filter((e) => {
        const key = `${e.source}:${e.external_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      for (let i = 0; i < events.length; i += 50) {
        const batch = events.slice(i, i + 50);
        const { error } = await supabaseAdmin
          .from('events')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(batch as any[], { onConflict: 'source,external_id' });

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
