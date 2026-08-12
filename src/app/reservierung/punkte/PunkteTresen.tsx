"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import QrScanner from "@/components/QrScanner";
import {
  karteAusgeben,
  kontoSuchen,
  praemieEinloesen,
  punkteGutschreiben,
} from "@/app/actions/punkte";
import { GUTSCHRIFT_MAX, euro, type Praemie, type PunkteStand } from "@/lib/punkte";

type Meldung = { art: "ok" | "fehler"; text: string } | null;

/**
 * Der Tresen-Teil des Punkteprogramms: Gast nachschlagen, Prämie einlösen.
 *
 * Bewusst eine eigene Seite und nicht in die Reservierungsübersicht
 * hineingebaut - die läuft im Tagesgeschäft und soll sich nicht verändern,
 * nur weil hier etwas dazukommt.
 */
export default function PunkteTresen({ praemien }: { praemien: Praemie[] }) {
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState<PunkteStand[] | null>(null);
  const [gewaehlt, setGewaehlt] = useState<PunkteStand | null>(null);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [neueKarte, setNeueKarte] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function suchenMit(begriff: string) {
    setMeldung(null);
    starte(async () => {
      const gefunden = await kontoSuchen(begriff);
      setTreffer(gefunden);
      setGewaehlt(gefunden.length === 1 ? gefunden[0] : null);
    });
  }

  function suchen(formData: FormData) {
    suchenMit(String(formData.get("suche") ?? ""));
  }

  function einloesen(praemie: Praemie) {
    if (!gewaehlt) return;
    starte(async () => {
      const ergebnis = await praemieEinloesen(gewaehlt.id, praemie.id);
      setMeldung({ art: ergebnis.status === "ok" ? "ok" : "fehler", text: ergebnis.meldung });
      if (ergebnis.status === "ok" && typeof ergebnis.punkte === "number") {
        setGewaehlt({ ...gewaehlt, punkte_verfuegbar: ergebnis.punkte });
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Punkte</h1>
        <div className="flex gap-4 text-sm text-ink/60">
          <Link href="/reservierung/punkte/uebersicht" className="underline underline-offset-4">
            Übersicht
          </Link>
          <Link href="/reservierung/punkte/drucken" className="underline underline-offset-4">
            Karten drucken
          </Link>
          <Link href="/reservierung" className="underline underline-offset-4">
            Reservierungen
          </Link>
        </div>
      </div>

      <form action={suchen} className="mt-6 flex gap-2">
        <input
          name="suche"
          value={suche}
          onChange={(event) => setSuche(event.target.value)}
          placeholder="Kartencode oder Vorname"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={laeuft}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream disabled:opacity-60"
        >
          Suchen
        </button>
      </form>

      {/* Der Gast hält sein Handy hin, statt den Code vorzulesen. */}
      <div className="mt-3">
        <QrScanner
          knopfText="Karte des Gastes scannen"
          onErkannt={(inhalt) => {
            setSuche(inhalt);
            suchenMit(inhalt);
          }}
          onFehler={(text) => setMeldung({ art: "fehler", text })}
        />
      </div>

      {treffer?.length === 0 && (
        <p className="mt-6 text-sm text-ink/60">Kein Konto gefunden.</p>
      )}

      <section className="mt-8 rounded-2xl bg-cream-soft p-5">
        <h2 className="text-sm font-semibold">Neue Karte ausgeben</h2>
        <form
          className="mt-3 flex gap-2"
          action={(formData) => {
            const vorname = String(formData.get("vorname") ?? "");
            setNeueKarte(null);
            starte(async () => {
              const ergebnis = await karteAusgeben(vorname);
              if (ergebnis.status === "ok") setNeueKarte(ergebnis.token);
              else setMeldung({ art: "fehler", text: ergebnis.meldung });
            });
          }}
        >
          <input
            name="vorname"
            placeholder="Vorname (optional)"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={laeuft}
            className="rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            Anlegen
          </button>
        </form>
        {neueKarte && (
          <p className="mt-4 text-sm">
            Code für die Karte:{" "}
            <strong className="font-mono text-base tracking-wider">{neueKarte}</strong>
          </p>
        )}
      </section>

      {treffer && treffer.length > 1 && !gewaehlt && (
        <ul className="mt-6 divide-y divide-ink/10">
          {treffer.map((konto) => (
            <li key={konto.id}>
              <button
                type="button"
                onClick={() => setGewaehlt(konto)}
                className="flex w-full items-baseline justify-between gap-4 py-3 text-left"
              >
                <span>{konto.vorname ?? "ohne Namen"}</span>
                <span className="font-mono text-xs text-ink/50">{konto.token}</span>
                <span className="text-sm">{konto.punkte_verfuegbar} P.</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {gewaehlt && (
        <section className="mt-8 rounded-2xl border border-ink/10 p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="font-medium">{gewaehlt.vorname ?? "Gast ohne Namen"}</p>
              <p className="font-mono text-xs text-ink/50">{gewaehlt.token}</p>
            </div>
            <p className="font-display text-3xl font-semibold">{gewaehlt.punkte_verfuegbar}</p>
          </div>

          <p className="mt-2 text-xs text-ink/50">
            {euro(gewaehlt.umsatz_cent)} Umsatz · {gewaehlt.punkte_eingeloest} Punkte eingelöst
          </p>

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

          {praemien.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">
              Es sind noch keine Prämien angelegt.
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {praemien.map((praemie) => {
                const reicht = gewaehlt.punkte_verfuegbar >= praemie.punkte;
                return (
                  <li key={praemie.id} className="flex items-center justify-between gap-4">
                    <span className={reicht ? "" : "text-ink/40"}>
                      {praemie.name} · {praemie.punkte} P.
                    </span>
                    <button
                      type="button"
                      onClick={() => einloesen(praemie)}
                      disabled={!reicht || laeuft}
                      className="shrink-0 rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold disabled:opacity-30"
                    >
                      Einlösen
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Punkte von Hand vergeben - oder einen Fehler zurücknehmen. */}
          <details className="mt-6 border-t border-ink/10 pt-4">
            <summary className="cursor-pointer text-sm text-ink/60">
              Punkte von Hand vergeben
            </summary>
            <form
              className="mt-3"
              action={(formData) => {
                const punkte = Number(formData.get("punkte") ?? 0);
                const grund = String(formData.get("grund") ?? "");
                starte(async () => {
                  const ergebnis = await punkteGutschreiben(gewaehlt.id, punkte, grund);
                  setMeldung({
                    art: ergebnis.status === "ok" ? "ok" : "fehler",
                    text: ergebnis.meldung,
                  });
                  if (ergebnis.status === "ok" && typeof ergebnis.punkte === "number") {
                    setGewaehlt({ ...gewaehlt, punkte_verfuegbar: ergebnis.punkte });
                  }
                });
              }}
            >
              <div className="flex gap-2">
                <input
                  name="punkte"
                  type="number"
                  min={-GUTSCHRIFT_MAX}
                  max={GUTSCHRIFT_MAX}
                  placeholder="Punkte"
                  className="w-28 rounded-xl border border-ink/15 px-3 py-2.5 text-sm"
                />
                <input
                  name="grund"
                  placeholder="Grund (Pflicht)"
                  maxLength={200}
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 px-3 py-2.5 text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-ink/45">
                Minuszahl zieht ab. Höchstens {GUTSCHRIFT_MAX} auf einmal. Wer
                es eingetragen hat, wird mitgeschrieben.
              </p>
              <button
                type="submit"
                disabled={laeuft}
                className="mt-3 rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold disabled:opacity-60"
              >
                Eintragen
              </button>
            </form>
          </details>

          <button
            type="button"
            onClick={() => {
              setGewaehlt(null);
              setTreffer(null);
              setSuche("");
              setMeldung(null);
            }}
            className="mt-6 text-sm text-ink/60 underline underline-offset-4"
          >
            Nächster Gast
          </button>
        </section>
      )}
    </main>
  );
}
