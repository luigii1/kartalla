-- Laajennetaan events-taulua
alter table public.events
  add column if not exists source         text        not null default 'manual',
  add column if not exists external_id    text,
  add column if not exists starts_at      timestamptz,
  add column if not exists ends_at        timestamptz,
  add column if not exists location_name  text,
  add column if not exists image_url      text,
  add column if not exists url            text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists raw_data       jsonb;

update public.events
  set starts_at = (date::text || 'T00:00:00+00:00')::timestamptz
  where starts_at is null;

alter table public.events alter column starts_at set not null;

create unique index if not exists events_source_external_id_idx
  on public.events (source, external_id);

create index if not exists events_starts_at_idx
  on public.events (starts_at);

drop policy if exists "Kaikki voivat lisätä tapahtumia" on public.events;
drop policy if exists "Kaikki voivat poistaa tapahtumia" on public.events;

create policy "Kirjautuneet voivat lisätä tapahtumia"
  on public.events for insert
  with check (auth.role() = 'authenticated' and source = 'manual');

create policy "Kirjautuneet voivat poistaa tapahtumia"
  on public.events for delete
  using (auth.role() = 'authenticated' and source = 'manual');
