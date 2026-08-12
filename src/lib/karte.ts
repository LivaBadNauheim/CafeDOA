import QRCode from "qrcode";
import { CAFE_INFO } from "./cafe-info";

/**
 * Welches der drei Layouts gedruckt wird. Umstellen heißt: hier einen
 * Buchstaben ändern, nichts weiter.
 */
export const KARTEN_LAYOUT: "hell" | "dunkel" | "zweigeteilt" = "zweigeteilt";

/**
 * Linie zum Handschreiben des Vornamens.
 *
 * Bewusst nicht gedruckt: Ein gedruckter Name bräuchte je Karte einen
 * eigenen Druckvorgang, der Gast müsste warten, und eine liegengebliebene
 * Karte wäre plötzlich eine kleine Datenpanne statt eines Zufallscodes.
 * Handschrift wirkt ohnehin persönlicher als Laserdruck.
 */
export const MIT_NAMENSLINIE = false;

/** Visitenkartenformat. Zwei Spalten und fünf Reihen passen auf A4. */
export const KARTE_MM = { breite: 85, hoehe: 55 } as const;
export const BOGEN = { spalten: 2, reihen: 5 } as const;
export const KARTEN_PRO_BOGEN = BOGEN.spalten * BOGEN.reihen;

export function karteUrl(token: string): string {
  return `${CAFE_INFO.siteUrl}/punkte/${token}`;
}

export type QrPfad = { d: string; viewBox: string };

/**
 * Erzeugt den QR-Code als Pfad zum direkten Einbetten.
 *
 * Zwei Dinge, die beim Drucken über Erfolg und Misserfolg entscheiden und
 * beide beim ersten Versuch falsch waren:
 *
 * - `margin: 4` ist die Ruhezone. Ohne den hellen Rand ringsum finden
 *   Kameras den Code schlicht nicht - er ist dann gedruckt, aber wertlos.
 * - Die Bibliothek zeichnet die Module als Striche mit `stroke`, nicht als
 *   Fläche mit `fill`. Der erste Pfad in ihrer Ausgabe ist nur der weiße
 *   Hintergrund; wer den nimmt, druckt ein leeres Quadrat.
 */
export async function qrPfad(text: string): Promise<QrPfad> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "M",
  });
  const d = /<path stroke="[^"]*" d="([^"]+)"/.exec(svg)?.[1];
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  if (!d || !viewBox) throw new Error("QR-Code konnte nicht erzeugt werden");
  return { d, viewBox };
}
