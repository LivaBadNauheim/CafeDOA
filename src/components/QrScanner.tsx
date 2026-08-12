"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onErkannt: (inhalt: string) => void;
  knopfText: string;
  onFehler?: (meldung: string) => void;
};

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
  const [startet, setStartet] = useState(false);

  const stoppen = useCallback(() => {
    laeuftRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setAktiv(false);
  }, []);

  const starten = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onFehler?.("Dieser Browser gibt uns keinen Zugriff auf die Kamera.");
      return;
    }
    setStartet(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        onFehler?.("Die Kamera lässt sich gerade nicht öffnen.");
        return;
      }
      video.srcObject = stream;
      await video.play();
      setAktiv(true);
      laeuftRef.current = true;

      const suchen = () => {
        if (!laeuftRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });

        if (canvas && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const bild = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const treffer = jsQR(bild.data, bild.width, bild.height);
          if (treffer?.data) {
            stoppen();
            onErkannt(treffer.data);
            return;
          }
        }
        requestAnimationFrame(suchen);
      };
      requestAnimationFrame(suchen);
    } catch (fehler) {
      const name = fehler instanceof Error ? fehler.name : "";
      onFehler?.(
        name === "NotAllowedError"
          ? "Die Kamera ist für diese Seite gesperrt. In den Browser-Einstellungen freigeben – oder den Code eintippen."
          : "Wir kommen nicht an die Kamera.",
      );
    } finally {
      setStartet(false);
    }
  }, [onErkannt, onFehler, stoppen]);

  useEffect(() => stoppen, [stoppen]);

  return (
    <div>
      {/*
        Video und Canvas stehen immer im Baum, nur unsichtbar.
        Sie erst beim Einschalten zu erzeugen war der Fehler: Beim Anhaengen
        des Kamerabildes gab es das Element noch nicht, und der Aufruf lief
        ins Leere - ohne Bild und ohne Meldung.
      */}
      <div className={aktiv ? "overflow-hidden rounded-2xl bg-ink" : "hidden"}>
        <video ref={videoRef} className="w-full" playsInline muted autoPlay />
        <button type="button" onClick={stoppen} className="w-full py-3 text-sm font-semibold text-cream">
          Abbrechen
        </button>
      </div>

      {!aktiv && (
        <button
          type="button"
          onClick={starten}
          disabled={startet}
          className="w-full rounded-full bg-ink px-7 py-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/90 disabled:opacity-60"
        >
          {startet ? "Kamera wird geöffnet…" : knopfText}
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
