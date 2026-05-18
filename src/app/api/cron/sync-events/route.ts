import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LINKED_EVENTS_SOURCES, fetchLinkedEvents } from '@/lib/sync/linked-events-client';
import { fetchEventbriteEvents } from '@/lib/sync/eventbrite-client';
import { transformLinkedEvent, transformEventbriteEvent } from '@/lib/sync/event-transformer';
import type { SyncInsert } from '@/lib/sync/event-transformer';

async function upsertBatch(
  label: string,
  events: SyncInsert[],
  results: { synced: number; skipped: number; errors: number }
) {
  const seen = new Set<string>();
  const deduped = events.filter((e) => {
    const key = `${e.source}:${e.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (let i = 0; i < deduped.length; i += 50) {
    const batch = deduped.slice(i, i + 50);
    const { error } = await supabaseAdmin
      .from('events')
      .upsert(batch as unknown[], { onConflict: 'source,external_id' });

    if (error) {
      console.error(`[sync] upsert error (${label}):`, error.message);
      results.errors += batch.length;
    } else {
      results.synced += batch.length;
    }
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { synced: 0, skipped: 0, errors: 0 };

  // --- Linked Events ---
  for (const source of LINKED_EVENTS_SOURCES) {
    try {
      const raw = await fetchLinkedEvents(source);
      const transformed = raw
        .map(transformLinkedEvent)
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .filter((e) => e.external_id != null);
      results.skipped += raw.length - transformed.length;
      await upsertBatch(source.label, transformed, results);
    } catch (err) {
      console.error(`[sync] failed for ${source.label}:`, err);
      results.errors++;
    }
  }

  // --- Eventbrite ---
  try {
    const raw = await fetchEventbriteEvents();
    const transformed = raw
      .map(transformEventbriteEvent)
      .filter((e): e is NonNullable<typeof e> => e !== null);
    results.skipped += raw.length - transformed.length;
    await upsertBatch('Eventbrite', transformed, results);
  } catch (err) {
    console.error('[sync] failed for Eventbrite:', err);
    results.errors++;
  }

  // Poistetaan menneet tapahtumat
  const { error: cleanupError, count } = await supabaseAdmin
    .from('events')
    .delete({ count: 'exact' })
    .lt('starts_at', new Date().toISOString());

  if (cleanupError) {
    console.error('[sync] cleanup error:', cleanupError.message);
  } else {
    console.log('[sync] deleted past events:', count);
  }

  console.log('[sync] done', results);
  return NextResponse.json({ ok: true, ...results, deleted: count ?? 0 });
}
