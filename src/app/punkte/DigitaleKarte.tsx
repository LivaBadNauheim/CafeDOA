"use client";

import { useState } from "react";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/logo-path";
import type { QrPfad } from "@/lib/karte";

/**
 * Die Karte auf dem Bildschirm - dasselbe, was sonst auf Papier läge.
 *
 * Sie ist eingeklappt, weil der Punktestand häufiger interessiert als der
 * Code. Aufgeklappt hält der Gast sie am Tresen hin, statt eine Pappkarte
 * zu suchen.
 */
export default function DigitaleKarte({ token, qr }: { token: string; qr: QrPfad }) {
  const [offen, setOffen] = useState(false);

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="w-full rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition-colors hover:bg-ink/5"
      >
        Karte zeigen
      </button>
    );
  }

  return (
    <div>
      <div className="flex overflow-hidden rounded-2xl bg-cream-soft">
        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-2 bg-green px-2 py-6">
          <svg viewBox={LOGO_VIEWBOX} className="h-9 w-9" aria-hidden="true">
            <path d={LOGO_PATH} fill="#f6efe1" fillRule="evenodd" />
          </svg>
          <span className="text-lg font-bold tracking-[0.06em] text-cream">DOA</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6">
          {/* Heller Grund, damit die Kamera am Tresen den Code sicher findet. */}
          <svg viewBox={qr.viewBox} className="h-32 w-32" shapeRendering="crispEdges" aria-hidden="true">
            <path d={qr.d} stroke="#221d16" strokeWidth={1} />
          </svg>
          <p className="font-mono text-sm font-semibold tracking-wider">{token}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink/50">
        Beim Einlösen zeigst du das hier. Bildschirm bitte hell stellen.
      </p>

      <button
        type="button"
        onClick={() => setOffen(false)}
        className="mt-3 w-full text-sm text-ink/60 underline underline-offset-4"
      >
        Karte einklappen
      </button>
    </div>
  );
}
