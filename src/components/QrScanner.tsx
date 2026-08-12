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

  const stoppen = useCallback(() => {
    laeuftRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setAktiv(false);
  }, []);

  const starten = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setAktiv(true);
      laeuftRef.current = true;

      const suchen = () => {
        if (!laeuftRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });

        if (video && canvas && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
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
    } catch {
      onFehler?.("Wir kommen nicht an die Kamera.");
    }
  }, [onErkannt, onFehler, stoppen]);

  useEffect(() => stoppen, [stoppen]);

  return (
    <div>
      {aktiv ? (
        <div className="overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} className="w-full" playsInline muted />
          <button type="button" onClick={stoppen} className="w-full py-3 text-sm font-semibold text-cream">
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={starten}
          className="w-full rounded-full bg-ink px-7 py-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/90"
        >
          {knopfText}
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
