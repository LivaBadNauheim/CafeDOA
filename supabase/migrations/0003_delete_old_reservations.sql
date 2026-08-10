-- Café DOA — automatic deletion of old reservations
-- Run once in the Supabase SQL editor, after 0002_staff_access.sql.
--
-- The privacy policy states that reservation data is deleted no later than
-- twelve months after the booking date. This is what makes that true.

create extension if not exists pg_cron;

create or replace function public.delete_old_reservations()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.reservations
  where reservation_date < (current_date - interval '12 months');
$$;

revoke execute on function public.delete_old_reservations() from public, anon, authenticated;

-- Re-running this migration should not fail on an already scheduled job.
select cron.unschedule(jobid)
from cron.job
where jobname = 'delete-old-reservations';

select cron.schedule(
  'delete-old-reservations',
  '30 3 * * *', -- nightly at 03:30 UTC, well outside opening hours
  $$select public.delete_old_reservations();$$
);
