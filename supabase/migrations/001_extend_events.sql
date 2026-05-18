-- Laajennetaan events-taulua: uudet kentät, auth-pohjainen RLS

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source         text        NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id    text,
  ADD COLUMN IF NOT EXISTS starts_at      timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at        timestamptz,
  ADD COLUMN IF NOT EXISTS location_name  text,
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS url            text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_data       jsonb;

-- Migroi olemassa oleva date → starts_at
UPDATE public.events
  SET starts_at = (date::text || 'T00:00:00+00:00')::timestamptz
  WHERE starts_at IS NULL;

ALTER TABLE public.events
  ALTER COLUMN starts_at SET NOT NULL;

-- Uniikki indeksi duplikaattien estoon (NULL != NULL Postgresissa, joten manual-rivit eivät konfliktoidu)
CREATE UNIQUE INDEX IF NOT EXISTS events_source_external_id_idx
  ON public.events (source, external_id);

CREATE INDEX IF NOT EXISTS events_starts_at_idx
  ON public.events (starts_at);

-- Päivitä RLS: kirjoittaminen vaatii kirjautumisen
DROP POLICY IF EXISTS "Kaikki voivat lisätä tapahtumia" ON public.events;
DROP POLICY IF EXISTS "Kaikki voivat poistaa tapahtumia" ON public.events;

CREATE POLICY "Kirjautuneet voivat lisätä tapahtumia"
  ON public.events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND source = 'manual');

CREATE POLICY "Kirjautuneet voivat poistaa tapahtumia"
  ON public.events FOR DELETE
  USING (auth.role() = 'authenticated' AND source = 'manual');
