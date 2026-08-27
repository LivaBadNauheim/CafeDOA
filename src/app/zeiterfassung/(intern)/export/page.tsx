import { notFound } from "next/navigation";
import { angemeldet, mitarbeiterListe } from "@/app/actions/zeit";
import { heute, monatsErster, monatsLetzter } from "@/lib/zeit";
import ExportForm from "./ExportForm";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const person = await angemeldet();
  if (person?.rolle !== "admin") notFound();

  const tag = heute();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Export</h1>
      <p className="mt-1 text-sm text-ink/60">
        Zeitraum wählen, Datei erstellen – vorbelegt ist der laufende Monat.
      </p>
      <ExportForm
        team={await mitarbeiterListe()}
        vorschlagVon={monatsErster(tag)}
        vorschlagBis={monatsLetzter(tag)}
      />
    </main>
  );
}
