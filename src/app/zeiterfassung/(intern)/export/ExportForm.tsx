"use client";

import { useState } from "react";
import type { Mitarbeiter } from "@/lib/zeit";

/**
 * Der Export läuft als normaler Seitenaufruf, nicht über eine Aktion:
 * Nur so bekommt der Browser eine Datei zum Herunterladen statt einer
 * Antwort, mit der er nichts anfangen kann.
 */
export default function ExportForm({
  team,
  vorschlagVon,
  vorschlagBis,
}: {
  team: Mitarbeiter[];
  vorschlagVon: string;
  vorschlagBis: string;
}) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const alle = gewaehlt.length === 0;

  return (
    <form action="/zeiterfassung/export/datei" method="get" className="mt-6">
      <div className="rounded-2xl border border-ink/10 bg-cream p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-ink/70">Von</span>
            <input
              type="date"
              name="von"
              required
              defaultValue={vorschlagVon}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="text-ink/70">Bis</span>
            <input
              type="date"
              name="bis"
              required
              defaultValue={vorschlagBis}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
            />
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm text-ink/70">
            Mitarbeiter {alle && <span className="text-ink/45">– keiner gewählt heißt: alle</span>}
          </legend>

          <div className="mt-3 flex flex-wrap gap-2">
            {team.map((mitarbeiter) => {
              const an = gewaehlt.includes(mitarbeiter.user_id);
              return (
                <label
                  key={mitarbeiter.user_id}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                    an ? "border-green bg-green text-cream" : "border-ink/15 hover:bg-ink/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="person"
                    value={mitarbeiter.user_id}
                    checked={an}
                    onChange={(event) =>
                      setGewaehlt((alt) =>
                        event.target.checked
                          ? [...alt, mitarbeiter.user_id]
                          : alt.filter((id) => id !== mitarbeiter.user_id),
                      )
                    }
                    className="sr-only"
                  />
                  {mitarbeiter.name}
                  {!mitarbeiter.aktiv && <span className="ml-1.5 opacity-60">(inaktiv)</span>}
                </label>
              );
            })}
          </div>

          {gewaehlt.length > 0 && (
            <button
              type="button"
              onClick={() => setGewaehlt([])}
              className="mt-3 text-sm text-ink/60 underline underline-offset-4"
            >
              Auswahl aufheben
            </button>
          )}
        </fieldset>

        <button
          type="submit"
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream"
        >
          Excel-Datei erstellen
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/55">
        Die Datei enthält zwei Blätter: alle Tage einzeln und die Monatssummen
        je Mitarbeiter. Stunden stehen doppelt drin – als Dezimalzahl zum
        Weiterrechnen und als Std:Min zum Lesen.
      </p>
    </form>
  );
}
