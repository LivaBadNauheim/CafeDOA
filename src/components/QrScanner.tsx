"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onErkannt: (inhalt: string) => void;
  knopfText: string;
  onFehler?: (meldung: string) => void;
};

function ausBilddaten(daten: ImageData): string | null {
  return jsQR(daten.data, daten.width, daten.height)?.data ?? null;
}

/**
 * Liest einen QR-Code mit der Kamera.
 *
 * Eigene Bibliothek statt der eingebauten Code-Erkennung des Browsers:
 * Safari auf dem iPhone hat keine, und das ist die Hälfte unserer Gäste.
 */
export default function QrScanner({ onErkannt, knopfText, onFehler }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laeuftRef = useRef(false);
  const [aktiv, setAktiv] = useState(false);
  const [hakt, setHakt] = useState(false);

  const stoppen = useCallback(() => {
    laeuftRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setAktiv(false);
    setHakt(false);
  }, []);

  const starten = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onFehler?.("Dieser Browser gibt uns keinen Zugriff auf die Kamera.");
      return;
    }

    // Erst sichtbar schalten, dann die Kamera holen. iOS liefert fuer ein
    // ausgeblendetes Video-Element keine Bilder und zeigt nur das
    // Platzhaltersymbol - der Knopf sah dann aus, als passiere nichts.
    // Der Aufruf bleibt trotzdem im selben Klick-Vorgang, sonst verweigert
    // Safari den Kamerazugriff.
    setAktiv(true);
    setHakt(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setAktiv(false);
        onFehler?.("Die Kamera lässt sich gerade nicht öffnen.");
        return;
      }

      // Als Eigenschaft, nicht als Attribut: Sonst startet iOS die Wiedergabe
      // nicht ohne weitere Nutzeraktion.
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      laeuftRef.current = true;

      const beginn = Date.now();
      const suchen = () => {
        if (!laeuftRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });

        if (canvas && ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const treffer = ausBilddaten(ctx.getImageData(0, 0, canvas.width, canvas.height));
          if (treffer) {
            stoppen();
            onErkannt(treffer);
            return;
          }
        } else if (Date.now() - beginn > 4000) {
          // Kein einziges Bild in vier Sekunden - dann kommt auch keins mehr.
          setHakt(true);
        }
        requestAnimationFrame(suchen);
      };
      requestAnimationFrame(suchen);
    } catch (fehler) {
      setAktiv(false);
      const name = fehler instanceof Error ? fehler.name : "";
      onFehler?.(
        name === "NotAllowedError"
          ? "Die Kamera ist für diese Seite gesperrt. Im Browser freigeben – oder unten ein Foto machen."
          : "Wir kommen nicht an die Kamera. Nimm stattdessen ein Foto.",
      );
    }
  }, [onErkannt, onFehler, stoppen]);

  /**
   * Der zuverlaessige Weg auf dem iPhone: Statt eines Live-Bildes im Browser
   * oeffnet sich die Kamera-App des Systems. Was sie liefert, werten wir hier
   * aus. Umstaendlicher, aber es scheitert nicht an Safari-Eigenheiten.
   */
  const ausFoto = useCallback(
    async (datei: File) => {
      try {
        const bild = await createImageBitmap(datei);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !ctx) return;

        // Grosse Fotos herunterrechnen: Bei 12 Megapixeln dauert die Suche
        // spuerbar laenger, ohne dass sie besser wird.
        const faktor = Math.min(1, 1600 / Math.max(bild.width, bild.height));
        canvas.width = Math.round(bild.width * faktor);
        canvas.height = Math.round(bild.height * faktor);
        ctx.drawImage(bild, 0, 0, canvas.width, canvas.height);

        const treffer = ausBilddaten(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (treffer) onErkannt(treffer);
        else onFehler?.("Auf dem Foto war kein Code zu erkennen. Näher ran und nochmal.");
      } catch {
        onFehler?.("Das Foto konnte nicht gelesen werden.");
      }
    },
    [onErkannt, onFehler],
  );

  useEffect(() => stoppen, [stoppen]);

  return (
    <div>
      <div className={aktiv ? "overflow-hidden rounded-2xl bg-ink" : "hidden"}>
        <video ref={videoRef} className="w-full" playsInline muted autoPlay />
        {hakt && (
          <p className="px-4 pt-3 text-center text-xs text-cream/70">
            Kein Bild von der Kamera. Nimm unten ein Foto.
          </p>
        )}
        <button type="button" onClick={stoppen} className="w-full py-3 text-sm font-semibold text-cream">
          Abbrechen
        </button>
      </div>

      {!aktiv && (
        <button
          type="button"
          onClick={starten}
          className="w-full rounded-full bg-ink px-7 py-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/90"
        >
          {knopfText}
        </button>
      )}

      <label className="mt-3 block cursor-pointer text-center text-sm text-ink/60 underline underline-offset-4">
        Klappt nicht? Foto machen
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const datei = event.target.files?.[0];
            event.target.value = "";
            if (datei) void ausFoto(datei);
          }}
        />
      </label>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
