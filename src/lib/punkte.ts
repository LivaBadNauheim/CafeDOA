import { randomBytes } from "node:crypto";
import { CAFE_TIME_ZONE } from "./opening-hours";

/**
 * Regeln des Punkteprogramms.
 *
 * Der Kurs selbst - ein Punkt je vollem Euro - steckt in der Ansicht
 * `punkte_stand` (siehe `supabase/migrations/0004_punkteprogramm.sql`), weil
 * er dort in derselben Rechnung wie die Summe angewandt wird. Hier steht nur
 * die Beschriftung dazu.
 */
export const PUNKTE_REGELN = {
  kursLabel: "1 Punkt je vollem Euro",
  /**
   * Bis wann ein Bon eingereicht werden kann. Ein knappes Zeitfenster von
   * Minuten würde kaum schützen - wer den liegengelassenen Bon vom Nachbartisch
   * nimmt, tut das sofort - dafür aber alle ärgern, die abends in Ruhe scannen
   * wollen. Der eigentliche Schutz ist die Signaturprüfung.
   */
  fensterLabel: "am selben Tag",
  /** Obergrenze gegen Ausreißer. Ein echter Bon darüber ist am Tresen zu klären. */
  maxBetragCent: 50_000,
} as const;

/**
 * Solange das nicht gesetzt ist, existiert das Programm nach außen nicht:
 * Die Seiten antworten mit "nicht gefunden", nicht mit einer Ankündigung.
 * Bewusst ohne NEXT_PUBLIC_, damit im ausgelieferten Code kein Hinweis
 * darauf steckt, dass hier etwas vorbereitet wird.
 */
export function punkteProgrammAktiv(): boolean {
  return process.env.PUNKTE_PROGRAMM_AKTIV === "true";
}

/**
 * Der Code auf der Karte. Nicht fortlaufend, sondern zufällig: Eine
 * Kundennummer 0001 lässt sich hochzählen, und wer fremde Codes raten kann,
 * sieht fremde Punktestände.
 *
 * Ohne I, O, 0 und 1 - die verwechselt man beim Abtippen.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function neuerToken(): string {
  const bytes = randomBytes(10);
  const zeichen = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${zeichen.slice(0, 5)}-${zeichen.slice(5)}`;
}

export function tokenNormalisieren(eingabe: string): string {
  // Gescannt wird meist die ganze Adresse von der Karte, nicht der nackte
  // Code - der letzte Pfadteil ist dann das Gesuchte.
  const ohneAdresse = eingabe.trim().replace(/^.*\/punkte\//i, "");
  const roh = ohneAdresse.toUpperCase().replace(/[^A-Z2-9]/g, "");
  return roh.length === 10 ? `${roh.slice(0, 5)}-${roh.slice(5)}` : roh;
}

export const TOKEN_MUSTER = /^[A-Z2-9]{5}-[A-Z2-9]{5}$/;

/** Kalendertag in Café-Zeit, als YYYY-MM-DD. */
export function cafeTag(zeitpunkt: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(zeitpunkt);
}

export function punkteAus(umsatzCent: number): number {
  return Math.floor(umsatzCent / 100);
}

export function euro(cent: number): string {
  return `${(cent / 100).toFixed(2).replace(".", ",")} €`;
}

export type PunkteStand = {
  id: string;
  token: string;
  vorname: string | null;
  umsatz_cent: number;
  punkte_verdient: number;
  punkte_eingeloest: number;
  punkte_verfuegbar: number;
  letzter_bon: string | null;
};

export type Praemie = {
  id: string;
  name: string;
  punkte: number;
};
