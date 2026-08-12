-- Café DOA — Punkte ohne Bon vergeben
-- Einmalig im Supabase SQL-Editor ausführen, nach 0005.
--
-- Bisher konnten Punkte nur aus geprüften Bons entstehen. Für Geschenkte
-- gibt es jetzt eine eigene Tabelle: `punkte_belege` ist für signierte Bons
-- reserviert, und ein erfundener Beleg darin würde die Prüfung entwerten,
-- auf der das ganze Programm beruht.
--
-- Dieselbe Tabelle trägt später Willkommenspunkte, Empfehlungen und
-- Bewertungen - alle drei vergeben Punkte ohne Bon, nur mit anderem Grund.

create table if not exists public.punkte_gutschriften (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid not null references public.punkte_konten (id) on delete cascade,
  -- Auch negativ: Wer versehentlich das falsche Konto gutschreibt, muss das
  -- zurücknehmen können, ohne dass jemand in der Datenbank herumräumt.
  punkte integer not null check (punkte <> 0),
  grund text not null,
  -- Wofür die Gutschrift war. Heute nur 'manuell'; die geparkten Features
  -- bekommen eigene Werte, damit sich später auswerten lässt, was zieht.
  art text not null default 'manuell',
  mitarbeiter uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists punkte_gutschriften_konto_idx
  on public.punkte_gutschriften (konto_id, created_at desc);

alter table public.punkte_gutschriften enable row level security;

create policy "Staff can read punkte_gutschriften"
  on public.punkte_gutschriften for select to authenticated using (public.is_staff());

-- Der Punktestand rechnet die Gutschriften mit.
create or replace view public.punkte_stand
with (security_invoker = true) as
select
  k.id,
  k.token,
  k.vorname,
  k.created_at,
  coalesce(b.umsatz_cent, 0)::bigint as umsatz_cent,
  floor(coalesce(b.umsatz_cent, 0) / 100.0)::int + coalesce(g.punkte, 0)::int as punkte_verdient,
  coalesce(e.punkte, 0)::int as punkte_eingeloest,
  floor(coalesce(b.umsatz_cent, 0) / 100.0)::int + coalesce(g.punkte, 0)::int
    - coalesce(e.punkte, 0)::int as punkte_verfuegbar,
  coalesce(g.punkte, 0)::int as punkte_geschenkt,
  b.letzter_bon
from public.punkte_konten k
left join (
  select konto_id, sum(betrag_cent) as umsatz_cent, max(bon_zeit) as letzter_bon
  from public.punkte_belege
  group by konto_id
) b on b.konto_id = k.id
left join (
  select konto_id, sum(punkte) as punkte
  from public.punkte_einloesungen
  group by konto_id
) e on e.konto_id = k.id
left join (
  select konto_id, sum(punkte) as punkte
  from public.punkte_gutschriften
  group by konto_id
) g on g.konto_id = k.id;

/**
 * Punkte gutschreiben oder zurücknehmen.
 *
 * Über eine Funktion und nicht per INSERT, aus zwei Gründen: Die Sperre
 * verhindert, dass zwei gleichzeitige Abzüge den Stand ins Minus ziehen, und
 * die Obergrenze begrenzt den Schaden eines Zahlendrehers - 5000 statt 50
 * getippt wäre sonst ein Gratisfrühstück.
 */
create or replace function public.punkte_gutschreiben(
  p_konto_id uuid,
  p_punkte integer,
  p_grund text,
  p_art text default 'manuell'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verfuegbar integer;
begin
  if not public.is_staff() then
    raise exception 'Kein Zugriff';
  end if;
  if p_punkte is null or p_punkte = 0 then
    raise exception 'Ungueltige Punktzahl';
  end if;
  if abs(p_punkte) > 500 then
    raise exception 'Hoechstens 500 Punkte auf einmal';
  end if;
  if coalesce(btrim(p_grund), '') = '' then
    raise exception 'Grund fehlt';
  end if;

  perform 1 from public.punkte_konten where id = p_konto_id for update;
  if not found then
    raise exception 'Konto nicht gefunden';
  end if;

  insert into public.punkte_gutschriften (konto_id, punkte, grund, art, mitarbeiter)
  values (p_konto_id, p_punkte, btrim(p_grund), p_art, auth.uid());

  select punkte_verfuegbar into v_verfuegbar
    from public.punkte_stand where id = p_konto_id;

  -- Ein Abzug darf nicht unter null gehen. Die Pruefung steht nach dem
  -- Einfuegen, damit sie denselben Stand sieht, der auch gespeichert wurde.
  if v_verfuegbar < 0 then
    raise exception 'Das wuerde den Stand ins Minus ziehen';
  end if;

  return v_verfuegbar;
end;
$$;

revoke execute on function public.punkte_gutschreiben(uuid, integer, text, text) from public;
grant execute on function public.punkte_gutschreiben(uuid, integer, text, text) to authenticated;
