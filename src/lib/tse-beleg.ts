import { createHash, createPublicKey, verify } from "node:crypto";

/**
 * Prüft den QR-Code auf dem Kassenbon gegen die Signatur der TSE.
 *
 * Nur damit ist ein eingereichter Bon mehr als eine Behauptung: Der Code ist
 * reiner Text, wer einen einzigen Bon gescannt hat, kennt Aufbau und
 * Kassenkennung und könnte sich in zwei Minuten einen über 200 € ausdenken.
 * Weder Dublettenprüfung noch Zeitfenster noch Betragsgrenze würden das
 * bemerken - die Signatur schon.
 *
 * Läuft ausschließlich serverseitig. Eine Prüfung im Browser wäre wertlos,
 * weil der Client sie einfach überspringen könnte.
 */

/**
 * Öffentlicher Schlüssel der TSE des Cafés. Er ist die eigentliche Identität
 * des Betriebs: Beide Kassen (Tresen und Tischgerät) hängen an derselben TSE,
 * ein gültig signierter Bon kann also nur von hier stammen - egal über welches
 * Gerät er lief. Deshalb prüfen wir den Schlüssel und nicht die Kassenkennung.
 *
 * Kommt eine Kasse mit eigener TSE dazu, ändert sich der Schlüssel und der
 * neue muss hier ergänzt werden.
 */
export const TSE_PUBLIC_KEYS = [
  "BH96DTiD/1Ia6EWxkn5FYGn0fz2jiWYxj/fWOiydT3JSf5IXexbzFjYn9ZSSFSWya2M4uM/B1MLrEHGn0T8Q3wA=",
] as const;

const CERTIFIED_DATA_TYPE_TRANSACTION_LOG = "0.4.0.127.0.7.3.7.1.1";

const ALGORITHMS: Record<string, { oid: string; curve: string; hash: string }> = {
  "ecdsa-plain-SHA256": { oid: "0.4.0.127.0.7.1.1.4.1.3", curve: "prime256v1", hash: "sha256" },
  "ecdsa-plain-SHA384": { oid: "0.4.0.127.0.7.1.1.4.1.4", curve: "secp384r1", hash: "sha384" },
};

export type TseBeleg = {
  /** Eindeutig je Bon - taugt als Schlüssel gegen doppeltes Einreichen. */
  belegSchluessel: string;
  kassenkennung: string;
  transaktionsnummer: number;
  /** Gesamtbetrag in Cent, wie ihn der Gast bezahlt hat. */
  bruttoGesamtCent: number;
  /** Anteil, der Punkte gibt: nur 19 % und 7 %. Siehe Kommentar unten. */
  punktefaehigCent: number;
  /** Abschluss des Vorgangs (echtes UTC). */
  zeitpunkt: Date;
};

export type TsePruefergebnis =
  | { ok: true; beleg: TseBeleg }
  | { ok: false; grund: string };

// --- ASN.1/DER, so viel wie gebraucht wird -------------------------------

function derLaenge(n: number): Buffer {
  if (n < 0x80) return Buffer.from([n]);
  const bytes: number[] = [];
  for (let rest = n; rest > 0; rest >>= 8) bytes.unshift(rest & 0xff);
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function tlv(tag: number, inhalt: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), derLaenge(inhalt.length), inhalt]);
}

/** Ganzzahl als Zweierkomplement, führende Null wenn das oberste Bit gesetzt ist. */
function ganzzahl(n: number): Buffer {
  let hex = BigInt(n).toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const bytes = Buffer.from(hex, "hex");
  return bytes[0] & 0x80 ? Buffer.concat([Buffer.from([0]), bytes]) : bytes;
}

function objektKennung(punktnotation: string): Buffer {
  const teile = punktnotation.split(".").map(Number);
  const out = [teile[0] * 40 + teile[1]];
  for (const wert of teile.slice(2)) {
    const gruppe: number[] = [];
    for (let rest = wert; ; rest >>= 7) {
      gruppe.unshift(rest & 0x7f);
      if (rest < 0x80) break;
    }
    for (let i = 0; i < gruppe.length - 1; i++) gruppe[i] |= 0x80;
    out.push(...gruppe);
  }
  return Buffer.from(out);
}

// --- Signaturprüfung -----------------------------------------------------

type QrFelder = {
  kassenkennung: string;
  processType: string;
  processData: string;
  transaktionsnummer: number;
  signaturzaehler: number;
  logZeit: string;
  algorithmus: string;
  zeitformat: string;
  signatur: Buffer;
  publicKey: string;
};

/**
 * Baut die Bytes nach, die die TSE signiert hat (BSI TR-03151).
 *
 * Zwei Stellen, an denen man sich zuverlässig vertut:
 * - Es gibt **kein** äußeres SEQUENCE. Signiert wird die blanke Folge der
 *   DER-Elemente, nicht ein Container darum.
 * - Die Transaktionsnummer steckt als OCTET STRING drin, nicht als INTEGER,
 *   auch wenn ihr Inhalt eine Zahl ist.
 */
function signierteBytes(f: QrFelder): Buffer {
  const algorithmus = ALGORITHMS[f.algorithmus];
  const seriennummer = createHash("sha256").update(Buffer.from(f.publicKey, "base64")).digest();

  return Buffer.concat([
    tlv(0x02, ganzzahl(2)),
    tlv(0x06, objektKennung(CERTIFIED_DATA_TYPE_TRANSACTION_LOG)),
    tlv(0x80, Buffer.from("FinishTransaction", "utf8")),
    tlv(0x81, Buffer.from(f.kassenkennung, "utf8")),
    tlv(0x82, Buffer.from(f.processData, "utf8")),
    tlv(0x83, Buffer.from(f.processType, "utf8")),
    tlv(0x85, ganzzahl(f.transaktionsnummer)),
    tlv(0x04, seriennummer),
    tlv(0x30, tlv(0x06, objektKennung(algorithmus.oid))),
    tlv(0x02, ganzzahl(f.signaturzaehler)),
    tlv(0x02, ganzzahl(Math.floor(Date.parse(f.logZeit) / 1000))),
  ]);
}

/** Roher EC-Punkt (65 Byte, unkomprimiert) in einen prüfbaren Schlüssel. */
function alsPublicKey(punkt: Buffer, kurve: string) {
  const kurvenKennung =
    kurve === "prime256v1" ? "1.2.840.10045.3.1.7" : "1.3.132.0.34";
  const algorithmus = tlv(
    0x30,
    Buffer.concat([
      tlv(0x06, objektKennung("1.2.840.10045.2.1")),
      tlv(0x06, objektKennung(kurvenKennung)),
    ]),
  );
  const bitfolge = tlv(0x03, Buffer.concat([Buffer.from([0]), punkt]));
  return createPublicKey({
    key: tlv(0x30, Buffer.concat([algorithmus, bitfolge])),
    format: "der",
    type: "spki",
  });
}

// --- Beträge -------------------------------------------------------------

function euroInCent(text: string): number | null {
  const treffer = /^(-?)(\d+)\.(\d{2})$/.exec(text.trim());
  if (!treffer) return null;
  const betrag = Number(treffer[2]) * 100 + Number(treffer[3]);
  return treffer[1] ? -betrag : betrag;
}

/**
 * `Beleg^4.50_0.00_0.00_0.00_2.50^7.00:Unbar`
 *
 * Die fünf Beträge sind nach Steuersatz getrennt: 19 %, 7 %, 10,7 %, 5,5 %,
 * 0 %. Punkte gibt es nur auf die ersten beiden. Was zu 0 % läuft, ist
 * Trinkgeld, Pfand oder ein Gutscheinverkauf - alles drei soll keine Punkte
 * geben: Trinkgeld gehört den Mitarbeitern, Pfand wird erstattet, und ein
 * Gutschein zählte sonst doppelt, beim Kauf und beim Einlösen.
 */
function betraege(processData: string): { gesamt: number; punktefaehig: number } | null {
  const abschnitte = processData.split("^");
  if (abschnitte.length < 2) return null;

  const werte = abschnitte[1].split("_").map(euroInCent);
  if (werte.length !== 5 || werte.some((w) => w === null)) return null;

  const cent = werte as number[];
  return { gesamt: cent.reduce((a, b) => a + b, 0), punktefaehig: cent[0] + cent[1] };
}

// --- öffentlich ----------------------------------------------------------

export function pruefeBelegCode(
  qrInhalt: string,
  erlaubteSchluessel: readonly string[] = TSE_PUBLIC_KEYS,
): TsePruefergebnis {
  const felder = qrInhalt.trim().split(";");
  if (felder.length !== 12 || felder[0] !== "V0") {
    return { ok: false, grund: "Das ist kein Bon-Code." };
  }

  const [, kassenkennung, processType, processData, nummer, zaehler, , logZeit, algorithmusName, zeitformat, signaturB64, publicKey] = felder;

  if (processType !== "Kassenbeleg-V1") {
    return { ok: false, grund: "Dieser Code gehört zu keinem Kassenbon." };
  }
  if (!erlaubteSchluessel.includes(publicKey)) {
    return { ok: false, grund: "Dieser Bon stammt nicht aus dem Café DOA." };
  }
  if (!ALGORITHMS[algorithmusName] || zeitformat !== "unixTime") {
    return { ok: false, grund: "Bon-Code in einem unbekannten Format." };
  }

  const transaktionsnummer = Number(nummer);
  const signaturzaehler = Number(zaehler);
  const zeitpunkt = new Date(logZeit);
  if (!Number.isInteger(transaktionsnummer) || !Number.isInteger(signaturzaehler) || Number.isNaN(zeitpunkt.getTime())) {
    return { ok: false, grund: "Bon-Code unvollständig." };
  }

  const summen = betraege(processData);
  if (!summen) return { ok: false, grund: "Bon-Code unvollständig." };

  const algorithmus = ALGORITHMS[algorithmusName];
  const signatur = Buffer.from(signaturB64, "base64");
  const felderTyped: QrFelder = {
    kassenkennung, processType, processData, transaktionsnummer,
    signaturzaehler, logZeit, algorithmus: algorithmusName, zeitformat,
    signatur, publicKey,
  };

  let echt = false;
  try {
    echt = verify(
      algorithmus.hash,
      signierteBytes(felderTyped),
      { key: alsPublicKey(Buffer.from(publicKey, "base64"), algorithmus.curve), dsaEncoding: "ieee-p1363" },
      signatur,
    );
  } catch {
    echt = false;
  }
  if (!echt) return { ok: false, grund: "Die Signatur des Bons stimmt nicht." };

  if (summen.punktefaehig <= 0) {
    return { ok: false, grund: "Für diesen Bon gibt es keine Punkte." };
  }

  return {
    ok: true,
    beleg: {
      belegSchluessel: `${kassenkennung}:${transaktionsnummer}`,
      kassenkennung,
      transaktionsnummer,
      bruttoGesamtCent: summen.gesamt,
      punktefaehigCent: summen.punktefaehig,
      zeitpunkt,
    },
  };
}
