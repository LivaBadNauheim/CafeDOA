-- Café DOA — Kundenkarten drucken
-- Einmalig im Supabase SQL-Editor ausführen, nach 0004.

-- Damit der Druckbogen weiß, welche Karten schon auf Papier sind. Ohne das
-- druckt man beim zweiten Mal denselben Stapel noch einmal und gibt Karten
-- doppelt aus.
alter table public.punkte_konten
  add column if not exists gedruckt_at timestamptz;

create index if not exists punkte_konten_ungedruckt_idx
  on public.punkte_konten (created_at)
  where gedruckt_at is null;

-- Testeintrag für den gemeinsamen Durchlauf. Nach dem Test löschen:
--   delete from public.punkte_praemien where name = 'Cappuccino (Test)';
insert into public.punkte_praemien (name, punkte, sortierung)
select 'Cappuccino (Test)', 300, 99
where not exists (
  select 1 from public.punkte_praemien where name = 'Cappuccino (Test)'
);
