import Link from "next/link";
import { notFound } from "next/navigation";
import {
  alsAdmin,
  eintraegeLaden,
  mitarbeiterListe,
  monatsfenster,
  urlaubskonto,
} from "@/lib/zeit-server";
import {
  gewaehlterMonat,
  gewaehlterTag,
  heute as heuteBerechnen,
  monatsBilanz,
} from "@/lib/zeit";
import Zeitplaner from "../../Zeitplaner";
import { MonatsKopf, UrlaubsKarte } from "../../Karten";

export const dynamic = "force-dynamic";

export default async function FremdeZeitenPage({
  params,
  searchParams,
}: PageProps<"/zeiterfassung/zeiten/[userId]">) {
  if (!(await alsAdmin())) notFound();

  const { userId } = await params;
  const mitarbeiter = (await mitarbeiterListe()).find(
    (m) => m.user_id === userId,
  );
  if (!mitarbeiter) notFound();

  const suche = await searchParams;
  const heute = heuteBerechnen();
  const monat = gewaehlterMonat(suche.monat, heute);
  const startTag = gewaehlterTag(suche.tag, monat);
  const jahr = Number(monat.slice(0, 4));
  const { von, bis } = monatsfenster(`${monat}-01`);

  const [eintraege, konto] = await Promise.all([
    eintraegeLaden(userId, von, bis),
    urlaubskonto(userId, jahr),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/zeiterfassung/uebersicht"
        className="text-sm text-ink/60 underline underline-offset-4"
      >
        ← Übersicht
      </Link>

      <h1 className="font-display mt-3 text-2xl font-semibold">
        {mitarbeiter.name}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Änderungen hier werden als Korrektur durch die Leitung vermerkt. Die
        Monatsgrenze gilt für dich nicht – trag ein, was tatsächlich gearbeitet
        wurde.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MonatsKopf
          tagImMonat={`${monat}-01`}
          bilanz={monatsBilanz(eintraege, monat)}
          grenzeStunden={mitarbeiter.stunden_pro_monat}
        />
        <UrlaubsKarte konto={konto} jahr={jahr} />
      </div>

      <div className="mt-8">
        <Zeitplaner
          userId={userId}
          monat={monat}
          eintraege={eintraege}
          heute={heute}
          startTag={startTag}
        />
      </div>
    </main>
  );
}
