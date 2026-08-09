-- Café DOA — initial schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- Reservation requests submitted from the website.
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  party_size smallint not null check (party_size > 0 and party_size <= 20),
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

-- Anyone can submit a reservation request, but only as "pending".
-- No select/update/delete policy is defined for anon/authenticated, so
-- reservation data can only be read and managed from the Supabase
-- dashboard (Table Editor), which connects with elevated privileges.
create policy "Public can submit reservations"
  on public.reservations
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- Public storage bucket for gallery photos. Upload images yourselves via
-- Supabase Studio -> Storage -> gallery. The website reads this bucket
-- automatically and falls back to placeholder tiles while it's empty.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "Public can view gallery images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'gallery');
