-- Café DOA — staff access to reservations
-- Run once in the Supabase SQL editor, after 0001_init.sql.

-- Who may see reservations. Membership is granted deliberately by adding a
-- row here, so merely having a Supabase account is not enough - a stray or
-- self-registered account cannot read guest data.
create table if not exists public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "Staff can see their own membership"
  on public.staff
  for select
  to authenticated
  using (user_id = auth.uid());

-- SECURITY DEFINER so the reservation policies can consult this table
-- without tripping over the staff table's own row level security.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Track who acted on a reservation and when.
alter table public.reservations
  add column if not exists handled_by uuid references auth.users (id),
  add column if not exists handled_at timestamptz;

create policy "Staff can read reservations"
  on public.reservations
  for select
  to authenticated
  using (public.is_staff());

create policy "Staff can update reservations"
  on public.reservations
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Newest requests first is the wrong order for a service team; they work
-- forwards through the day. This index serves that ordering.
create index if not exists reservations_upcoming_idx
  on public.reservations (reservation_date, reservation_time);

-- Push changes to the dashboard live. Realtime still applies the policies
-- above, so only staff receive the events.
alter publication supabase_realtime add table public.reservations;
