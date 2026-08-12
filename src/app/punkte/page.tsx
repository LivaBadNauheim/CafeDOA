import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { praemienLesen, standLesen } from "@/app/actions/punkte";
import { PUNKTE_REGELN, euro, punkteProgrammAktiv } from "@/lib/punkte";
import BonScanner from "./BonScanner";
import KarteVerbinden from "./KarteVerbinden";

export const metadata: Metadata = {
  title: "Punkte – Café DOA",
  // Kein Eintrag bei Suchmaschinen: Die Seite ist für Gäste mit Karte,
  // nicht für Fremde, die nach dem Café suchen.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PunktePage() {
  if (!punkteProgrammAktiv()) notFound();

  const [stand, praemien] = await Promise.all([standLesen(), praemienLesen()]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12 sm:py-16">
        {!stand ? (
          <>
            <h1 className="font-display text-3xl font-semibold">Deine Punkte</h1>
            <p className="mt-4 leading-relaxed text-ink/70">
              Scan den Code auf deiner DOA-Karte, dann läuft alles auf diesem
              Handy. Noch keine Karte? Frag uns beim nächsten Mal danach.
            </p>
            <KarteVerbinden />
          </>
        ) : (
          <>
            <p className="text-sm text-ink/60">
              {stand.vorname ? `Hi ${stand.vorname}` : "Deine Karte"}
            </p>
            <p className="mt-2 font-display text-6xl font-semibold leading-none">
              {stand.punkte_verfuegbar}
            </p>
            <p className="mt-2 text-ink/70">
              {stand.punkte_verfuegbar === 1 ? "Punkt" : "Punkte"} ·{" "}
              {PUNKTE_REGELN.kursLabel}
            </p>

            <div className="mt-10">
              <BonScanner />
              <p className="mt-3 text-center text-xs text-ink/50">
                Bons kannst du {PUNKTE_REGELN.fensterLabel} einreichen.
              </p>
            </div>

            {praemien.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-xl font-semibold">Dafür reicht es</h2>
                <ul className="mt-4 divide-y divide-ink/10">
                  {praemien.map((praemie) => {
                    const fehlt = praemie.punkte - stand.punkte_verfuegbar;
                    return (
                      <li key={praemie.id} className="flex items-baseline justify-between gap-4 py-3">
                        <span className={fehlt > 0 ? "text-ink/50" : "font-medium"}>
                          {praemie.name}
                        </span>
                        <span className="shrink-0 text-sm text-ink/60">
                          {fehlt > 0 ? `noch ${fehlt}` : "einlösbar"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-sm text-ink/60">
                  Einlösen geht bei uns am Tresen – zeig einfach deine Karte.
                </p>
              </section>
            )}

            <p className="mt-12 text-xs text-ink/40">
              Gesammelt aus {euro(stand.umsatz_cent)} Umsatz
              {stand.punkte_eingeloest > 0 && `, ${stand.punkte_eingeloest} Punkte eingelöst`}.
            </p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
