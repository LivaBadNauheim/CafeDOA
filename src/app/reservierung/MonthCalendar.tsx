"use client";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type DayCounts = Record<string, { total: number; pending: number }>;

export default function MonthCalendar({
  year,
  month,
  today,
  selected,
  counts,
  onSelect,
  onMonthChange,
}: {
  year: number;
  month: number;
  today: string;
  selected: string | null;
  counts: DayCounts;
  onSelect: (date: string | null) => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  // getUTCDay() is Sunday-based; German calendars start on Monday.
  const leading = (firstOfMonth.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(by: number) {
    const date = new Date(Date.UTC(year, month + by, 1));
    onMonthChange(date.getUTCFullYear(), date.getUTCMonth());
  }

  return (
    <div className="rounded-2xl bg-cream p-4 shadow-sm shadow-ink/5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Vorheriger Monat"
          className="rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-cream-soft"
        >
          ‹
        </button>
        <p className="font-display text-base font-semibold text-ink">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Nächster Monat"
          className="rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-cream-soft"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-ink-soft/60">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;

          const iso = toIso(year, month, day);
          const count = counts[iso];
          const isToday = iso === today;
          const isSelected = iso === selected;
          const isPast = iso < today;

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(isSelected ? null : iso)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-ink font-semibold text-cream"
                  : isPast
                    ? "text-ink-soft/25"
                    : isToday
                      ? "bg-cream-deep font-semibold text-ink"
                      : "text-ink hover:bg-cream-soft"
              }`}
              aria-label={
                count
                  ? `${day}. ${MONTHS[month]}, ${count.total} Reservierungen`
                  : `${day}. ${MONTHS[month]}`
              }
            >
              {day}
              {count && (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    count.pending > 0
                      ? "bg-terracotta"
                      : isSelected
                        ? "bg-cream/70"
                        : "bg-green"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink/10 pt-3 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> offene Anfrage
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green" /> alles bearbeitet
        </span>
      </div>
    </div>
  );
}
