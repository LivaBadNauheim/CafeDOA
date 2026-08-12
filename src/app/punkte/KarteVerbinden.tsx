"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { karteVerbinden } from "@/app/actions/punkte";

/** Fallback, wenn der QR auf der Karte nicht lesbar ist: Code abtippen. */
export default function KarteVerbinden() {
  const router = useRouter();
  const [fehler, setFehler] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  return (
    <form
      className="mt-6"
      action={async (formData) => {
        setLaeuft(true);
        setFehler("");
        const ok = await karteVerbinden(String(formData.get("token") ?? ""));
        setLaeuft(false);
        if (ok) router.refresh();
        else setFehler("Diesen Code kennen wir nicht. Schau nochmal auf die Karte.");
      }}
    >
      <label htmlFor="token" className="text-sm text-ink/70">
        Code von deiner Karte
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="token"
          name="token"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABCDE-12345"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3 font-mono text-sm uppercase tracking-wider"
        />
        <button
          type="submit"
          disabled={laeuft}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream disabled:opacity-60"
        >
          {laeuft ? "…" : "Los"}
        </button>
      </div>
      {fehler && <p className="mt-3 text-sm text-terracotta">{fehler}</p>}
    </form>
  );
}
