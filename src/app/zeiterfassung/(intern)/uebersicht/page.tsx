import Link from "next/link";
import { notFound } from "next/navigation";
import {
  angemeldet,
  alleEintraege,
  dashboardZahlen,
  mitarbeiterListe,
} from "@/app/actions/zeit";
import { heute as heuteBerechnen, monatName, monatsErster, stunden } from "@/lib/zeit";

export const dynamic = "force-dynamic";

export default async function UebersichtPage() {
  const person = await angemeldet();
  if (person?.rolle !== "admin") notFound();

  const heute = heuteBerechnen();
  const [zahlen, team, eintraege] = await Promise.all([
    dashboardZahlen(heute),
    mitarbeiterListe(),
    alleEintraege({ von: monatsErster(heute), bis: heute }),
  ]);
  if (!zahlen) notFound();

  const minutenJePerson = new Map<string, number>();
  for (const eintrag of eintraege) {
    minutenJePerson.set(
      eintrag.user_id,
      (minutenJePerson.get(eintrag.user_id) ?? 0) + eintrag.minuten,
    );
  }

  const kennzahlen = [
    { label: "Stunden im Monat", wert: `${stunden(zahlen.minutenGesamt)} Std.` },
    { label: "Aktive Mitarbeiter", wert: String(zahlen.aktive) },
    { label: "Inaktiv", wert: String(zahlen.inaktive) },
    { label: "Erfasste Tage", wert: String(zahlen.eintraege) },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Übersicht</h1>
      <p className="mt-1 text-sm text-ink/60">
        {monatName(heute)}, bis heute.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kennzahlen.map((kennzahl) => (
          <div key={kennzahl.label} className="rounded-2xl border border-ink/10 bg-cream p-4">
            <dd className="font-display text-2xl font-semibold leading-none">{kennzahl.wert}</dd>
            <dt className="mt-1.5 text-xs text-ink/55">{kennzahl.label}</dt>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 font-display text-lg font-semibold">Stunden je Mitarbeiter</h2>
      <p className="mt-1 text-sm text-ink/60">
        Zum Bearbeiten auf eine Zeile tippen.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
        {team.filter((m) => m.aktiv).length === 0 && (
          <p className="px-4 py-6 text-sm text-ink/60">Noch niemand angelegt.</p>
        )}
        {team
          .filter((m) => m.aktiv)
          .map((mitarbeiter) => {
            const minuten = minutenJePerson.get(mitarbeiter.user_id) ?? 0;
            const grenze = mitarbeiter.stunden_pro_monat * 60;
            const anteil = grenze > 0 ? Math.min(1, minuten / grenze) : 0;
            return (
              <Link
                key={mitarbeiter.user_id}
                href={`/zeiterfassung/zeiten/${mitarbeiter.user_id}`}
                className="flex items-center gap-4 border-b border-ink/8 px-4 py-3 last:border-b-0 hover:bg-ink/5"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{mitarbeiter.name}</span>

                {grenze > 0 && (
                  <span className="hidden h-2 w-32 overflow-hidden rounded-full bg-ink/10 sm:block">
                    <span
                      className={`block h-full rounded-full ${
                        anteil >= 0.9 ? "bg-terracotta" : "bg-green"
                      }`}
                      style={{ width: `${anteil * 100}%` }}
                    />
                  </span>
                )}

                <span className="shrink-0 font-mono text-sm">
                  <span className="font-semibold">{stunden(minuten)}</span>
                  {grenze > 0 && (
                    <span className="text-ink/45"> / {stunden(grenze)}</span>
                  )}
                </span>
              </Link>
            );
          })}
      </div>

      {zahlen.top.length > 0 && (
        <p className="mt-6 text-sm text-ink/55">
          Die meisten Stunden diesen Monat:{" "}
          {zahlen.top.map((eintrag) => `${eintrag.name} (${stunden(eintrag.minuten)})`).join(" · ")}
        </p>
      )}
    </main>
  );
}
