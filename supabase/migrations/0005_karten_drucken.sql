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

-- Testeinträge für den gemeinsamen Durchlauf.
--
-- Der Cappuccino steht bei 300 Punkten und damit bei 300 € Umsatz - so weit
-- kommt kein Test. Damit sich das Einlösen trotzdem durchspielen lässt, gibt
-- es einen zweiten Eintrag mit einem einzigen Punkt.
--
-- Beide nach dem Test löschen:
--   delete from public.punkte_praemien where name like '%(Test)';
insert into public.punkte_praemien (name, punkte, sortierung)
select v.name, v.punkte, 99
from (values ('Cappuccino (Test)', 300), ('Einlöseprobe (Test)', 1)) as v(name, punkte)
where not exists (
  select 1 from public.punkte_praemien p where p.name = v.name
);
