"use client";

import { useSyncExternalStore } from "react";

const SCHLUESSEL = "doa-thema";

/**
 * Setzt das Thema, bevor das erste Pixel steht.
 *
 * Als gewöhnliches `<script>` im Markup und nicht in einem Effekt: Ein Effekt
 * läuft erst nach dem ersten Zeichnen, das Bild würde also hell aufblitzen und
 * dann umspringen. Ohne gespeicherte Wahl gilt die Einstellung des Geräts.
 */
export function ThemaSkript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var t=localStorage.getItem(${JSON.stringify(SCHLUESSEL)});if(t!=="hell"&&t!=="dunkel")t=matchMedia("(prefers-color-scheme: dark)").matches?"dunkel":"hell";document.documentElement.dataset.thema=t}catch(e){}`,
      }}
    />
  );
}

// Das Thema steht im DOM, nicht in React - das Skript oben hat es dort schon
// hingeschrieben. Diese winzige Registrierung sorgt nur dafür, dass der
// Schalter davon erfährt.
const horcher = new Set<() => void>();

function abonnieren(melden: () => void) {
  horcher.add(melden);
  return () => {
    horcher.delete(melden);
  };
}

function lesen(): "hell" | "dunkel" {
  return document.documentElement.dataset.thema === "dunkel" ? "dunkel" : "hell";
}

export default function ThemaSchalter() {
  const thema = useSyncExternalStore(abonnieren, lesen, () => "hell" as const);

  function umschalten() {
    const neu = thema === "dunkel" ? "hell" : "dunkel";
    document.documentElement.dataset.thema = neu;
    try {
      localStorage.setItem(SCHLUESSEL, neu);
    } catch {
      // Privater Modus - dann gilt die Wahl eben nur für diesen Besuch.
    }
    for (const melden of horcher) melden();
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-ink hover:bg-ink/5"
      aria-pressed={thema === "dunkel"}
    >
      <span>{thema === "dunkel" ? "Dunkel" : "Hell"}</span>
      <span aria-hidden className="text-base">
        {thema === "dunkel" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
