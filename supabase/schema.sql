-- Tapahtumat-taulu
create table public.events (
  id          uuid             default gen_random_uuid() primary key,
  title       text             not null,
  description text,
  lat         double precision not null,
  lng         double precision not null,
  category    text             not null check (category in ('music', 'sports', 'food', 'culture', 'other')),
  date        date             not null,
  created_at  timestamptz      default timezone('utc', now()) not null
);

-- Row Level Security
alter table public.events enable row level security;

create policy "Kaikki voivat lukea tapahtumat"
  on public.events for select using (true);

create policy "Kaikki voivat lisätä tapahtumia"
  on public.events for insert with check (true);

create policy "Kaikki voivat poistaa tapahtumia"
  on public.events for delete using (true);
