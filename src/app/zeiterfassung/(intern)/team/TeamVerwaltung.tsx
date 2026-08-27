"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  mitarbeiterAendern,
  mitarbeiterAnlegen,
  passwortSetzen,
} from "@/app/actions/zeit";
import { LOGIN_DOMAIN, stunden, type Mitarbeiter } from "@/lib/zeit";

type Meldung = { art: "ok" | "fehler"; text: string } | null;

/** 25 statt 25,0 - halbe Tage bleiben aber halbe. */
function tage(wert: number): string {
  return Number.isInteger(wert) ? String(wert) : wert.toFixed(1).replace(".", ",");
}

/** vorname.nachname aus einem Namen - ohne Umlaute und Sonderzeichen. */
function loginVorschlag(name: string): string {
  const klein = name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return klein.length ? `${klein.join(".")}@${LOGIN_DOMAIN}` : "";
}

export default function TeamVerwaltung({ team, ichSelbst }: { team: Mitarbeiter[]; ichSelbst: string }) {
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [loginSelbst, setLoginSelbst] = useState(false);
  const [passwortFuer, setPasswortFuer] = useState<string | null>(null);

  function melden(antwort: { ok: boolean; hinweis?: string; fehler?: string }, erfolg: string) {
    setMeldung(
      antwort.ok
        ? { art: "ok", text: antwort.hinweis ?? erfolg }
        : { art: "fehler", text: antwort.fehler ?? "Hat nicht geklappt." },
    );
    if (antwort.ok) router.refresh();
  }

  return (
    <div>
      <section className="rounded-2xl border border-ink/10 bg-cream p-5">
        <h2 className="font-display text-lg font-semibold">Neu anlegen</h2>
        <p className="mt-1 text-sm text-ink/60">
          Der Anmeldename wird aus dem Namen vorgeschlagen. Es sind keine echten
          Postfächer – niemand bekommt Post an diese Adresse.
        </p>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={(formData) => {
            starte(async () => {
              const antwort = await mitarbeiterAnlegen(
                String(formData.get("name") ?? ""),
                String(formData.get("login") ?? ""),
                String(formData.get("passwort") ?? ""),
                formData.get("rolle") === "admin" ? "admin" : "mitarbeiter",
                Number(formData.get("stunden") ?? 0),
                Number(formData.get("urlaub") ?? 0),
              );
              melden(antwort, "Angelegt.");
              if (antwort.ok) {
                setName("");
                setLogin("");
                setLoginSelbst(false);
              }
            });
          }}
        >
          <label className="text-sm">
            <span className="text-ink/70">Name</span>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!loginSelbst) setLogin(loginVorschlag(e.target.value));
              }}
              placeholder="Vorname Nachname"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
            />
          </label>

          <label className="text-sm">
            <span className="text-ink/70">Anmeldename</span>
            <input
              name="login"
              required
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                setLoginSelbst(true);
              }}
              autoCapitalize="none"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5 font-mono text-xs"
            />
          </label>

          <label className="text-sm">
            <span className="text-ink/70">Startpasswort</span>
            <input
              name="passwort"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
              placeholder="mindestens 8 Zeichen"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-ink/70">Std./Monat</span>
              <input
                name="stunden"
                type="number"
                min={0}
                step="0.5"
                defaultValue={0}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              <span className="text-ink/70">Urlaub/Jahr</span>
              <input
                name="urlaub"
                type="number"
                min={0}
                step="0.5"
                defaultValue={0}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              <span className="text-ink/70">Rolle</span>
              <select
                name="rolle"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream-soft px-3 py-2.5"
              >
                <option value="mitarbeiter">Mitarbeiter</option>
                <option value="admin">Leitung</option>
              </select>
            </label>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={laeuft}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream disabled:opacity-60"
            >
              Anlegen
            </button>
            <p className="mt-2 text-xs text-ink/50">
              0 Stunden heißt: keine Obergrenze. Urlaubstage gelten je Kalenderjahr.
            </p>
          </div>
        </form>
      </section>

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

      <h2 className="mt-10 font-display text-lg font-semibold">Alle Mitarbeiter</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
        {/* Kopfzeile fuer die beiden Zahlenfelder. Sie sehen gleich aus, und
            welches die Stunden und welches die Urlaubstage sind, musste man
            bisher raten. Auf schmalen Anzeigen brechen die Zeilen um, dort
            steht die Beschriftung stattdessen direkt am Feld. */}
        <div className="hidden items-center gap-x-3 border-b border-ink/10 bg-cream-soft/60 px-4 py-2 text-[11px] font-medium text-ink/50 sm:flex">
          <span className="flex-1">Mitarbeiter</span>
          <span className="w-20 text-center">Std./Monat</span>
          <span className="w-20 text-center">Urlaub/Jahr</span>
          <span className="w-28" aria-hidden />
          <span className="w-32" aria-hidden />
        </div>

        {team.map((mitarbeiter) => (
          <div
            key={mitarbeiter.user_id}
            className={`border-b border-ink/8 px-4 py-3 last:border-b-0 ${
              mitarbeiter.aktiv ? "" : "bg-ink/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                <p className="font-medium">
                  {mitarbeiter.name}
                  {mitarbeiter.rolle === "admin" && (
                    <span className="ml-2 rounded-full bg-green/12 px-2 py-0.5 text-[11px] font-medium text-green">
                      Leitung
                    </span>
                  )}
                  {!mitarbeiter.aktiv && (
                    <span className="ml-2 text-xs text-ink/45">inaktiv</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink/45">
                  {mitarbeiter.stunden_pro_monat > 0
                    ? `${stunden(mitarbeiter.stunden_pro_monat * 60)} Std. im Monat`
                    : "ohne Obergrenze"}
                  {" · "}
                  {mitarbeiter.urlaubstage_pro_jahr > 0
                    ? `${tage(mitarbeiter.urlaubstage_pro_jahr)} Urlaubstage`
                    : "kein Urlaubskontingent"}
                </p>
              </div>

              <label className="flex w-20 flex-col gap-0.5">
                <span className="text-[10px] font-medium text-ink/50 sm:hidden">
                  Std./Monat
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={mitarbeiter.stunden_pro_monat}
                  onBlur={(e) => {
                    const wert = Number(e.target.value);
                    if (wert === mitarbeiter.stunden_pro_monat) return;
                    starte(async () =>
                      melden(
                        await mitarbeiterAendern(mitarbeiter.user_id, { stunden_pro_monat: wert }),
                        "Gespeichert.",
                      ),
                    );
                  }}
                  className="w-full rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
                  aria-label={`Stunden pro Monat von ${mitarbeiter.name}`}
                />
              </label>

              <label className="flex w-20 flex-col gap-0.5">
                <span className="text-[10px] font-medium text-ink/50 sm:hidden">
                  Urlaub/Jahr
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={mitarbeiter.urlaubstage_pro_jahr}
                  onBlur={(e) => {
                    const wert = Number(e.target.value);
                    if (wert === mitarbeiter.urlaubstage_pro_jahr) return;
                    starte(async () =>
                      melden(
                        await mitarbeiterAendern(mitarbeiter.user_id, {
                          urlaubstage_pro_jahr: wert,
                        }),
                        "Gespeichert.",
                      ),
                    );
                  }}
                  className="w-full rounded-lg border border-ink/15 bg-cream-soft px-2 py-2 text-sm"
                  aria-label={`Urlaubstage pro Jahr von ${mitarbeiter.name}`}
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setPasswortFuer(passwortFuer === mitarbeiter.user_id ? null : mitarbeiter.user_id)
                }
                className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm sm:w-28"
              >
                Passwort
              </button>

              <button
                type="button"
                disabled={laeuft || mitarbeiter.user_id === ichSelbst}
                onClick={() =>
                  starte(async () =>
                    melden(
                      await mitarbeiterAendern(mitarbeiter.user_id, { aktiv: !mitarbeiter.aktiv }),
                      mitarbeiter.aktiv ? "Deaktiviert." : "Aktiviert.",
                    ),
                  )
                }
                className={`shrink-0 rounded-full border px-4 py-2 text-sm disabled:opacity-30 sm:w-32 ${
                  mitarbeiter.aktiv
                    ? "border-terracotta/30 text-terracotta"
                    : "border-green/30 text-green"
                }`}
              >
                {mitarbeiter.aktiv ? "Deaktivieren" : "Aktivieren"}
              </button>
            </div>

            {passwortFuer === mitarbeiter.user_id && (
              <form
                className="mt-3 flex flex-wrap gap-2"
                action={(formData) => {
                  starte(async () => {
                    melden(
                      await passwortSetzen(
                        mitarbeiter.user_id,
                        String(formData.get("neu") ?? ""),
                      ),
                      "Passwort geändert.",
                    );
                    setPasswortFuer(null);
                  });
                }}
              >
                <input
                  name="neu"
                  required
                  minLength={8}
                  placeholder="Neues Passwort, mindestens 8 Zeichen"
                  className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-cream-soft px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={laeuft}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream disabled:opacity-60"
                >
                  Setzen
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
