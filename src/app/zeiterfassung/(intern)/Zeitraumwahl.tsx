"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monatsErster, montagDerWoche, tagPlus, monatName, tagKurz } from "@/lib/zeit";

type Props = { tag: string; ansicht: "woche" | "monat"; heute: string };

/**
 * Vor, zurück, heute - und Woche oder Monat.
 *
 * Der Zeitraum steht in der Adresse, nicht im Zustand der Komponente: So
 * lässt sich eine bestimmte Woche verlinken, und ein Neuladen landet dort,
 * wo man war.
 */
export default function Zeitraumwahl({ tag, ansicht, heute }: Props) {
  const router = useRouter();
  const pfad = usePathname();
  const suche = useSearchParams();

  function gehe(neuerTag: string, neueAnsicht = ansicht) {
    const p = new URLSearchParams(suche.toString());
    p.set("tag", neuerTag);
    p.set("ansicht", neueAnsicht);
    router.push(`${pfad}?${p}`);
  }

  const schritt = ansicht === "woche" ? 7 : 0;
  const zurueck = () =>
    gehe(ansicht === "woche" ? tagPlus(tag, -schritt) : tagPlus(monatsErster(tag), -1));
  const vor = () =>
    gehe(
      ansicht === "woche"
        ? tagPlus(tag, schritt)
        : monatsErster(tagPlus(monatsErster(tag), 32)),
    );

  const beschriftung =
    ansicht === "woche"
      ? `${tagKurz(montagDerWoche(tag))} – ${tagKurz(tagPlus(montagDerWoche(tag), 6))}`
      : monatName(tag);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-full border border-ink/15">
        {(["woche", "monat"] as const).map((art) => (
          <button
            key={art}
            type="button"
            onClick={() => gehe(tag, art)}
            className={`px-4 py-2 text-sm font-medium ${
              ansicht === art ? "bg-green text-cream" : "text-ink hover:bg-ink/5"
            }`}
          >
            {art === "woche" ? "Woche" : "Monat"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={zurueck}
        className="rounded-full border border-ink/15 px-3 py-2 text-sm"
        aria-label="Zurück"
      >
        ←
      </button>
      <span className="min-w-[9rem] text-center text-sm font-medium">{beschriftung}</span>
      <button
        type="button"
        onClick={vor}
        className="rounded-full border border-ink/15 px-3 py-2 text-sm"
        aria-label="Vor"
      >
        →
      </button>

      <button
        type="button"
        onClick={() => gehe(heute)}
        className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium"
      >
        Heute
      </button>
    </div>
  );
}
