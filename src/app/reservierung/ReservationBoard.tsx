"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { setReservationStatus, signOut, type ReservationStatus } from "@/app/actions/staff";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Logo from "@/components/Logo";
import { CheckIcon, CloseIcon, PhoneIcon } from "@/components/icons";

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

type Filter = "open" | "today" | "upcoming" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Offen" },
  { key: "today", label: "Heute" },
  { key: "upcoming", label: "Kommend" },
  { key: "all", label: "Alle" },
];

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  declined: "Abgelehnt",
  cancelled: "Storniert",
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: "bg-gold/20 text-ink",
  confirmed: "bg-green/15 text-green",
  declined: "bg-terracotta/15 text-terracotta",
  cancelled: "bg-ink/10 text-ink-soft",
};

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
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

export default function ReservationBoard({
  initialReservations,
  today,
  userEmail,
  loadError,
}: {
  initialReservations: Reservation[];
  today: string;
  userEmail: string;
  loadError: boolean;
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [serverSnapshot, setServerSnapshot] = useState(initialReservations);
  const [filter, setFilter] = useState<Filter>("open");
  const [live, setLive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

    const channel = supabase
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
            const without = current.filter((r) => r.id !== row.id);
            return sortReservations([...without, row]);
          });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(() => {
    const sorted = sortReservations(reservations);
    switch (filter) {
      case "open":
        return sorted.filter((r) => r.status === "pending" && r.reservation_date >= today);
      case "today":
        return sorted.filter((r) => r.reservation_date === today);
      case "upcoming":
        return sorted.filter((r) => r.reservation_date >= today);
      default:
        return sorted;
    }
  }, [reservations, filter, today]);

  const openCount = useMemo(
    () => reservations.filter((r) => r.status === "pending" && r.reservation_date >= today).length,
    [reservations, today],
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
        setReservations((current) =>
          current.map((r) => (r.id === id ? { ...r, status } : r)),
        );
      }
      setPendingId(null);
    });
  }

  return (
    <div className="min-h-dvh bg-cream-soft">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
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
            <form action={signOut}>
              <button type="submit" className="text-sm text-ink-soft underline hover:text-ink">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f.key ? "bg-ink text-cream" : "bg-cream text-ink-soft hover:bg-cream-deep"
                }`}
              >
                {f.label}
                {f.key === "open" && openCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-terracotta px-1.5 text-xs text-cream">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-ink-soft">{userEmail}</span>
        </div>

        {loadError && (
          <p className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            Die Reservierungen konnten nicht geladen werden. Bitte lade die Seite neu.
          </p>
        )}
        {actionError && (
          <p className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            {actionError}
          </p>
        )}

        {visible.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-cream px-5 py-10 text-center text-sm text-ink-soft">
            Keine Reservierungen in dieser Ansicht.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {visible.map((r) => (
              <li key={r.id} className="rounded-2xl bg-cream p-5 shadow-sm shadow-ink/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {formatDate(r.reservation_date)} · {formatTime(r.reservation_time)} Uhr
                    </p>
                    <p className="mt-0.5 text-ink">
                      {r.name} · {r.party_size} {r.party_size === 1 ? "Person" : "Personen"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
                  <a
                    href={`tel:${r.phone}`}
                    className="flex items-center gap-1.5 hover:text-terracotta"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {r.phone}
                  </a>
                  <a href={`mailto:${r.email}`} className="hover:text-terracotta">
                    {r.email}
                  </a>
                </div>

                {r.message && (
                  <p className="mt-3 rounded-xl bg-cream-soft px-4 py-2.5 text-sm text-ink-soft">
                    {r.message}
                  </p>
                )}

                {r.status === "pending" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingId === r.id}
                      onClick={() => updateStatus(r.id, "confirmed")}
                      className="flex items-center gap-1.5 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-green-light disabled:opacity-60"
                    >
                      <CheckIcon className="h-4 w-4" /> Bestätigen
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === r.id}
                      onClick={() => updateStatus(r.id, "declined")}
                      className="flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-60"
                    >
                      <CloseIcon className="h-4 w-4" /> Ablehnen
                    </button>
                  </div>
                )}

                {r.status === "confirmed" && (
                  <button
                    type="button"
                    disabled={pendingId === r.id}
                    onClick={() => updateStatus(r.id, "cancelled")}
                    className="mt-4 text-sm text-ink-soft underline hover:text-terracotta disabled:opacity-60"
                  >
                    Stornieren
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
