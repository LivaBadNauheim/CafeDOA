/**
 * Selbsttest der Bon-Prüfung gegen drei echte Bons aus dem Café.
 *
 * Ohne diese Muster lässt sich die Signaturprüfung nicht nachvollziehen: Sie
 * hängt an einer Byte-für-Byte-Rekonstruktion dessen, was die TSE signiert
 * hat, und ein Fehler darin fällt sonst erst auf, wenn Gäste am Tresen
 * stehen und nichts funktioniert. Umgekehrt darf kein manipulierter Bon
 * durchgehen - beides prüft dieses Skript.
 *
 *   npm run test:tse
 */
import { generateKeyPairSync } from "node:crypto";
import { pruefeBelegCode } from "../src/lib/tse-beleg.ts";

const ECHTE_BONS = [
  {
    name: "01.08. · 7,00 € unbar (davon 2,50 € zu 0 %)",
    code: "V0;PC21247F10076;Kassenbeleg-V1;Beleg^4.50_0.00_0.00_0.00_2.50^7.00:Unbar;77380;155309;2026-08-01T18:47:52.000Z;2026-08-01T18:48:05.000Z;ecdsa-plain-SHA256;unixTime;LElphgypUuHJbUg+f9mznVU0DSeQIC65yvzS3JyZwnReqeVqf8iyjMFMd4UqhpSwP30HZgWa4DP8e6MuWSUt/g==;BH96DTiD/1Ia6EWxkn5FYGn0fz2jiWYxj/fWOiydT3JSf5IXexbzFjYn9ZSSFSWya2M4uM/B1MLrEHGn0T8Q3wA=",
    punktefaehigCent: 450,
  },
  {
    name: "12.08. · 35,00 € unbar, Außer-Haus",
    code: "V0;PC21247F10076;Kassenbeleg-V1;Beleg^10.00_21.50_0.00_0.00_3.50^35.00:Unbar;79871;160302;2026-08-12T09:20:12.000Z;2026-08-12T09:20:27.000Z;ecdsa-plain-SHA256;unixTime;zLvG6EOCXyPERpcnYxx7TDpEUM6lMnlPun1D6w8GbzwOZ8kYAcP6W7D+b6SLPGIItAllVuRUO82LS8dDdPtipQ==;BH96DTiD/1Ia6EWxkn5FYGn0fz2jiWYxj/fWOiydT3JSf5IXexbzFjYn9ZSSFSWya2M4uM/B1MLrEHGn0T8Q3wA=",
    punktefaehigCent: 3150,
  },
  {
    name: "12.08. · 2,50 € bar, Tisch 20 (zweite Kasse)",
    code: "V0;PF03244920052;Kassenbeleg-V1;Beleg^2.50_0.00_0.00_0.00_0.00^2.50:Bar;79892;160344;2026-08-12T10:19:31.000Z;2026-08-12T10:19:39.000Z;ecdsa-plain-SHA256;unixTime;y9xQDzDccCPp697s+Q871Zkjnc1OYrXj3dsCN2Gv8MJFWFoilpTDV87fuf66YtkUMxKi4DC8R3r2DFZsK/dPDA==;BH96DTiD/1Ia6EWxkn5FYGn0fz2jiWYxj/fWOiydT3JSf5IXexbzFjYn9ZSSFSWya2M4uM/B1MLrEHGn0T8Q3wA=",
    punktefaehigCent: 250,
  },
];

/** Roher EC-Punkt eines fremden Schlüssels, wie er im QR stünde. */
function fremderSchluessel(): string {
  const { publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return publicKey.export({ type: "spki", format: "der" }).subarray(26).toString("base64");
}

const felder = ECHTE_BONS[2].code.split(";");
function verfaelscht(index: number, wert: string): string {
  const kopie = [...felder];
  kopie[index] = wert;
  return kopie.join(";");
}

const MANIPULATIONEN = [
  ["Betrag 2,50 € auf 250,00 € erhöht", verfaelscht(3, "Beleg^250.00_0.00_0.00_0.00_0.00^250.00:Bar")],
  ["Transaktionsnummer ausgetauscht", verfaelscht(4, "79999")],
  ["Signaturzähler verändert", verfaelscht(5, "160345")],
  ["Zeitstempel um eine Stunde verschoben", verfaelscht(7, "2026-08-12T11:19:39.000Z")],
  ["Kassenkennung verändert", verfaelscht(1, "PF03244920053")],
  ["fremder Schlüssel untergeschoben", verfaelscht(11, fremderSchluessel())],
  ["Bon eines anderen Betriebs", verfaelscht(11, fremderSchluessel())],
  ["abgeschnittener Code", felder.slice(0, 8).join(";")],
  ["leerer Text", ""],
] as const;

let fehler = 0;

console.log("Echte Bons - müssen durchgehen:");
for (const bon of ECHTE_BONS) {
  const ergebnis = pruefeBelegCode(bon.code);
  if (!ergebnis.ok) {
    console.log(`  FEHLER  ${bon.name} -> abgewiesen: ${ergebnis.grund}`);
    fehler++;
  } else if (ergebnis.beleg.punktefaehigCent !== bon.punktefaehigCent) {
    console.log(`  FEHLER  ${bon.name} -> ${ergebnis.beleg.punktefaehigCent} statt ${bon.punktefaehigCent} Cent`);
    fehler++;
  } else {
    const punkte = Math.floor(ergebnis.beleg.punktefaehigCent / 100);
    console.log(`  ok      ${bon.name} -> ${(ergebnis.beleg.punktefaehigCent / 100).toFixed(2)} € punktefähig (${punkte} P.)`);
  }
}

console.log("\nManipulierte Bons - dürfen nicht durchgehen:");
for (const [name, code] of MANIPULATIONEN) {
  const ergebnis = pruefeBelegCode(code);
  if (ergebnis.ok) {
    console.log(`  FEHLER  ${name} -> durchgelassen!`);
    fehler++;
  } else {
    console.log(`  ok      ${name} -> "${ergebnis.grund}"`);
  }
}

console.log(fehler === 0 ? "\nAlles wie erwartet." : `\n${fehler} Abweichung(en).`);
process.exit(fehler === 0 ? 0 : 1);
