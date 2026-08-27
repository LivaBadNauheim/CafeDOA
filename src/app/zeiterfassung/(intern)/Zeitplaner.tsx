"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { eintraegeSpeichern } from "@/app/actions/zeit";
import {
  CAFE_TIME_ZONE,
  TYPEN,
  geraeteZeitzone,
  minutenAus,
  monatstage,
  montagDerWoche,
  stunden,
  tagKurz,
  tagPlus,
  uhrzeit,
  wochentage,
  wochentagName,
  type Eintragstyp,
  type ZeitEintrag,
} from "@/lib/zeit";
import Kalender, { type Tagesbild } from "./Kalender";

type Zeile = {
  /** Nur im Browser, damit React die Zeile beim Tippen nicht verliert. */
  schluessel: string;
  /** Kennung in der Datenbank; fehlt bei einer neuen Zeile. */
  id?: string;
  datum: string;
  typ: Eintragstyp;
  beginn: string;
  ende: string;
  pause: string;
  notiz: string;
  geloescht: boolean;
};

type Props = {
  userId: string;
  /** Der ganze geladene Monat, „YYYY-MM". */
  monat: string;
  /** Alle Einträge des Monatsfensters - inklusive der Randtage der ersten und letzten Woche. */
  eintraege: ZeitEintrag[];
  heute: string;
  /** Woche, die beim Laden offen sein soll - kommt beim Monatswechsel aus der Adresse. */
  startTag?: string;
  /** Ohne Schreibrechte wird nur angezeigt. */
  schreibbar?: boolean;
};

function ausEintraegen(eintraege: ZeitEintrag[]): Zeile[] {
  return eintraege.map((e) => ({
    schluessel: e.id,
    id: e.id,
    datum: e.datum,
    typ: e.typ,
    beginn: uhrzeit(e.beginn),
    ende: uhrzeit(e.ende),
    pause: String(e.pause_minuten),
    notiz: e.notiz ?? "",
    geloescht: false,
  }));
}

function leereZeile(datum: string, schluessel: string): Zeile {
  return { schluessel, datum, typ: "arbeit", beginn: "", ende: "", pause: "0", notiz: "", geloescht: false };
}

/** Eine angefangene, aber nie ausgefüllte Zeile ist keine Änderung. */
function ungenutzt(zeile: Zeile): boolean {
  return (
    !zeile.id &&
    !zeile.geloescht &&
    zeile.typ === "arbeit" &&
    !zeile.beginn &&
    !zeile.ende &&
    !zeile.notiz.trim()
  );
}

function veraendert(zeile: Zeile, vorher: Map<string, ZeitEintrag>): boolean {
  if (zeile.geloescht) return Boolean(zeile.id);
  const alt = zeile.id ? vorher.get(zeile.id) : undefined;
  if (!alt) return !ungenutzt(zeile);
  return (
    zeile.typ !== alt.typ ||
    zeile.beginn !== uhrzeit(alt.beginn) ||
    zeile.ende !== uhrzeit(alt.ende) ||
    Number(zeile.pause || 0) !== alt.pause_minuten ||
    zeile.notiz.trim() !== (alt.notiz ?? "")
  );
}

function minutenDerZeile(zeile: Zeile): number {
  return zeile.typ === "arbeit" && zeile.beginn && zeile.ende
    ? minutenAus(zeile.beginn, zeile.ende, Number(zeile.pause || 0))
    : 0;
}

export default function Zeitplaner({
  userId,
  monat,
  eintraege,
  heute,
  startTag,
  schreibbar = true,
}: Props) {
  const router = useRouter();
  const pfad = usePathname();
  const [laeuft, starte] = useTransition();

  const [zeilen, setZeilen] = useState<Zeile[]>(() => ausEintraegen(eintraege));
  const [geladen, setGeladen] = useState(eintraege);
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);
  const [ansicht, setAnsicht] = useState<"woche" | "monat">("woche");
  const [ankerTag, setAnkerTag] = useState(
    () => startTag ?? (heute.startsWith(monat) ? heute : `${monat}-01`),
  );
  const zaehler = useRef(0);

  // Nach dem Speichern lädt die Seite neu. Der Entwurf muss dann weichen -
  // sonst stünde die alte Eingabe über den frisch gespeicherten Werten.
  // Der Vergleich läuft während des Renderns, nicht in einem Effekt: So ist
  // gar nicht erst ein Bild mit veralteten Zeilen zu sehen.
  if (geladen !== eintraege) {
    setGeladen(eintraege);
    setZeilen(ausEintraegen(eintraege));
  }

  const vorher = useMemo(() => new Map(eintraege.map((e) => [e.id, e])), [eintraege]);

  const jeTag = useMemo(() => {
    const karte = new Map<string, Zeile[]>();
    for (const zeile of zeilen) {
      if (zeile.geloescht) continue;
      const liste = karte.get(zeile.datum);
      if (liste) liste.push(zeile);
      else karte.set(zeile.datum, [zeile]);
    }
    for (const liste of karte.values()) liste.sort((a, b) => a.beginn.localeCompare(b.beginn));
    return karte;
  }, [zeilen]);

  const kalenderbild = useMemo(() => {
    const karte = new Map<string, Tagesbild>();
    for (const [datum, liste] of jeTag) {
      const echte = liste.filter((z) => !ungenutzt(z));
      if (echte.length === 0) continue;
      karte.set(datum, {
        minuten: echte.reduce((summe, z) => summe + minutenDerZeile(z), 0),
        typen: echte.map((z) => z.typ),
      });
    }
    return karte;
  }, [jeTag]);

  const woche = wochentage(montagDerWoche(ankerTag));
  const sichtbar = ansicht === "woche" ? woche : monatstage(`${monat}-01`);

  const offen = zeilen.filter((zeile) => veraendert(zeile, vorher));

  // Café-Zeit gilt immer. Wer aus einer anderen Zeitzone nachträgt, soll das
  // wissen, bevor er sich um Stunden verrechnet.
  const zeitzone = useSyncExternalStore(
    () => () => {},
    () => geraeteZeitzone(),
    () => "",
  );
  const fremdeZeitzone = Boolean(zeitzone) && zeitzone !== CAFE_TIME_ZONE;

  function anzeigen(datum: string): Zeile[] {
    const liste = jeTag.get(datum);
    if (liste && liste.length > 0) return liste;
    return [leereZeile(datum, `leer:${datum}`)];
  }

  function setzen(zeile: Zeile, teil: Partial<Zeile>) {
    setMeldung(null);
    setZeilen((alt) =>
      alt.some((z) => z.schluessel === zeile.schluessel)
        ? alt.map((z) => (z.schluessel === zeile.schluessel ? { ...z, ...teil } : z))
        : [...alt, { ...zeile, ...teil }],
    );
  }

  function hinzufuegen(datum: string) {
    zaehler.current += 1;
    setMeldung(null);
    setZeilen((alt) => [...alt, leereZeile(datum, `neu:${datum}:${zaehler.current}`)]);
  }

  function entfernen(zeile: Zeile) {
    setMeldung(null);
    setZeilen((alt) =>
      zeile.id
        ? alt.map((z) => (z.schluessel === zeile.schluessel ? { ...z, geloescht: true } : z))
        : alt.filter((z) => z.schluessel !== zeile.schluessel),
    );
  }

  function speichern() {
    if (offen.length === 0) return;
    starte(async () => {
      const antwort = await eintraegeSpeichern(
        userId,
        offen.map((zeile) => ({
          id: zeile.id,
          datum: zeile.datum,
          typ: zeile.typ,
          beginn: zeile.beginn,
          ende: zeile.ende,
          pauseMinuten: Number(zeile.pause || 0),
          notiz: zeile.notiz,
          loeschen: zeile.geloescht,
        })),
        zeitzone,
      );
      if (antwort.ok) {
        setMeldung({ art: "ok", text: antwort.hinweis ?? "Gespeichert." });
        router.refresh();
      } else {
        setMeldung({ art: "fehler", text: antwort.fehler });
      }
    });
  }

  function zuMonat(neuerMonat: string) {
    router.push(`${pfad}?monat=${neuerMonat}`);
  }

  /**
   * Innerhalb des geladenen Monats kostet der Sprung nichts.
   *
   * Führt er darüber hinaus, wird nachgeladen - und der Tag wandert mit in
   * die Adresse. Ohne ihn landete ein Klick auf „eine Woche zurück" am Ersten
   * des Vormonats statt in der Woche davor, also fünf Wochen daneben.
   */
  function zuTag(tag: string) {
    if (tag.startsWith(monat)) setAnkerTag(tag);
    else router.push(`${pfad}?monat=${tag.slice(0, 7)}&tag=${tag}`);
  }

  const summe = sichtbar.reduce(
    (gesamt, tag) =>
      gesamt + (jeTag.get(tag) ?? []).reduce((teil, zeile) => teil + minutenDerZeile(zeile), 0),
    0,
  );

  return (
    <div className="pb-24">
      {fremdeZeitzone && (
        <p className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-soft">
          Dein Gerät steht auf <span className="font-medium">{zeitzone}</span>. Trag die Zeiten
          trotzdem so ein, wie sie im Café auf der Uhr standen – gerechnet wird immer in
          deutscher Zeit.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start">
        <Kalender
          monat={monat}
          heute={heute}
          gewaehlteWoche={ansicht === "woche" ? woche : []}
          jeTag={kalenderbild}
          aufTag={zuTag}
          aufMonat={zuMonat}
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {(["woche", "monat"] as const).map((art) => (
                <button
                  key={art}
                  type="button"
                  onClick={() => setAnsicht(art)}
                  className={`px-4 py-2 text-sm font-medium ${
                    ansicht === art ? "bg-green text-auf-green" : "text-ink hover:bg-ink/5"
                  }`}
                >
                  {art === "woche" ? "Woche" : "Monat"}
                </button>
              ))}
            </div>

            {ansicht === "woche" && (
              <>
                <button
                  type="button"
                  onClick={() => zuTag(tagPlus(ankerTag, -7))}
                  className="rounded-full border border-ink/15 px-3 py-2 text-sm"
                  aria-label="Woche zurück"
                >
                  ←
                </button>
                <span className="min-w-[9rem] text-center text-sm font-medium">
                  {tagKurz(woche[0])} – {tagKurz(woche[6])}
                </span>
                <button
                  type="button"
                  onClick={() => zuTag(tagPlus(ankerTag, 7))}
                  className="rounded-full border border-ink/15 px-3 py-2 text-sm"
                  aria-label="Woche vor"
                >
                  →
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => zuTag(heute)}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium"
            >
              Heute
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
            {sichtbar.map((tag) => {
              const liste = anzeigen(tag);
              const istHeute = tag === heute;
              const tagesminuten = liste.reduce((summe, z) => summe + minutenDerZeile(z), 0);

              return (
                <div
                  key={tag}
                  className={`border-b border-ink/8 px-4 py-3 last:border-b-0 ${
                    istHeute ? "bg-cream-deep/40" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{wochentagName(tag)}</span>
                    <span className="text-sm text-ink/55">{tagKurz(tag)}</span>
                    {istHeute && (
                      <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[11px] font-medium text-terracotta">
                        heute
                      </span>
                    )}
                    {tagesminuten > 0 && (
                      <span className="ml-auto font-mono text-sm font-semibold">
                        {stunden(tagesminuten)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {liste.map((zeile) => (
                      <Zeilenfeld
                        key={zeile.schluessel}
                        zeile={zeile}
                        schreibbar={schreibbar}
                        mehrere={liste.length > 1}
                        setzen={setzen}
                        entfernen={entfernen}
                      />
                    ))}
                  </div>

                  {/* Nur bei Arbeit: Urlaub, Krankheit und frei gibt es je Tag
                      genau einmal - dafür braucht es keine zweite Zeile. Und
                      nicht an leeren Tagen: Dort steht schon eine leere Zeile,
                      ein Knopf für eine zweite wäre nur Betrieb. */}
                  {schreibbar &&
                    liste.every((z) => z.typ === "arbeit") &&
                    !liste.every(ungenutzt) && (
                      <button
                        type="button"
                        onClick={() => hinzufuegen(tag)}
                        className="mt-2 rounded-full border border-dashed border-ink/25 px-3 py-1.5 text-xs font-medium text-ink/60 hover:border-ink/40 hover:text-ink"
                      >
                        + weitere Zeit an diesem Tag
                      </button>
                    )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-right text-sm text-ink/70">
            Summe {ansicht === "woche" ? "dieser Woche" : "im Monat"}:{" "}
            <span className="font-mono text-base font-semibold text-ink">{stunden(summe)}</span>{" "}
            Std.
          </p>
        </div>
      </div>

      {/* Ein Balken für alles statt ein Knopf je Zeile: Wer eine ganze Woche
          nachträgt, soll einmal speichern und nicht siebenmal. */}
      {schreibbar && (offen.length > 0 || meldung) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
            {meldung && (
              <p
                className={`min-w-0 flex-1 text-sm whitespace-pre-line ${
                  meldung.art === "ok" ? "text-green-light" : "text-terracotta"
                }`}
              >
                {meldung.text}
              </p>
            )}
            {offen.length > 0 && (
              <>
                {!meldung && (
                  <p className="min-w-0 flex-1 text-sm text-ink/60">
                    {offen.length === 1 ? "1 Änderung" : `${offen.length} Änderungen`} noch nicht
                    gespeichert
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMeldung(null);
                    setZeilen(ausEintraegen(eintraege));
                  }}
                  disabled={laeuft}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm disabled:opacity-60"
                >
                  Verwerfen
                </button>
                <button
                  type="button"
                  onClick={speichern}
                  disabled={laeuft}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream disabled:opacity-60"
                >
                  {laeuft ? "Speichert…" : "Alles speichern"}
                </button>
              </>
            )}
            {offen.length === 0 && meldung && (
              <button
                type="button"
                onClick={() => setMeldung(null)}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm"
              >
                Schließen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Zeilenfeld({
  zeile,
  schreibbar,
  mehrere,
  setzen,
  entfernen,
}: {
  zeile: Zeile;
  schreibbar: boolean;
  mehrere: boolean;
  setzen: (zeile: Zeile, teil: Partial<Zeile>) => void;
  entfernen: (zeile: Zeile) => void;
}) {
  const arbeit = zeile.typ === "arbeit";
  const beschreibung = `${tagKurz(zeile.datum)}${mehrere ? `, ${zeile.beginn || "neue Zeile"}` : ""}`;

  return (
    // Bei mehreren Zeiten am Tag ein Strich davor: Auf dem Handy bricht eine
    // Zeile um, und ohne den Strich sähe die zweite Hälfte wie eine eigene
    // Zeit aus.
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-2 ${
        mehrere ? "border-l-2 border-ink/12 pl-2" : ""
      }`}
    >
      <select
        value={zeile.typ}
        disabled={!schreibbar}
        onChange={(ev) => setzen(zeile, { typ: ev.target.value as Eintragstyp })}
        className="rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm disabled:opacity-60"
        aria-label={`Art, ${beschreibung}`}
      >
        {TYPEN.map((typ) => (
          <option key={typ.wert} value={typ.wert}>
            {typ.label}
          </option>
        ))}
      </select>

      {arbeit ? (
        <>
          <input
            type="time"
            value={zeile.beginn}
            disabled={!schreibbar}
            onChange={(ev) => setzen(zeile, { beginn: ev.target.value })}
            className="w-[7.5rem] rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
            aria-label={`Beginn, ${beschreibung}`}
          />
          <input
            type="time"
            value={zeile.ende}
            disabled={!schreibbar}
            onChange={(ev) => setzen(zeile, { ende: ev.target.value })}
            className="w-[7.5rem] rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
            aria-label={`Ende, ${beschreibung}`}
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              step={5}
              value={zeile.pause}
              disabled={!schreibbar}
              onChange={(ev) => setzen(zeile, { pause: ev.target.value })}
              className="w-16 rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
              aria-label={`Pause in Minuten, ${beschreibung}`}
            />
            <span className="text-xs text-ink/50">Min. Pause</span>
          </div>
          <span className="w-14 text-right font-mono text-sm">
            {zeile.beginn && zeile.ende ? stunden(minutenDerZeile(zeile)) : ""}
          </span>
        </>
      ) : (
        <span className="text-sm text-ink/45">ganzer Tag</span>
      )}

      <input
        value={zeile.notiz}
        disabled={!schreibbar}
        onChange={(ev) => setzen(zeile, { notiz: ev.target.value })}
        placeholder="Notiz"
        className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-cream-soft px-3 py-2 text-sm"
        aria-label={`Notiz, ${beschreibung}`}
      />

      {schreibbar && (zeile.id || mehrere) && (
        <button
          type="button"
          onClick={() => entfernen(zeile)}
          className="rounded-full border border-ink/15 px-3 py-2 text-sm text-ink/55 hover:border-terracotta/40 hover:text-terracotta"
          aria-label={`Zeile löschen, ${beschreibung}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
