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

      const transformed = raw
        .map(transformLinkedEvent)
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .filter((e) => e.external_id != null);

      results.skipped += raw.length - transformed.length;

      // Deduplicate by source+external_id to match the unique index
      const seen = new Set<string>();
      const events = transformed.filter((e) => {
        const key = `${e.source}:${e.external_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      results.skipped += transformed.length - events.length;

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
