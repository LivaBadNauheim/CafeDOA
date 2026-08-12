"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { karteSelbstAnlegen, karteVerbinden } from "@/app/actions/punkte";

/** Einstieg für alle, die noch keine Karte auf diesem Gerät haben. */
export default function KarteStart() {
  const router = useRouter();
  const [fehler, setFehler] = useState("");
  const [habeSchonEine, setHabeSchonEine] = useState(false);
  const [laeuft, starte] = useTransition();

  return (
    <div className="mt-8">
      {!habeSchonEine ? (
        <>
          <form
            action={(formData) => {
              setFehler("");
              starte(async () => {
                const ergebnis = await karteSelbstAnlegen(String(formData.get("vorname") ?? ""));
                if (ergebnis.status === "ok") router.refresh();
                else setFehler(ergebnis.meldung);
              });
            }}
          >
            <label htmlFor="vorname" className="text-sm text-ink/70">
              Wie heißt du? (freiwillig – hilft uns nur beim Wiederfinden)
            </label>
            <input
              id="vorname"
              name="vorname"
              autoComplete="given-name"
              placeholder="Vorname"
              className="mt-2 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={laeuft}
              className="mt-4 w-full rounded-full bg-ink px-7 py-4 text-sm font-semibold text-cream disabled:opacity-60"
            >
              {laeuft ? "Einen Moment…" : "Karte anlegen"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setHabeSchonEine(true)}
            className="mt-5 text-sm text-ink/60 underline underline-offset-4"
          >
            Ich habe schon eine Karte
          </button>
        </>
      ) : (
        <>
          <form
            action={(formData) => {
              setFehler("");
              starte(async () => {
                const ok = await karteVerbinden(String(formData.get("token") ?? ""));
                if (ok) router.refresh();
                else setFehler("Diesen Code kennen wir nicht. Schau nochmal auf die Karte.");
              });
            }}
          >
            <label htmlFor="token" className="text-sm text-ink/70">
              Code von deiner Karte
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="token"
                name="token"
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="ABCDE-12345"
                className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3 font-mono text-sm uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={laeuft}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream disabled:opacity-60"
              >
                {laeuft ? "…" : "Los"}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setHabeSchonEine(false)}
            className="mt-5 text-sm text-ink/60 underline underline-offset-4"
          >
            Doch neu anlegen
          </button>
        </>
      )}

      {fehler && <p className="mt-4 text-sm text-terracotta">{fehler}</p>}
    </div>
  );
}
