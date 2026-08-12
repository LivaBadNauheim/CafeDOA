import type { MetadataRoute } from "next";

/**
 * Macht aus der Seite eine Web-App statt einer Verknüpfung.
 *
 * Der Unterschied ist der ganze Punkt: Ohne das bekommt der Gast ein
 * Safari-Symbol mit Adresszeile, mit dem hier ein eigenes Symbol, eigenen
 * Namen, Vollbild und einen eigenen Eintrag im App-Umschalter.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Café DOA – Punkte",
    // Unter dem Symbol ist kaum Platz; alles ab etwa zwölf Zeichen kürzt das
    // System selbst ab.
    short_name: "DOA Punkte",
    description: "Bon scannen, Punkte sammeln, im Café DOA einlösen.",
    // Startet direkt beim Punktestand statt auf der Startseite - wer die App
    // öffnet, will nicht erst durch die Speisekarte scrollen.
    start_url: "/punkte",
    // Der ganze Auftritt bleibt drin: Ein Klick auf "Karte" im Kopf soll
    // nicht aus der App heraus in den Browser springen.
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6efe1",
    theme_color: "#1f3327",
    lang: "de",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android beschneidet Symbole auf seine eigene Form. Diese Fassung hat
      // dafür mehr Rand, damit das Zeichen nicht angesägt wird.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
