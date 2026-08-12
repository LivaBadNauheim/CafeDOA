"use client";

import { useState, useSyncExternalStore } from "react";

type System = "ios" | "android" | "sonstiges";

/**
 * Läuft die Seite schon als App, ist der Hinweis erledigt.
 * Safari kennt `display-mode` nicht in jeder Fassung, daher die zweite Probe.
 */
function ermittleSystem(): System | null {
  const alsApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
  if (alsApp) return null;

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "sonstiges";
}

/**
 * Der Wert steht erst im Browser fest, nicht beim Ausliefern. Über einen
 * Effekt gelesen würde daraus ein Zustandswechsel direkt nach dem ersten
 * Zeichnen - dagegen gibt es hier bereits einmal eine Lint-Regel.
 */
const NIE_AENDERND = () => () => {};

/**
 * Anleitung zum Speichern als App.
 *
 * Verschwindet, sobald die Seite als App läuft - dann ist der Hinweis
 * erledigt und würde nur Platz wegnehmen.
 *
 * Der Hinweis auf den Code ist keine Nettigkeit, sondern nötig: Auf dem
 * iPhone hat eine gespeicherte Web-App einen eigenen Speicher, getrennt von
 * Safari. Nach dem Speichern ist der Gast dort erst einmal nicht angemeldet,
 * und ohne diese Erklärung denkt er, seine Punkte seien weg.
 */
export default function AlsAppSpeichern({ token }: { token: string }) {
  const system = useSyncExternalStore(NIE_AENDERND, ermittleSystem, () => null);
  const [offen, setOffen] = useState(false);

  if (!system) return null;

  const schritte =
    system === "ios"
      ? [
          "Unten auf das Teilen-Symbol tippen – das Quadrat mit dem Pfeil nach oben",
          "In der Liste „Zum Home-Bildschirm“ wählen",
          "Oben rechts auf „Hinzufügen“",
        ]
      : system === "android"
        ? [
            "Oben rechts auf die drei Punkte tippen",
            "„App installieren“ wählen – oder „Zum Startbildschirm hinzufügen“",
            "Bestätigen",
          ]
        : ["In der Adresszeile auf das Installieren-Symbol klicken", "Bestätigen"];

  return (
    <section className="mt-10 rounded-2xl bg-cream-soft p-5">
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="font-medium">Als App aufs Handy legen</span>
        <span className="shrink-0 text-sm text-ink/50">{offen ? "zu" : "wie?"}</span>
      </button>

      {offen && (
        <div className="mt-4 text-sm leading-relaxed text-ink/75">
          <p>
            Dann liegt DOA mit eigenem Symbol auf dem Home-Bildschirm – ohne
            Adresszeile, ohne Installation aus einem Store.
          </p>
          <ol className="mt-4 space-y-2">
            {schritte.map((schritt, index) => (
              <li key={schritt} className="flex gap-3">
                <span className="shrink-0 font-semibold text-ink/40">{index + 1}.</span>
                <span>{schritt}</span>
              </li>
            ))}
          </ol>

          {system === "ios" && (
            <p className="mt-4 rounded-xl bg-cream px-4 py-3">
              <strong>Danach einmal deinen Code eingeben.</strong> Das iPhone
              behandelt die App als eigenen Bereich, deshalb fängt sie leer an.
              Deine Punkte sind nicht weg – dein Code ist{" "}
              <strong className="font-mono">{token}</strong>. Am besten
              abschreiben, bevor du speicherst.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
