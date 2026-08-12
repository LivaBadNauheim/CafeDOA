"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { belegEinreichen } from "@/app/actions/punkte";

type Meldung = { art: "ok" | "fehler"; text: string } | null;

/**
 * Liest den QR-Code vom Kassenbon mit der Kamera.
 *
 * Die Auswertung passiert hier im Browser, die Prüfung aber nicht: Der
 * gelesene Text geht unverändert an den Server, der die Signatur der TSE
 * prüft. Eine Prüfung an dieser Stelle wäre wertlos - der Browser gehört
 * dem Gast, er könnte sie überspringen.
 *
 * Warum eine eigene Bibliothek statt der eingebauten Code-Erkennung: Safari
 * auf dem iPhone hat keine, und das ist die Hälfte unserer Gäste.
 */
export default function BonScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laeuftRef = useRef(false);
  const [aktiv, setAktiv] = useState(false);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [handeingabe, setHandeingabe] = useState(false);
  const [sendet, setSendet] = useState(false);

  const stoppen = useCallback(() => {
    laeuftRef.current = false;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setAktiv(false);
  }, []);

  const einreichen = useCallback(
    async (inhalt: string, manuell: boolean) => {
      setSendet(true);
      const ergebnis = await belegEinreichen(inhalt, manuell);
      setSendet(false);
      setMeldung({ art: ergebnis.status === "ok" ? "ok" : "fehler", text: ergebnis.meldung });
    },
    [],
  );

  const starten = useCallback(async () => {
    setMeldung(null);
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
            void einreichen(treffer.data, false);
            return;
          }
        }
        requestAnimationFrame(suchen);
      };
      requestAnimationFrame(suchen);
    } catch {
      setMeldung({
        art: "fehler",
        text: "Wir kommen nicht an die Kamera. Tipp den Code vom Bon von Hand ein.",
      });
      setHandeingabe(true);
    }
  }, [einreichen, stoppen]);

  useEffect(() => stoppen, [stoppen]);

  return (
    <div>
      {aktiv ? (
        <div className="overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} className="w-full" playsInline muted />
          <button
            type="button"
            onClick={stoppen}
            className="w-full py-3 text-sm font-semibold text-cream"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={starten}
          disabled={sendet}
          className="w-full rounded-full bg-ink px-7 py-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/90 disabled:opacity-60"
        >
          {sendet ? "Einen Moment…" : "Bon scannen"}
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {meldung && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            meldung.art === "ok"
              ? "bg-green/10 text-green"
              : "bg-terracotta/10 text-terracotta"
          }`}
          role="status"
        >
          {meldung.text}
        </p>
      )}

      {!aktiv && (
        <div className="mt-6">
          {handeingabe ? (
            <form
              action={async (formData) => {
                const wert = String(formData.get("code") ?? "");
                if (wert.trim()) await einreichen(wert, true);
              }}
            >
              <label htmlFor="code" className="text-sm text-ink/70">
                Der lange Text unter dem QR-Code auf dem Bon
              </label>
              <textarea
                id="code"
                name="code"
                rows={3}
                className="mt-2 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
                placeholder="V0;…"
              />
              <button
                type="submit"
                disabled={sendet}
                className="mt-3 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold disabled:opacity-60"
              >
                Absenden
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setHandeingabe(true)}
              className="text-sm text-ink/60 underline underline-offset-4"
            >
              Kamera geht nicht? Code eintippen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
