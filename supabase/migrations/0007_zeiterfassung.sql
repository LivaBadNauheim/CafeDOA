-- Café DOA — Zeiterfassung
-- Einmalig im Supabase SQL-Editor ausführen, nach 0006.
--
-- Eigene Tabellen und eine eigene Rollenzuordnung, getrennt von `staff`:
-- Wer Reservierungen bearbeitet, muss nicht Zeiten erfassen, und wer Zeiten
-- erfasst, hat nichts in den Gästedaten zu suchen. Dieselbe Person kann in
-- beiden stehen - aber sie muss es nicht.

create table if not exists public.zeit_mitarbeiter (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  rolle text not null default 'mitarbeiter' check (rolle in ('mitarbeiter', 'admin')),
  -- Vertragsstunden je Monat. 0 heisst: keine Obergrenze.
  stunden_pro_monat numeric(6, 2) not null default 0 check (stunden_pro_monat >= 0),
  aktiv boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.zeit_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  typ text not null default 'arbeit' check (typ in ('arbeit', 'urlaub', 'krank', 'frei')),
  beginn time,
  ende time,
  pause_minuten integer not null default 0 check (pause_minuten >= 0),
  notiz text,
  created_at timestamptz not null default now(),
  -- Wer zuletzt geändert hat. Bei einer Korrektur durch die Leitung soll
  -- nachvollziehbar bleiben, dass nicht der Mitarbeiter selbst es war.
  geaendert_von uuid references auth.users (id),
  geaendert_at timestamptz,

  -- Ein Eintrag je Person und Tag. Die Wochenansicht zeigt genau eine Zeile
  -- pro Tag; mehrere Eintraege waeren dort nicht darstellbar. Geteilte
  -- Schichten werden als eine Spanne mit langer Pause erfasst -
  -- 9 bis 19 Uhr mit 240 Minuten Pause statt zweier Zeilen.
  constraint zeit_eintraege_ein_tag unique (user_id, datum),

  -- Zeiten gehoeren zur Arbeit. Urlaub, Krankheit und freie Tage haben
  -- keine, und ohne diese Regel stuenden dort Reste alter Eingaben.
  constraint zeit_eintraege_zeiten_nur_bei_arbeit check (
    (typ = 'arbeit' and beginn is not null and ende is not null and ende > beginn
      and pause_minuten < extract(epoch from (ende - beginn)) / 60)
    or (typ <> 'arbeit' and beginn is null and ende is null and pause_minuten = 0)
  )
);

create index if not exists zeit_eintraege_person_idx
  on public.zeit_eintraege (user_id, datum desc);

/** Gearbeitete Minuten je Eintrag - abzüglich Pause, null bei Nicht-Arbeit. */
create or replace view public.zeit_uebersicht
with (security_invoker = true) as
select
  e.id,
  e.user_id,
  m.name,
  e.datum,
  e.typ,
  e.beginn,
  e.ende,
  e.pause_minuten,
  e.notiz,
  case
    when e.typ = 'arbeit'
      then (extract(epoch from (e.ende - e.beginn)) / 60)::int - e.pause_minuten
    else 0
  end as minuten,
  e.geaendert_von,
  e.geaendert_at,
  e.created_at
from public.zeit_eintraege e
join public.zeit_mitarbeiter m on m.user_id = e.user_id;

-- Rechte -------------------------------------------------------------------

create or replace function public.zeit_rolle()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rolle from public.zeit_mitarbeiter
  where user_id = auth.uid() and aktiv;
$$;

revoke execute on function public.zeit_rolle() from public;
grant execute on function public.zeit_rolle() to authenticated;

alter table public.zeit_mitarbeiter enable row level security;
alter table public.zeit_eintraege enable row level security;

-- Jeder sieht sich selbst, die Leitung sieht alle.
create policy "Eigenes Profil oder Admin"
  on public.zeit_mitarbeiter for select to authenticated
  using (user_id = auth.uid() or public.zeit_rolle() = 'admin');

create policy "Admin pflegt Mitarbeiter"
  on public.zeit_mitarbeiter for all to authenticated
  using (public.zeit_rolle() = 'admin')
  with check (public.zeit_rolle() = 'admin');

-- Der Kern der Anforderung: Niemand sieht die Zeiten der anderen.
create policy "Eigene Zeiten lesen"
  on public.zeit_eintraege for select to authenticated
  using (user_id = auth.uid() or public.zeit_rolle() = 'admin');

create policy "Eigene Zeiten erfassen"
  on public.zeit_eintraege for insert to authenticated
  with check (
    (user_id = auth.uid() and public.zeit_rolle() is not null)
    or public.zeit_rolle() = 'admin'
  );

create policy "Eigene Zeiten aendern"
  on public.zeit_eintraege for update to authenticated
  using (user_id = auth.uid() or public.zeit_rolle() = 'admin')
  with check (user_id = auth.uid() or public.zeit_rolle() = 'admin');

create policy "Eigene Zeiten loeschen"
  on public.zeit_eintraege for delete to authenticated
  using (user_id = auth.uid() or public.zeit_rolle() = 'admin');

/**
 * Monatsgrenze.
 *
 * Als Trigger und nicht im Programmcode: Eine Prüfung in der Anwendung
 * liesse sich umgehen, indem jemand direkt gegen die Datenbank schreibt.
 *
 * Die Leitung ist ausgenommen. Das ist kein Schlupfloch, sondern nötig:
 * Wer tatsächlich länger gearbeitet hat, muss das erfasst bekommen -
 * Arbeitszeit, die niemand aufschreiben darf, ist das groessere Problem.
 * Der Mitarbeiter wird gestoppt, die Leitung traegt es ein.
 */
create or replace function public.zeit_monatsgrenze()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grenze numeric;
  v_minuten integer;
  v_neu integer;
begin
  if new.typ <> 'arbeit' or public.zeit_rolle() = 'admin' then
    return new;
  end if;

  select stunden_pro_monat into v_grenze
    from public.zeit_mitarbeiter where user_id = new.user_id;

  if v_grenze is null or v_grenze <= 0 then
    return new;
  end if;

  select coalesce(sum((extract(epoch from (ende - beginn)) / 60)::int - pause_minuten), 0)
    into v_minuten
    from public.zeit_eintraege
   where user_id = new.user_id
     and typ = 'arbeit'
     and date_trunc('month', datum) = date_trunc('month', new.datum)
     and id <> new.id;

  v_neu := (extract(epoch from (new.ende - new.beginn)) / 60)::int - new.pause_minuten;

  if v_minuten + v_neu > v_grenze * 60 then
    raise exception 'Monatsgrenze ueberschritten: % von % Stunden',
      round((v_minuten + v_neu) / 60.0, 2), v_grenze
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists zeit_monatsgrenze_pruefen on public.zeit_eintraege;
create trigger zeit_monatsgrenze_pruefen
  before insert or update on public.zeit_eintraege
  for each row execute function public.zeit_monatsgrenze();
