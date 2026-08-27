import { redirect } from "next/navigation";
import { angemeldet, eintraegeLaden, monatsstand } from "@/app/actions/zeit";
import {
  heute as heuteBerechnen,
  monatsErster,
  monatsLetzter,
  montagDerWoche,
  tagPlus,
  wochentage,
} from "@/lib/zeit";
import Wochenansicht, { MonatsKopf } from "./Wochenansicht";
import Zeitraumwahl from "./Zeitraumwahl";

export const dynamic = "force-dynamic";

export default async function MeineZeitenPage({ searchParams }: PageProps<"/zeiterfassung">) {
  const person = await angemeldet();
  if (!person) redirect("/zeiterfassung/login");

  const params = await searchParams;
  const heute = heuteBerechnen();
  const tag = typeof params.tag === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.tag)
    ? params.tag
    : heute;
  const ansicht = params.ansicht === "monat" ? "monat" : "woche";

  const tage =
    ansicht === "woche"
      ? wochentage(montagDerWoche(tag))
      : Array.from(
          { length: Number(monatsLetzter(tag).slice(8)) },
          (_, i) => tagPlus(monatsErster(tag), i),
        );

  const [eintraege, stand] = await Promise.all([
    eintraegeLaden(person.user_id, tage[0], tage[tage.length - 1]),
    monatsstand(person.user_id, tag),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Meine Zeiten</h1>
      <p className="mt-1 text-sm text-ink/60">
        Trag ein, wann du gearbeitet hast. Urlaub, Krankheit und freie Tage gehören auch hier rein.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MonatsKopf tagImMonat={tag} {...stand} />
      </div>

      <div className="mt-8">
        <Zeitraumwahl tag={tag} ansicht={ansicht} heute={heute} />
      </div>

      <div className="mt-4">
        <Wochenansicht
          userId={person.user_id}
          tage={tage}
          eintraege={eintraege}
          heute={heute}
        />
      </div>
    </main>
  );
}
