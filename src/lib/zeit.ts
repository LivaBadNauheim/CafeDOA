import { CAFE_TIME_ZONE } from "./opening-hours.ts";

/** Fiktive Adressen: Es gibt keine Postfächer, nur Anmeldenamen. */
export const LOGIN_DOMAIN = "zeiterfassung.local";

export type Eintragstyp = "arbeit" | "urlaub" | "krank" | "frei";

export const TYPEN: { wert: Eintragstyp; label: string }[] = [
  { wert: "arbeit", label: "Arbeit" },
  { wert: "urlaub", label: "Urlaub" },
  { wert: "krank", label: "Krank" },
  { wert: "frei", label: "Frei" },
];

export type ZeitEintrag = {
  id: string;
  user_id: string;
  name: string;
  datum: string;
  typ: Eintragstyp;
  beginn: string | null;
  ende: string | null;
  pause_minuten: number;
  notiz: string | null;
  minuten: number;
  geaendert_von: string | null;
  geaendert_at: string | null;
};

export type Mitarbeiter = {
  user_id: string;
  name: string;
  rolle: "mitarbeiter" | "admin";
  stunden_pro_monat: number;
  aktiv: boolean;
};

// --- Datum ---------------------------------------------------------------
//
// Gerechnet wird auf Kalendertagen als Text, nicht auf Zeitstempeln. Ein
// Arbeitstag ist ein Datum, keine Sekunde - und über Mittag statt Mitternacht
// gerechnet kann die Zeitumstellung nichts um einen Tag verschieben.

function alsZahl(tag: string): number {
  return Date.parse(`${tag}T12:00:00Z`);
}

export function tagPlus(tag: string, tage: number): string {
  return new Date(alsZahl(tag) + tage * 86_400_000).toISOString().slice(0, 10);
}

export function tageDazwischen(von: string, bis: string): number {
  return Math.round((alsZahl(bis) - alsZahl(von)) / 86_400_000);
}

/** Heute in Café-Zeit, als YYYY-MM-DD. */
export function heute(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Montag der Woche, in der dieser Tag liegt. */
export function montagDerWoche(tag: string): string {
  const wochentag = new Date(alsZahl(tag)).getUTCDay(); // 0 = Sonntag
  return tagPlus(tag, wochentag === 0 ? -6 : 1 - wochentag);
}

export function wochentage(montag: string): string[] {
  return Array.from({ length: 7 }, (_, i) => tagPlus(montag, i));
}

export function monatsErster(tag: string): string {
  return `${tag.slice(0, 7)}-01`;
}

export function monatsLetzter(tag: string): string {
  const [jahr, monat] = tag.split("-").map(Number);
  return new Date(Date.UTC(jahr, monat, 0)).toISOString().slice(0, 10);
}

const WOCHENTAG = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  timeZone: "UTC",
});
const TAG_MONAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});
const MONAT_JAHR = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function wochentagName(tag: string): string {
  return WOCHENTAG.format(new Date(alsZahl(tag)));
}

export function tagKurz(tag: string): string {
  return TAG_MONAT.format(new Date(alsZahl(tag)));
}

export function monatName(tag: string): string {
  return MONAT_JAHR.format(new Date(alsZahl(tag)));
}

// --- Stunden -------------------------------------------------------------

/** 510 -> "8:30". Stunden laufen über 24 hinaus, das ist eine Summe. */
export function stunden(minuten: number): string {
  const zeichen = minuten < 0 ? "-" : "";
  const gesamt = Math.abs(Math.round(minuten));
  return `${zeichen}${Math.floor(gesamt / 60)}:${String(gesamt % 60).padStart(2, "0")}`;
}

export function minutenAus(beginn: string, ende: string, pause: number): number {
  const [bh, bm] = beginn.split(":").map(Number);
  const [eh, em] = ende.split(":").map(Number);
  return eh * 60 + em - (bh * 60 + bm) - pause;
}

/** "08:00:00" -> "08:00". Postgres liefert Sekunden mit, das Formular nicht. */
export function uhrzeit(wert: string | null): string {
  return wert ? wert.slice(0, 5) : "";
}
