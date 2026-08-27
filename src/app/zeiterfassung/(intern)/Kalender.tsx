"use client";

import {
  kalenderraster,
  monatName,
  monatPlus,
  stunden,
  tagKurz,
  wochentagName,
  type Eintragstyp,
} from "@/lib/zeit";

export type Tagesbild = { minuten: number; typen: Eintragstyp[] };

const PUNKT: Record<Eintragstyp, string> = {
  arbeit: "bg-green",
  urlaub: "bg-gold",
  krank: "bg-terracotta",
  frei: "bg-ink/25",
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

type Props = {
  monat: string;
  heute: string;
  gewaehlteWoche: string[];
  jeTag: Map<string, Tagesbild>;
  aufTag: (tag: string) => void;
  aufMonat: (monat: string) => void;
};

/**
 * Der Monat auf einen Blick, zum Springen.
 *
 * Blättern innerhalb des geladenen Monats kostet keinen Serverbesuch - der
 * Monat liegt vollständig vor. Nur der Sprung in einen anderen Monat lädt
 * nach, und das sagt der Aufrufer über `aufMonat`.
 */
export default function Kalender({
  monat,
  heute,
  gewaehlteWoche,
  jeTag,
  aufTag,
  aufMonat,
}: Props) {
  const tage = kalenderraster(`${monat}-01`);
  const inWoche = new Set(gewaehlteWoche);

  return (
    <section className="rounded-2xl border border-ink/10 bg-cream p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => aufMonat(monatPlus(monat, -1))}
          className="rounded-full border border-ink/15 px-3 py-1.5 text-sm"
          aria-label="Vorheriger Monat"
        >
          ←
        </button>
        <p className="font-display text-base font-semibold">{monatName(`${monat}-01`)}</p>
        <button
          type="button"
          onClick={() => aufMonat(monatPlus(monat, 1))}
          className="rounded-full border border-ink/15 px-3 py-1.5 text-sm"
          aria-label="Nächster Monat"
        >
          →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink/45">
        {WOCHENTAGE.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {tage.map((tag) => {
          const bild = jeTag.get(tag);
          const fremderMonat = !tag.startsWith(monat);
          const gewaehlt = inWoche.has(tag);
          const typen = [...new Set(bild?.typen ?? [])];

          return (
            <button
              key={tag}
              type="button"
              onClick={() => aufTag(tag)}
              aria-current={tag === heute ? "date" : undefined}
              aria-label={`${wochentagName(tag)}, ${tagKurz(tag)}`}
              className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                gewaehlt ? "bg-green/12 ring-1 ring-green/35" : "hover:bg-ink/5"
              } ${fremderMonat ? "text-ink/30" : "text-ink"}`}
            >
              <span
                className={
                  tag === heute
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-terracotta font-semibold text-auf-green"
                    : "font-medium"
                }
              >
                {Number(tag.slice(8))}
              </span>
              {typen.length > 0 ? (
                <span className="mt-1 flex gap-0.5">
                  {typen.map((typ) => (
                    <span key={typ} className={`h-1.5 w-1.5 rounded-full ${PUNKT[typ]}`} />
                  ))}
                </span>
              ) : (
                <span className="mt-1 h-1.5" />
              )}
              <span className="font-mono text-[10px] leading-none text-ink/45">
                {bild && bild.minuten > 0 ? stunden(bild.minuten) : " "}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
