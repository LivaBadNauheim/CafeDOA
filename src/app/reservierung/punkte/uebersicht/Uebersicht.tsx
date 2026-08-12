"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { euro, type PunkteStand } from "@/lib/punkte";

type Props = { karten: PunkteStand[]; heute: string };

/** Tagesabstand zweier Kalendertage (YYYY-MM-DD). */
function tageDazwischen(von: string, bis: string): number {
  // Mittag statt Mitternacht: So kippt die Rechnung nicht bei der
  // Zeitumstellung um einen Tag.
  return Math.round(
    (Date.parse(`${bis}T12:00:00Z`) - Date.parse(`${von}T12:00:00Z`)) / 86_400_000,
  );
}

function datumKurz(iso: string | null): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

function kalendertag(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export default function Uebersicht({ karten, heute }: Props) {
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<"punkte" | "neu">("punkte");

  const zahlen = useMemo(() => {
    const alter = karten.map((k) => tageDazwischen(kalendertag(k.created_at), heute));
    return {
      gesamt: karten.length,
      // Wer noch keinen Bon eingereicht hat, hat sich angemeldet und war es
      // dann. Die Zahl trennt Interesse von Nutzung - bei Selbstanlage der
      // wichtigste Unterschied.
      aktiv: karten.filter((k) => k.letzter_bon).length,
      neu7: alter.filter((t) => t <= 7).length,
      neu30: alter.filter((t) => t <= 30).length,
      offen: karten.reduce((summe, k) => summe + k.punkte_verfuegbar, 0),
      gesammelt: karten.reduce((summe, k) => summe + k.punkte_verdient, 0),
      eingeloest: karten.reduce((summe, k) => summe + k.punkte_eingeloest, 0),
      umsatz: karten.reduce((summe, k) => summe + Number(k.umsatz_cent), 0),
    };
  }, [karten, heute]);

  /** Anmeldungen je Woche, jüngste Woche links. */
  const wochen = useMemo(() => {
    const eimer = Array.from({ length: 8 }, () => 0);
    for (const karte of karten) {
      const tage = tageDazwischen(kalendertag(karte.created_at), heute);
      const woche = Math.floor(tage / 7);
      if (woche >= 0 && woche < eimer.length) eimer[woche] += 1;
    }
    return eimer;
  }, [karten, heute]);

  const hoechste = Math.max(1, ...wochen);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    const liste = begriff
      ? karten.filter(
          (k) =>
            k.token.toLowerCase().includes(begriff) ||
            (k.vorname ?? "").toLowerCase().includes(begriff),
        )
      : [...karten];

    return sortierung === "punkte"
      ? liste.sort((a, b) => b.punkte_verfuegbar - a.punkte_verfuegbar)
      : liste;
  }, [karten, suche, sortierung]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Übersicht</h1>
        <Link href="/reservierung/punkte" className="text-sm text-ink/60 underline underline-offset-4">
          Zurück
        </Link>
      </div>

      {karten.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">Noch keine Karten angelegt.</p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              { label: "Karten", wert: zahlen.gesamt },
              { label: "davon genutzt", wert: zahlen.aktiv },
              { label: "neu (7 Tage)", wert: zahlen.neu7 },
              { label: "neu (30 Tage)", wert: zahlen.neu30 },
            ].map((kennzahl) => (
              <div key={kennzahl.label}>
                <dd className="font-display text-3xl font-semibold leading-none">{kennzahl.wert}</dd>
                <dt className="mt-1 text-xs text-ink/55">{kennzahl.label}</dt>
              </div>
            ))}
          </dl>

          <section className="mt-8 rounded-2xl bg-cream-soft p-5">
            <h2 className="text-sm font-semibold">Anmeldungen je Woche</h2>
            <div className="mt-4 flex items-end gap-1.5" style={{ height: "72px" }}>
              {[...wochen].reverse().map((anzahl, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] text-ink/50">{anzahl > 0 ? anzahl : ""}</span>
                  <div
                    className="w-full rounded-t bg-green"
                    style={{ height: `${Math.max(2, (anzahl / hoechste) * 48)}px` }}
                    title={`${anzahl} Anmeldungen`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-ink/45">
              <span>vor 8 Wochen</span>
              <span>diese Woche</span>
            </div>
          </section>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              { label: "offene Punkte", wert: zahlen.offen },
              { label: "gesammelt", wert: zahlen.gesammelt },
              { label: "eingelöst", wert: zahlen.eingeloest },
              { label: "Umsatz auf Karten", wert: euro(zahlen.umsatz) },
            ].map((kennzahl) => (
              <div key={kennzahl.label}>
                <dd className="text-lg font-semibold leading-tight">{kennzahl.wert}</dd>
                <dt className="mt-1 text-xs text-ink/55">{kennzahl.label}</dt>
              </div>
            ))}
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-ink/50">
            <strong>Offene Punkte</strong> sind das, was noch eingelöst werden
            kann – bei einem Punkt je Euro also ungefähr der Betrag in Euro, den
            ihr an Prämien noch vor euch habt.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Code oder Vorname"
              className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setSortierung(sortierung === "punkte" ? "neu" : "punkte")}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold"
            >
              {sortierung === "punkte" ? "nach Punkten" : "neueste zuerst"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left text-xs text-ink/55">
                  <th className="py-2 font-medium">Gast</th>
                  <th className="py-2 text-right font-medium">Punkte</th>
                  <th className="py-2 text-right font-medium">gesammelt</th>
                  <th className="py-2 text-right font-medium">eingelöst</th>
                  <th className="py-2 text-right font-medium">letzter Bon</th>
                  <th className="py-2 text-right font-medium">dabei seit</th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((karte) => (
                  <tr key={karte.id} className="border-b border-ink/5">
                    <td className="py-2.5">
                      <span className="block">{karte.vorname ?? "ohne Namen"}</span>
                      <span className="block font-mono text-[11px] text-ink/45">{karte.token}</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">{karte.punkte_verfuegbar}</td>
                    <td className="py-2.5 text-right text-ink/60">{karte.punkte_verdient}</td>
                    <td className="py-2.5 text-right text-ink/60">{karte.punkte_eingeloest}</td>
                    <td className="py-2.5 text-right text-ink/60">{datumKurz(karte.letzter_bon)}</td>
                    <td className="py-2.5 text-right text-ink/60">{datumKurz(karte.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {gefiltert.length === 0 && (
            <p className="mt-4 text-sm text-ink/60">Kein Treffer.</p>
          )}
        </>
      )}
    </main>
  );
}
