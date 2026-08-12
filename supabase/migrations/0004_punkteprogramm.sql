-- Café DOA — Punkteprogramm
-- Einmalig im Supabase SQL-Editor ausführen, nach 0003.
--
-- Gäste reichen ihren Kassenbon selbst ein, die Kasse bleibt unangetastet.
-- Geprüft wird der Bon serverseitig gegen die Signatur der TSE
-- (src/lib/tse-beleg.ts) - erst danach landet er hier.

-- Ein Konto ohne Konto: kein Name, keine E-Mail, kein Passwort. Der Token
-- steht auf der Karte und ist die einzige Kennung. Ein Vorname ist optional
-- und dient nur dazu, jemanden am Tresen wiederzufinden, der seine Karte
-- vergessen hat.
create table if not exists public.punkte_konten (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  vorname text,
  created_at timestamptz not null default now()
);

create table if not exists public.punkte_belege (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid not null references public.punkte_konten (id) on delete cascade,
  -- Kassenkennung und Transaktionsnummer aus dem signierten QR-Code.
  -- Diese Eindeutigkeitsregel ist der eigentliche Schutz gegen mehrfaches
  -- Einreichen: Sie greift auch bei zwei gleichzeitigen Anfragen. Eine
  -- Prüfung im Programmcode davor hätte diese Lücke.
  beleg_schluessel text not null unique,
  -- Nur der punktefähige Anteil (19 % und 7 %), nicht der Gesamtbetrag.
  betrag_cent integer not null check (betrag_cent > 0),
  brutto_cent integer not null,
  bon_zeit timestamptz not null,
  -- Von Hand eingetippt statt gescannt. Am Betrag ändert das nichts, weil
  -- die Signatur in beiden Fällen geprüft wird - aber gehäufte Handeingaben
  -- sind ein Hinweis darauf, dass jemand etwas versucht.
  manuell boolean not null default false,
  erfasst_at timestamptz not null default now()
);

create index if not exists punkte_belege_konto_idx
  on public.punkte_belege (konto_id, bon_zeit desc);

-- Prämien werden hier gepflegt, nicht im Code. Preise und Angebot ändern
-- sich, ein Deployment soll dafür nicht nötig sein.
create table if not exists public.punkte_praemien (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  punkte integer not null check (punkte > 0),
  aktiv boolean not null default true,
  sortierung integer not null default 0
);

create table if not exists public.punkte_einloesungen (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid not null references public.punkte_konten (id) on delete cascade,
  -- Der Name zum Zeitpunkt des Einlösens. Ändert sich der Katalog später,
  -- bleibt nachvollziehbar, was der Gast tatsächlich bekommen hat.
  praemie text not null,
  punkte integer not null check (punkte > 0),
  mitarbeiter uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists punkte_einloesungen_konto_idx
  on public.punkte_einloesungen (konto_id, created_at desc);

-- Der Punktestand wird berechnet, nicht gespeichert.
--
-- Ein mitgeführter Zähler müsste bei jedem Vorgang richtig fortgeschrieben
-- werden und driftet ab, sobald einmal etwas schiefgeht. Aus der Summe
-- abgeleitet stimmt er immer: Ein Bon, der nachträglich entfernt wird,
-- korrigiert den Stand von selbst.
--
-- Nebenbei ergibt sich daraus die Regel "ein Punkt je vollem Euro,
-- Restcent laufen weiter" ohne ein zusätzliches Restguthaben - der Rest
-- steckt in der Summe. Wer den Kurs ändern will, ändert ihn hier.
create or replace view public.punkte_stand
with (security_invoker = true) as
select
  k.id,
  k.token,
  k.vorname,
  k.created_at,
  coalesce(b.umsatz_cent, 0)::bigint as umsatz_cent,
  floor(coalesce(b.umsatz_cent, 0) / 100.0)::int as punkte_verdient,
  coalesce(e.punkte, 0)::int as punkte_eingeloest,
  floor(coalesce(b.umsatz_cent, 0) / 100.0)::int - coalesce(e.punkte, 0)::int as punkte_verfuegbar,
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
) e on e.konto_id = k.id;

-- Rechte -------------------------------------------------------------------
--
-- Für Gäste gibt es bewusst keine Policy. Alles, was ein Gast auslöst, läuft
-- über den Server: Nur dort wird die Signatur des Bons geprüft, und nur dort
-- steht der geheime Schlüssel. Dürfte der Browser selbst schreiben, könnte
-- jeder beliebige Beträge eintragen und die Prüfung wäre wertlos.

alter table public.punkte_konten enable row level security;
alter table public.punkte_belege enable row level security;
alter table public.punkte_praemien enable row level security;
alter table public.punkte_einloesungen enable row level security;

create policy "Staff can read punkte_konten"
  on public.punkte_konten for select to authenticated using (public.is_staff());

create policy "Staff can read punkte_belege"
  on public.punkte_belege for select to authenticated using (public.is_staff());

create policy "Staff can read punkte_praemien"
  on public.punkte_praemien for select to authenticated using (public.is_staff());

create policy "Staff can read punkte_einloesungen"
  on public.punkte_einloesungen for select to authenticated using (public.is_staff());

-- Einlösen läuft über diese Funktion statt über ein direktes INSERT.
--
-- Grund ist die Sperre: Ohne sie könnten zwei Mitarbeiter gleichzeitig
-- denselben Punktestand sehen und ihn gemeinsam überziehen - der Gast bekäme
-- zwei Prämien für die Punkte einer.
create or replace function public.punkte_einloesen(
  p_konto_id uuid,
  p_praemie text,
  p_punkte integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_umsatz bigint;
  v_eingeloest integer;
  v_verfuegbar integer;
begin
  if not public.is_staff() then
    raise exception 'Kein Zugriff';
  end if;
  if p_punkte is null or p_punkte <= 0 then
    raise exception 'Ungueltige Punktzahl';
  end if;

  perform 1 from public.punkte_konten where id = p_konto_id for update;
  if not found then
    raise exception 'Konto nicht gefunden';
  end if;

  select coalesce(sum(betrag_cent), 0) into v_umsatz
    from public.punkte_belege where konto_id = p_konto_id;
  select coalesce(sum(punkte), 0) into v_eingeloest
    from public.punkte_einloesungen where konto_id = p_konto_id;

  v_verfuegbar := floor(v_umsatz / 100.0)::int - v_eingeloest;
  if v_verfuegbar < p_punkte then
    raise exception 'Nicht genug Punkte';
  end if;

  insert into public.punkte_einloesungen (konto_id, praemie, punkte, mitarbeiter)
  values (p_konto_id, p_praemie, p_punkte, auth.uid());

  return v_verfuegbar - p_punkte;
end;
$$;

revoke execute on function public.punkte_einloesen(uuid, text, integer) from public;
grant execute on function public.punkte_einloesen(uuid, text, integer) to authenticated;
