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
  // Alle vorausgewählt. Vorher galt "keine Auswahl heißt alle" - das spart
  // zwar Klicks, aber wer eine leere Liste sieht, rechnet mit einer leeren
  // Datei und traut sich nicht auf den Knopf.
  const [gewaehlt, setGewaehlt] = useState<string[]>(() => team.map((m) => m.user_id));

  const umschalten = (userId: string, an: boolean) =>
    setGewaehlt((alt) => (an ? [...alt, userId] : alt.filter((id) => id !== userId)));

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
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <legend className="text-sm text-ink/70">Mitarbeiter</legend>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink/50">
                {gewaehlt.length} von {team.length}
              </span>
              <button
                type="button"
                onClick={() => setGewaehlt(team.map((m) => m.user_id))}
                className="rounded-full border border-ink/15 px-3 py-1.5"
              >
                Alle
              </button>
              <button
                type="button"
                onClick={() => setGewaehlt([])}
                className="rounded-full border border-ink/15 px-3 py-1.5"
              >
                Keine
              </button>
            </div>
          </div>

          {/* Kästchen statt Chips: Bei drei Dutzend Namen sieht man auf einen
              Blick, was an und was aus ist - bei gefärbten Chips muss man
              erst die Farblogik verstehen. */}
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((mitarbeiter) => {
              const an = gewaehlt.includes(mitarbeiter.user_id);
              return (
                <label
                  key={mitarbeiter.user_id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-cream-soft px-3 py-2.5 text-sm hover:border-ink/25"
                >
                  <input
                    type="checkbox"
                    name="person"
                    value={mitarbeiter.user_id}
                    checked={an}
                    onChange={(event) => umschalten(mitarbeiter.user_id, event.target.checked)}
                    className="size-4 shrink-0 accent-green"
                  />
                  <span className="min-w-0 truncate">
                    {mitarbeiter.name}
                    {!mitarbeiter.aktiv && (
                      <span className="ml-1.5 text-xs text-ink/45">inaktiv</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={gewaehlt.length === 0}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream disabled:opacity-30"
        >
          Excel-Datei erstellen
        </button>
        {gewaehlt.length === 0 && (
          <p className="mt-2 text-sm text-ink/50">Wähl mindestens einen Mitarbeiter aus.</p>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/55">
        Die Datei enthält zwei Blätter: alle Tage einzeln und die Monatssummen
        je Mitarbeiter. Stunden stehen doppelt drin – als Dezimalzahl zum
        Weiterrechnen und als Std:Min zum Lesen.
      </p>
    </form>
  );
}
