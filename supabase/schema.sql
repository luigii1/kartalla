-- Tapahtumat-taulu (alkuperäinen)
create table if not exists public.events (
  id          uuid             default gen_random_uuid() primary key,
  title       text             not null,
  description text,
  lat         double precision not null,
  lng         double precision not null,
  category    text             not null check (category in ('music', 'sports', 'food', 'culture', 'other')),
  date        date             not null,
  created_at  timestamptz      default timezone('utc', now()) not null
);

alter table public.events enable row level security;

create policy "Kaikki voivat lukea tapahtumat"
  on public.events for select using (true);
