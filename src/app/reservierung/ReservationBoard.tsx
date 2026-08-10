"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReservationStatus, signOut, type ReservationStatus } from "@/app/actions/staff";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Logo from "@/components/Logo";
import { CheckIcon, CloseIcon, PhoneIcon } from "@/components/icons";
import MonthCalendar, { type DayCounts } from "./MonthCalendar";

export type Reservation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  message: string | null;
  status: ReservationStatus;
  created_at: string;
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  declined: "Abgelehnt",
  cancelled: "Storniert",
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: "bg-terracotta/15 text-terracotta",
  confirmed: "bg-green/15 text-green",
  declined: "bg-ink/10 text-ink-soft",
  cancelled: "bg-ink/10 text-ink-soft",
};

const WEEKDAYS_LONG = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function formatDateLong(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return formatDate(iso);
  return `${WEEKDAYS_LONG[date.getUTCDay()]}, ${formatDate(iso)}`;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function sortReservations(list: Reservation[]): Reservation[] {
  return [...list].sort((a, b) => {
    const byDate = a.reservation_date.localeCompare(b.reservation_date);
    if (byDate !== 0) return byDate;
    return a.reservation_time.localeCompare(b.reservation_time);
  });
}

function ReservationCard({
  reservation,
  busy,
  onStatus,
  showDate,
}: {
  reservation: Reservation;
  busy: boolean;
  onStatus: (id: string, status: ReservationStatus) => void;
  showDate: boolean;
}) {
  const r = reservation;

  return (
    <li className="rounded-2xl bg-cream p-4 shadow-sm shadow-ink/5 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            {showDate && <>{formatDateLong(r.reservation_date)} · </>}
            {formatTime(r.reservation_time)} Uhr
          </p>
          <p className="mt-0.5 text-ink">
            {r.name} · {r.party_size} {r.party_size === 1 ? "Person" : "Personen"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
        <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 hover:text-terracotta">
          <PhoneIcon className="h-4 w-4" />
          {r.phone}
        </a>
        <a href={`mailto:${r.email}`} className="hover:text-terracotta">
          {r.email}
        </a>
      </div>

      {r.message && (
        <p className="mt-3 rounded-xl bg-cream-soft px-4 py-2.5 text-sm text-ink-soft">{r.message}</p>
      )}

      {r.status === "pending" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(r.id, "confirmed")}
            className="flex items-center gap-1.5 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-green-light disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" /> Bestätigen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(r.id, "declined")}
            className="flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-60"
          >
            <CloseIcon className="h-4 w-4" /> Ablehnen
          </button>
        </div>
      )}

      {r.status === "confirmed" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onStatus(r.id, "cancelled")}
          className="mt-4 text-sm text-ink-soft underline hover:text-terracotta disabled:opacity-60"
        >
          Stornieren
        </button>
      )}
    </li>
  );
}

export default function ReservationBoard({
  initialReservations,
  today,
  nowTime,
  userEmail,
  loadError,
}: {
  initialReservations: Reservation[];
  today: string;
  nowTime: string;
  userEmail: string;
  loadError: boolean;
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [serverSnapshot, setServerSnapshot] = useState(initialReservations);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [month, setMonth] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [live, setLive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Server data wins whenever the page re-renders (e.g. after an action).
  // Adjusting during render rather than in an effect avoids a second render
  // pass showing the stale list first.
  if (serverSnapshot !== initialReservations) {
    setServerSnapshot(initialReservations);
    setReservations(initialReservations);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // The realtime socket carries its own credentials. Subscribing before
      // the session is read connects it as the anonymous role, which row
      // level security denies - the channel then reports SUBSCRIBED but no
      // event ever arrives.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel("reservations-board")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reservations" },
          (payload) => {
            setReservations((current) => {
              if (payload.eventType === "DELETE") {
                return current.filter((r) => r.id !== (payload.old as Reservation).id);
              }
              const row = payload.new as Reservation;
              // A booking for a past day would otherwise slip back onto the
              // board through a realtime event.
              if (row.reservation_date < today) {
                return current.filter((r) => r.id !== row.id);
              }
              const without = current.filter((r) => r.id !== row.id);
              return sortReservations([...without, row]);
            });
          },
        )
        .subscribe((status) => {
          if (!cancelled) setLive(status === "SUBSCRIBED");
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [today]);

  // A missed reservation is worse than a redundant fetch, so the board also
  // re-reads on a timer and whenever the tab is brought back to the front.
  // Realtime carries the live feel; this guarantees nothing is lost if the
  // socket drops (flaky café wifi, a tablet asleep for hours).
  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = setInterval(revalidate, 60_000);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [router]);

  /** Today's bookings drop off the board once their time has passed. */
  const upcoming = useMemo(
    () =>
      sortReservations(reservations).filter(
        (r) =>
          r.reservation_date > today ||
          (r.reservation_date === today && formatTime(r.reservation_time) >= nowTime),
      ),
    [reservations, today, nowTime],
  );

  const openRequests = useMemo(
    () => upcoming.filter((r) => r.status === "pending"),
    [upcoming],
  );

  const dayCounts = useMemo(() => {
    const counts: DayCounts = {};
    for (const r of upcoming) {
      const entry = counts[r.reservation_date] ?? { total: 0, pending: 0 };
      entry.total += 1;
      if (r.status === "pending") entry.pending += 1;
      counts[r.reservation_date] = entry;
    }
    return counts;
  }, [upcoming]);

  const listed = useMemo(
    () => (selectedDate ? upcoming.filter((r) => r.reservation_date === selectedDate) : upcoming),
    [upcoming, selectedDate],
  );

  function updateStatus(id: string, status: ReservationStatus) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await setReservationStatus(id, status);
      if (result?.error) {
        setActionError(result.error);
      } else {
        // Optimistic: the realtime event confirms it moments later.
        setReservations((current) => current.map((r) => (r.id === id ? { ...r, status } : r)));
      }
      setPendingId(null);
    });
  }

  return (
    <div className="min-h-dvh bg-cream-soft">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3 text-ink">
            <Logo />
            <span className="text-sm text-ink-soft">Reservierungen</span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="flex items-center gap-1.5 text-xs text-ink-soft"
              title={live ? "Neue Reservierungen erscheinen automatisch" : "Keine Live-Verbindung"}
            >
              <span
                className={`h-2 w-2 rounded-full ${live ? "bg-green" : "bg-ink/25"}`}
                aria-hidden="true"
              />
              {live ? "Live" : "Nicht live"}
            </span>
            <span className="hidden text-xs text-ink-soft sm:inline">{userEmail}</span>
            <form action={signOut}>
              <button type="submit" className="text-sm text-ink-soft underline hover:text-ink">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6 sm:py-8">
        {loadError && (
          <p className="mb-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            Die Reservierungen konnten nicht geladen werden. Bitte lade die Seite neu.
          </p>
        )}
        {actionError && (
          <p className="mb-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            {actionError}
          </p>
        )}

        <section aria-labelledby="offene-anfragen">
          <div className="flex items-center gap-3">
            <h2 id="offene-anfragen" className="font-display text-xl font-semibold text-ink">
              Offene Anfragen
            </h2>
            {openRequests.length > 0 && (
              <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-xs font-semibold text-cream">
                {openRequests.length}
              </span>
            )}
          </div>

          {openRequests.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-cream px-5 py-6 text-sm text-ink-soft">
              Nichts zu tun – alle Anfragen sind bearbeitet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {openRequests.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  busy={pendingId === r.id}
                  onStatus={updateStatus}
                  showDate
                />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
          <MonthCalendar
            year={month.year}
            month={month.month}
            today={today}
            selected={selectedDate}
            counts={dayCounts}
            onSelect={setSelectedDate}
            onMonthChange={(year, m) => setMonth({ year, month: m })}
          />

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">
                {selectedDate ? formatDateLong(selectedDate) : "Alle kommenden"}
              </h2>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-sm text-ink-soft underline hover:text-ink"
                >
                  Alle kommenden anzeigen
                </button>
              )}
            </div>

            {listed.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-cream px-5 py-6 text-sm text-ink-soft">
                {selectedDate
                  ? "An diesem Tag ist noch nichts reserviert."
                  : "Es stehen keine Reservierungen an."}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {listed.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    busy={pendingId === r.id}
                    onStatus={updateStatus}
                    showDate={!selectedDate}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
