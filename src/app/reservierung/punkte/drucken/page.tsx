import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ungedruckteKarten } from "@/app/actions/punkte";
import { punkteProgrammAktiv } from "@/lib/punkte";
import { BOGEN, KARTEN_PRO_BOGEN, karteUrl, qrPfad } from "@/lib/karte";
import DruckSteuerung from "./DruckSteuerung";
import Kundenkarte from "./Kundenkarte";

export const metadata: Metadata = {
  title: "Karten drucken – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DruckenPage() {
  if (!punkteProgrammAktiv()) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/reservierung/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reservierung/login");

  const karten = await ungedruckteKarten();
  const mitQr = await Promise.all(
    karten.map(async (karte) => ({ ...karte, qr: await qrPfad(karteUrl(karte.token)) })),
  );

  const boegen: (typeof mitQr)[] = [];
  for (let i = 0; i < mitQr.length; i += KARTEN_PRO_BOGEN) {
    boegen.push(mitQr.slice(i, i + KARTEN_PRO_BOGEN));
  }

  return (
    <>
      {/*
        Ein fester Seitenrahmen statt der Browser-Voreinstellung: Sonst
        skaliert der Druckdialog den Inhalt, und die Karten kommen in einer
        Größe heraus, die zu keiner Schneidevorlage passt.
      */}
      {/*
        Beim ersten Probedruck brachte die Seite ihre Bildschirm-Abstaende mit
        aufs Papier: Innenabstand, Maximalbreite und Zentrierung schoben das
        Raster aus der Seite. Im Druck wird deshalb alles davon zurueckgesetzt,
        und der Bogen beginnt exakt am Seitenrand.
      */}
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body { background: #fff; margin: 0; padding: 0; }
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .bogen { margin: 0 !important; break-after: page; }
          .bogen:last-child { break-after: auto; }
        }
      `}</style>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <div className="print:hidden">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="font-display text-2xl font-semibold">Karten drucken</h1>
            <Link href="/reservierung/punkte" className="text-sm text-ink/60 underline underline-offset-4">
              Zurück
            </Link>
          </div>

          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/70">
            {karten.length === 0
              ? "Alle angelegten Karten sind gedruckt. Leg neue an, dann erscheinen sie hier."
              : `${karten.length} noch nicht gedruckte Karten, ${BOGEN.spalten} × ${BOGEN.reihen} pro A4-Bogen.`}{" "}
            Im Druckdialog <strong>Ränder: keine</strong> und <strong>Skalierung: 100 %</strong>{" "}
            wählen – sonst stimmt das Maß nicht und die Karten passen in keine
            Schneidevorlage.
          </p>

          <div className="mt-6">
            <DruckSteuerung ids={karten.map((karte) => karte.id)} />
          </div>
        </div>

        {boegen.map((bogen, index) => (
          <div
            key={index}
            className="bogen mt-8 grid justify-start gap-0 print:mt-0"
            style={{ gridTemplateColumns: `repeat(${BOGEN.spalten}, 85mm)`, width: `${BOGEN.spalten * 85}mm` }}
          >
            {bogen.map((karte) => (
              <Kundenkarte key={karte.id} token={karte.token} qr={karte.qr} />
            ))}
          </div>
        ))}
      </main>
    </>
  );
}
