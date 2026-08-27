-- Café DOA — Zeiterfassung: mehrere Einträge, Urlaubskonto, Erfassungsort
-- Einmalig im Supabase SQL-Editor ausführen, nach 0007.

-- 1. Mehrere Arbeitszeiten je Tag -----------------------------------------
--
-- Bisher galt ein Eintrag je Tag, geteilte Schichten sollten als eine Spanne
-- mit langer Pause erfasst werden. In der Praxis will man 9-13 und 17-19
-- getrennt sehen: Die Pause dazwischen ist keine Pause, sondern Feierabend.

alter table public.zeit_eintraege
  drop constraint if exists zeit_eintraege_ein_tag;

-- Arbeitszeiten dürfen sich häufen, ein Status nicht: Ein Tag kann nicht
-- gleichzeitig Urlaub und frei sein.
create unique index if not exists zeit_eintraege_ein_status_je_tag
  on public.zeit_eintraege (user_id, datum)
  where typ <> 'arbeit';

-- 2. Wo wurde erfasst? ----------------------------------------------------
--
-- Alle Uhrzeiten sind Café-Zeit (Europe/Berlin) - daran ändert sich nichts,
-- und genau das macht sie eindeutig. Wer aber im Urlaub aus einer anderen
-- Zeitzone nachträgt, verrechnet sich leicht um Stunden.
--
-- Festgehalten wird deshalb die Zeitzone des Geräts und das Land aus der
-- Verbindung - bewusst nicht der genaue Standort. Für die Frage "wurde das
-- aus einer anderen Zeitzone eingetragen?" genügt das, und alles Genauere
-- wäre Überwachung statt Genauigkeit.
alter table public.zeit_eintraege
  add column if not exists erfasst_zeitzone text,
  add column if not exists erfasst_land text;

-- 3. Urlaubskonto ---------------------------------------------------------

alter table public.zeit_mitarbeiter
  add column if not exists urlaubstage_pro_jahr numeric(5, 1) not null default 0
    check (urlaubstage_pro_jahr >= 0);

/**
 * Genommene Urlaubstage je Jahr.
 *
 * Gezählt werden verschiedene Kalendertage, nicht Einträge: Seit ein Tag
 * mehrere Zeilen haben kann, würde ein Zählen der Zeilen doppelt zählen.
 */
create or replace view public.zeit_urlaubskonto
with (security_invoker = true) as
select
  m.user_id,
  m.name,
  jahr.jahr,
  m.urlaubstage_pro_jahr as kontingent,
  coalesce(genommen.tage, 0)::int as genommen,
  m.urlaubstage_pro_jahr - coalesce(genommen.tage, 0) as rest
from public.zeit_mitarbeiter m
cross join lateral (
  select generate_series(
    extract(year from current_date)::int - 1,
    extract(year from current_date)::int + 1
  ) as jahr
) jahr
left join lateral (
  select count(distinct e.datum) as tage
  from public.zeit_eintraege e
  where e.user_id = m.user_id
    and e.typ = 'urlaub'
    and extract(year from e.datum) = jahr.jahr
) genommen on true;

-- 4. Die Ansicht um die neuen Spalten ergänzen ----------------------------
--
-- Angehaengt statt eingeschoben: "create or replace view" erlaubt nur, am
-- Ende Spalten zu ergaenzen.
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
  e.created_at,
  e.erfasst_zeitzone,
  e.erfasst_land
from public.zeit_eintraege e
join public.zeit_mitarbeiter m on m.user_id = e.user_id;
