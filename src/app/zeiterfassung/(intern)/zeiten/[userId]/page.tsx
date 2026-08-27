import Link from "next/link";
import { notFound } from "next/navigation";
import {
  angemeldet,
  eintraegeLaden,
  mitarbeiterListe,
  monatsstand,
} from "@/app/actions/zeit";
import {
  heute as heuteBerechnen,
  monatsErster,
  monatsLetzter,
  montagDerWoche,
  tagPlus,
  wochentage,
} from "@/lib/zeit";
import Wochenansicht, { MonatsKopf } from "../../Wochenansicht";
import Zeitraumwahl from "../../Zeitraumwahl";

export const dynamic = "force-dynamic";

export default async function FremdeZeitenPage({
  params,
  searchParams,
}: PageProps<"/zeiterfassung/zeiten/[userId]">) {
  const person = await angemeldet();
  if (person?.rolle !== "admin") notFound();

  const { userId } = await params;
  const team = await mitarbeiterListe();
  const mitarbeiter = team.find((m) => m.user_id === userId);
  if (!mitarbeiter) notFound();

  const suche = await searchParams;
  const heute = heuteBerechnen();
  const tag =
    typeof suche.tag === "string" && /^\d{4}-\d{2}-\d{2}$/.test(suche.tag) ? suche.tag : heute;
  const ansicht = suche.ansicht === "monat" ? "monat" : "woche";

  const tage =
    ansicht === "woche"
      ? wochentage(montagDerWoche(tag))
      : Array.from(
          { length: Number(monatsLetzter(tag).slice(8)) },
          (_, i) => tagPlus(monatsErster(tag), i),
        );

  const [eintraege, stand] = await Promise.all([
    eintraegeLaden(userId, tage[0], tage[tage.length - 1]),
    monatsstand(userId, tag),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/zeiterfassung/uebersicht"
        className="text-sm text-ink/60 underline underline-offset-4"
      >
        ← Übersicht
      </Link>

      <h1 className="font-display mt-3 text-2xl font-semibold">{mitarbeiter.name}</h1>
      <p className="mt-1 text-sm text-ink/60">
        Änderungen hier werden als Korrektur durch die Leitung vermerkt.
        {mitarbeiter.stunden_pro_monat > 0
          ? " Die Monatsgrenze gilt für dich nicht – trag ein, was tatsächlich gearbeitet wurde."
          : ""}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MonatsKopf tagImMonat={tag} {...stand} />
      </div>

      <div className="mt-8">
        <Zeitraumwahl tag={tag} ansicht={ansicht} heute={heute} />
      </div>

      <div className="mt-4">
        <Wochenansicht userId={userId} tage={tage} eintraege={eintraege} heute={heute} />
      </div>
    </main>
  );
}
