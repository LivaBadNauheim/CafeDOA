import { cache } from "react";
import { createSupabaseServerClient } from "./supabase-server";
import {
  MITARBEITER_FELDER,
  monatsErster,
  monatsLetzter,
  montagDerWoche,
  tagPlus,
  type Mitarbeiter,
  type Urlaubskonto,
  type ZeitEintrag,
} from "./zeit";

export type Zugang =
  | { status: "anonym" }
  | { status: "ohne-profil"; email: string }
  | { status: "gesperrt"; email: string }
  | { status: "ok"; person: Mitarbeiter };

/**
 * Wer ist angemeldet - und darf diese Person hier überhaupt sein?
 *
 * Ein Supabase-Konto allein genügt nicht: Erst der Eintrag in
 * `zeit_mitarbeiter` macht jemanden zum Nutzer dieses Bereichs.
 *
 * Über `cache` gebündelt: Layout und Seite fragen beide danach, und ohne das
 * liefe jeder Seitenaufruf mit zwei identischen Abfragen gegen die Datenbank.
 * Der Cache gilt nur innerhalb einer Anfrage, es wird nichts zwischen
 * Besuchern geteilt.
 */
export const zugang = cache(async (): Promise<Zugang> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "anonym" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonym" };

  const email = user.email ?? "";
  const { data, error } = await supabase
    .from("zeit_mitarbeiter")
    .select(MITARBEITER_FELDER)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Zeiterfassung: Profil konnte nicht gelesen werden", {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return { status: "ohne-profil", email };
  }
  if (!data) return { status: "ohne-profil", email };
  if (!(data as Mitarbeiter).aktiv) return { status: "gesperrt", email };

  return { status: "ok", person: data as Mitarbeiter };
});

export async function angemeldet(): Promise<Mitarbeiter | null> {
  const ergebnis = await zugang();
  return ergebnis.status === "ok" ? ergebnis.person : null;
}

export async function alsAdmin(): Promise<Mitarbeiter | null> {
  const person = await angemeldet();
  return person?.rolle === "admin" ? person : null;
}

/**
 * Von Montag der Woche mit dem Monatsersten bis Sonntag der Woche mit dem
 * Monatsletzten.
 *
 * Es wird immer der ganze Monat geladen, auch für die Wochenansicht: Ein
 * Zugriff statt einem je Klick. Das Blättern zwischen Wochen und der Sprung
 * über den Kalender laufen danach ohne Serverbesuch.
 */
export function monatsfenster(tagImMonat: string): { von: string; bis: string } {
  return {
    von: montagDerWoche(monatsErster(tagImMonat)),
    bis: tagPlus(montagDerWoche(monatsLetzter(tagImMonat)), 6),
  };
}

export const eintraegeLaden = cache(
  async (userId: string, von: string, bis: string): Promise<ZeitEintrag[]> => {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    // Kein zusätzlicher Rechte-Check: Die Datenbank gibt fremde Zeilen ohnehin
    // nicht heraus, egal welche Kennung hier steht.
    const { data, error } = await supabase
      .from("zeit_uebersicht")
      .select("*")
      .eq("user_id", userId)
      .gte("datum", von)
      .lte("datum", bis)
      .order("datum")
      .order("beginn", { nullsFirst: true });

    if (error) {
      console.error("Zeiten konnten nicht geladen werden:", error);
      return [];
    }
    return (data as ZeitEintrag[] | null) ?? [];
  },
);

export const mitarbeiterListe = cache(async (): Promise<Mitarbeiter[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("zeit_mitarbeiter")
    .select(MITARBEITER_FELDER)
    .order("name");

  return (data as Mitarbeiter[] | null) ?? [];
});

export const urlaubskonto = cache(
  async (userId: string, jahr: number): Promise<Urlaubskonto | null> => {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("zeit_urlaubskonto")
      .select("*")
      .eq("user_id", userId)
      .eq("jahr", jahr)
      .maybeSingle();

    return (data as Urlaubskonto | null) ?? null;
  },
);

export const alleEintraege = cache(
  async (von: string, bis: string): Promise<ZeitEintrag[]> => {
    if (!(await alsAdmin())) return [];

    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("zeit_uebersicht")
      .select("*")
      .gte("datum", von)
      .lte("datum", bis)
      .order("name")
      .order("datum")
      .order("beginn", { nullsFirst: true })
      .limit(20_000);

    if (error) {
      console.error("Auswertung konnte nicht geladen werden:", error);
      return [];
    }
    return (data as ZeitEintrag[] | null) ?? [];
  },
);
