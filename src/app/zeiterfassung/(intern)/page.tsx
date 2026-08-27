import { redirect } from "next/navigation";
import {
  angemeldet,
  eintraegeLaden,
  monatsfenster,
  urlaubskonto,
} from "@/lib/zeit-server";
import {
  gewaehlterMonat,
  gewaehlterTag,
  heute as heuteBerechnen,
  monatsBilanz,
} from "@/lib/zeit";
import Zeitplaner from "./Zeitplaner";
import { MonatsKopf, UrlaubsKarte } from "./Karten";

export const dynamic = "force-dynamic";

export default async function MeineZeitenPage({
  searchParams,
}: PageProps<"/zeiterfassung">) {
  const person = await angemeldet();
  if (!person) redirect("/zeiterfassung/login");

  const params = await searchParams;
  const heute = heuteBerechnen();
  const monat = gewaehlterMonat(params.monat, heute);
  const startTag = gewaehlterTag(params.tag, monat);
  const { von, bis } = monatsfenster(`${monat}-01`);

  // Immer das ganze Monatsfenster auf einmal. Vorher lud jede Woche neu; jetzt
  // laufen Blättern und Kalendersprung im Browser, ohne Serverbesuch.
  const [eintraege, konto] = await Promise.all([
    eintraegeLaden(person.user_id, von, bis),
    urlaubskonto(person.user_id, Number(monat.slice(0, 4))),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Meine Zeiten</h1>
      <p className="mt-1 text-sm text-ink/60">
        Trag ein, wann du gearbeitet hast. Urlaub, Krankheit und freie Tage
        gehören auch hier rein.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MonatsKopf
          tagImMonat={`${monat}-01`}
          bilanz={monatsBilanz(eintraege, monat)}
          grenzeStunden={person.stunden_pro_monat}
        />
        <UrlaubsKarte konto={konto} jahr={Number(monat.slice(0, 4))} />
      </div>

      <div className="mt-8">
        <Zeitplaner
          userId={person.user_id}
          monat={monat}
          eintraege={eintraege}
          heute={heute}
          startTag={startTag}
        />
      </div>
    </main>
  );
}
