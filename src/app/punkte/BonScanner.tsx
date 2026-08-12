"use client";

import { useCallback, useState } from "react";
import QrScanner from "@/components/QrScanner";
import { belegEinreichen } from "@/app/actions/punkte";

type Meldung = { art: "ok" | "fehler"; text: string } | null;

/**
 * Nimmt den QR-Code vom Kassenbon auf.
 *
 * Gelesen wird hier, geprüft nicht: Der Text geht unverändert an den Server,
 * der die Signatur der TSE prüft. Eine Prüfung an dieser Stelle wäre wertlos –
 * der Browser gehört dem Gast, er könnte sie überspringen.
 */
export default function BonScanner() {
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [handeingabe, setHandeingabe] = useState(false);
  const [sendet, setSendet] = useState(false);

  const einreichen = useCallback(async (inhalt: string, manuell: boolean) => {
    setSendet(true);
    const ergebnis = await belegEinreichen(inhalt, manuell);
    setSendet(false);
    setMeldung({ art: ergebnis.status === "ok" ? "ok" : "fehler", text: ergebnis.meldung });
  }, []);

  return (
    <div>
      {sendet ? (
        <div className="rounded-full bg-ink px-7 py-4 text-center text-sm font-semibold text-cream opacity-60">
          Einen Moment…
        </div>
      ) : (
        <QrScanner
          knopfText="Bon scannen"
          onErkannt={(inhalt) => void einreichen(inhalt, false)}
          onFehler={(text) => {
            setMeldung({ art: "fehler", text: `${text} Tipp den Code vom Bon von Hand ein.` });
            setHandeingabe(true);
          }}
        />
      )}

      {meldung && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            meldung.art === "ok" ? "bg-green/10 text-green" : "bg-terracotta/10 text-terracotta"
          }`}
          role="status"
        >
          {meldung.text}
        </p>
      )}

      <div className="mt-6">
        {handeingabe ? (
          <form
            action={async (formData) => {
              const wert = String(formData.get("code") ?? "");
              if (wert.trim()) await einreichen(wert, true);
            }}
          >
            <label htmlFor="code" className="text-sm text-ink/70">
              Der lange Text unter dem QR-Code auf dem Bon
            </label>
            <textarea
              id="code"
              name="code"
              rows={3}
              className="mt-2 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
              placeholder="V0;…"
            />
            <button
              type="submit"
              disabled={sendet}
              className="mt-3 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold disabled:opacity-60"
            >
              Absenden
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setHandeingabe(true)}
            className="text-sm text-ink/60 underline underline-offset-4"
          >
            Kamera geht nicht? Code eintippen
          </button>
        )}
      </div>
    </div>
  );
}
