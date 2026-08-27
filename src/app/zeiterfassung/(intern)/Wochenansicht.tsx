"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { eintragLoeschen, eintragSpeichern } from "@/app/actions/zeit";
import {
  TYPEN,
  minutenAus,
  monatName,
  stunden,
  tagKurz,
  uhrzeit,
  wochentagName,
  type Eintragstyp,
  type ZeitEintrag,
} from "@/lib/zeit";

type Entwurf = {
  typ: Eintragstyp;
  beginn: string;
  ende: string;
  pause: string;
  notiz: string;
};

type Props = {
  userId: string;
  tage: string[];
  eintraege: ZeitEintrag[];
  heute: string;
  /** Ohne Schreibrechte wird nur angezeigt - etwa bei fremden Zeiten ohne Leitungsrolle. */
  schreibbar?: boolean;
};

function ausEintrag(eintrag: ZeitEintrag | undefined): Entwurf {
  return {
    typ: eintrag?.typ ?? "frei",
    beginn: uhrzeit(eintrag?.beginn ?? null),
    ende: uhrzeit(eintrag?.ende ?? null),
    pause: String(eintrag?.pause_minuten ?? 0),
    notiz: eintrag?.notiz ?? "",
  };
}

function gleich(a: Entwurf, b: Entwurf): boolean {
  return (
    a.typ === b.typ &&
    a.beginn === b.beginn &&
    a.ende === b.ende &&
    Number(a.pause || 0) === Number(b.pause || 0) &&
    a.notiz.trim() === b.notiz.trim()
  );
}

export default function Wochenansicht({
  userId,
  tage,
  eintraege,
  heute,
  schreibbar = true,
}: Props) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [entwuerfe, setEntwuerfe] = useState<Record<string, Entwurf>>({});

  const jeTag = useMemo(() => {
    const karte = new Map<string, ZeitEintrag>();
    for (const eintrag of eintraege) karte.set(eintrag.datum, eintrag);
    return karte;
  }, [eintraege]);

  // Der Entwurf gewinnt, solange die Zeile bearbeitet wird - sonst würde ein
  // Neuladen im Hintergrund die halbe Eingabe überschreiben.
  const wert = (tag: string) => entwuerfe[tag] ?? ausEintrag(jeTag.get(tag));

  function setzen(tag: string, teil: Partial<Entwurf>) {
    setEntwuerfe((alt) => ({ ...alt, [tag]: { ...wert(tag), ...teil } }));
    setFehler((alt) => ({ ...alt, [tag]: "" }));
  }

  function speichern(tag: string) {
    const e = wert(tag);
    starte(async () => {
      const antwort = await eintragSpeichern(
        userId,
        tag,
        e.typ,
        e.beginn,
        e.ende,
        Number(e.pause || 0),
        e.notiz,
      );
      if (antwort.ok) {
        setEntwuerfe((alt) => {
          const neu = { ...alt };
          delete neu[tag];
          return neu;
        });
        router.refresh();
      } else {
        setFehler((alt) => ({ ...alt, [tag]: antwort.fehler }));
      }
    });
  }

  function loeschen(tag: string) {
    const vorhanden = jeTag.get(tag);
    if (!vorhanden) return;
    starte(async () => {
      const antwort = await eintragLoeschen(vorhanden.id);
      if (antwort.ok) {
        setEntwuerfe((alt) => {
          const neu = { ...alt };
          delete neu[tag];
          return neu;
        });
        router.refresh();
      } else {
        setFehler((alt) => ({ ...alt, [tag]: antwort.fehler }));
      }
    });
  }

  const summe = tage.reduce((gesamt, tag) => gesamt + (jeTag.get(tag)?.minuten ?? 0), 0);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream">
        {tage.map((tag) => {
          const e = wert(tag);
          const gespeichert = jeTag.get(tag);
          const geaendert = !gleich(e, ausEintrag(gespeichert));
          const arbeit = e.typ === "arbeit";
          const minuten =
            arbeit && e.beginn && e.ende
              ? minutenAus(e.beginn, e.ende, Number(e.pause || 0))
              : 0;
          const istHeute = tag === heute;

          return (
            <div
              key={tag}
              className={`border-b border-ink/8 px-4 py-3 last:border-b-0 ${
                istHeute ? "bg-cream-deep/40" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="w-full sm:w-40">
                  <span className="font-medium">{wochentagName(tag)}</span>
                  <span className="ml-2 text-sm text-ink/55">{tagKurz(tag)}</span>
                  {istHeute && (
                    <span className="ml-2 rounded-full bg-terracotta/15 px-2 py-0.5 text-[11px] font-medium text-terracotta">
                      heute
                    </span>
                  )}
                </div>

                <select
                  value={e.typ}
                  disabled={!schreibbar}
                  onChange={(ev) => setzen(tag, { typ: ev.target.value as Eintragstyp })}
                  className="rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm disabled:opacity-60"
                  aria-label={`Art des Tages, ${tagKurz(tag)}`}
                >
                  {TYPEN.map((typ) => (
                    <option key={typ.wert} value={typ.wert}>
                      {typ.label}
                    </option>
                  ))}
                </select>

                {arbeit ? (
                  <>
                    <input
                      type="time"
                      value={e.beginn}
                      disabled={!schreibbar}
                      onChange={(ev) => setzen(tag, { beginn: ev.target.value })}
                      className="w-[6.5rem] rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
                      aria-label={`Beginn, ${tagKurz(tag)}`}
                    />
                    <input
                      type="time"
                      value={e.ende}
                      disabled={!schreibbar}
                      onChange={(ev) => setzen(tag, { ende: ev.target.value })}
                      className="w-[6.5rem] rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
                      aria-label={`Ende, ${tagKurz(tag)}`}
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={e.pause}
                        disabled={!schreibbar}
                        onChange={(ev) => setzen(tag, { pause: ev.target.value })}
                        className="w-16 rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
                        aria-label={`Pause in Minuten, ${tagKurz(tag)}`}
                      />
                      <span className="text-xs text-ink/50">Min. Pause</span>
                    </div>
                    <span className="w-16 text-right font-mono text-sm font-semibold">
                      {stunden(minuten)}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-sm text-ink/45">keine Zeiten nötig</span>
                )}

                <input
                  value={e.notiz}
                  disabled={!schreibbar}
                  onChange={(ev) => setzen(tag, { notiz: ev.target.value })}
                  placeholder="Notiz"
                  className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-cream-soft px-3 py-2 text-sm"
                  aria-label={`Notiz, ${tagKurz(tag)}`}
                />

                {/* Der Knopf erscheint erst, wenn sich etwas geändert hat.
                    Im Vorbild stand in jeder Zeile einer, auch in den leeren -
                    das sieht nach Arbeit aus, die gar nicht ansteht. */}
                {schreibbar && geaendert && (
                  <button
                    type="button"
                    onClick={() => speichern(tag)}
                    disabled={laeuft}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60"
                  >
                    Speichern
                  </button>
                )}
                {schreibbar && !geaendert && gespeichert && (
                  <button
                    type="button"
                    onClick={() => loeschen(tag)}
                    disabled={laeuft}
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/60 disabled:opacity-60"
                  >
                    Löschen
                  </button>
                )}
              </div>

              {fehler[tag] && (
                <p className="mt-2 rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                  {fehler[tag]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-right text-sm text-ink/70">
        Summe im Zeitraum:{" "}
        <span className="font-mono text-base font-semibold text-ink">{stunden(summe)}</span> Std.
      </p>
    </div>
  );
}

export function MonatsKopf({
  tagImMonat,
  minuten,
  urlaub,
  krank,
  frei,
  grenzeStunden,
}: {
  tagImMonat: string;
  minuten: number;
  urlaub: number;
  krank: number;
  frei: number;
  grenzeStunden: number;
}) {
  const grenzeMinuten = grenzeStunden * 60;
  const anteil = grenzeMinuten > 0 ? Math.min(1, minuten / grenzeMinuten) : 0;
  const knapp = grenzeMinuten > 0 && anteil >= 0.9;

  return (
    <section className="rounded-2xl border border-ink/10 bg-cream p-5">
      <p className="text-sm text-ink/55">{monatName(tagImMonat)}</p>
      <p className="mt-1 font-display text-4xl font-semibold leading-none">
        {stunden(minuten)}
        <span className="ml-2 text-lg font-normal text-ink/50">Std.</span>
      </p>

      {grenzeStunden > 0 && (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full ${knapp ? "bg-terracotta" : "bg-green"}`}
              style={{ width: `${anteil * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            von {stunden(grenzeMinuten)} Std. im Vertrag
            {knapp && <span className="ml-2 font-medium text-terracotta">wird knapp</span>}
          </p>
        </>
      )}

      <p className="mt-4 text-sm text-ink/60">
        Urlaub {urlaub} · Krank {krank} · Frei {frei}
      </p>
    </section>
  );
}
