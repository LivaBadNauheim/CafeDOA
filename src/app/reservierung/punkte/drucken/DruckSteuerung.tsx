"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { alsGedrucktMarkieren, kartenAnlegen } from "@/app/actions/punkte";
import { KARTEN_PRO_BOGEN } from "@/lib/karte";

/**
 * Wird beim Drucken ausgeblendet (`print:hidden`), damit nur die Karten
 * auf dem Papier landen.
 */
export default function DruckSteuerung({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [meldung, setMeldung] = useState("");
  const [laeuft, starte] = useTransition();

  const bogen = Math.ceil(ids.length / KARTEN_PRO_BOGEN);

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <form
          action={(formData) => {
            const anzahl = Number(formData.get("anzahl") ?? 0);
            starte(async () => {
              const ergebnis = await kartenAnlegen(anzahl);
              setMeldung(ergebnis.meldung);
              router.refresh();
            });
          }}
          className="flex items-center gap-2"
        >
          <input
            name="anzahl"
            type="number"
            min={1}
            max={200}
            defaultValue={KARTEN_PRO_BOGEN}
            className="w-24 rounded-xl border border-ink/15 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={laeuft}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Karten anlegen
          </button>
        </form>

        <button
          type="button"
          onClick={() => window.print()}
          disabled={ids.length === 0}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream disabled:opacity-30"
        >
          Drucken ({bogen} {bogen === 1 ? "Bogen" : "Bögen"})
        </button>

        <button
          type="button"
          disabled={laeuft || ids.length === 0}
          onClick={() => {
            starte(async () => {
              const ergebnis = await alsGedrucktMarkieren(ids);
              setMeldung(ergebnis.meldung);
              router.refresh();
            });
          }}
          className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-30"
        >
          Als gedruckt abhaken
        </button>
      </div>

      {meldung && <p className="mt-4 text-sm text-ink/70">{meldung}</p>}
    </div>
  );
}
