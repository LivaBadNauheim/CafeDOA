import { monatName, stunden, type Monatsbilanz, type Urlaubskonto } from "@/lib/zeit";

/** Stunden des Monats gegen die Vertragsgrenze. */
export function MonatsKopf({
  tagImMonat,
  bilanz,
  grenzeStunden,
}: {
  tagImMonat: string;
  bilanz: Monatsbilanz;
  grenzeStunden: number;
}) {
  const grenzeMinuten = grenzeStunden * 60;
  const anteil = grenzeMinuten > 0 ? Math.min(1, bilanz.minuten / grenzeMinuten) : 0;
  const knapp = grenzeMinuten > 0 && anteil >= 0.9;

  return (
    <section className="rounded-2xl border border-ink/10 bg-cream p-5">
      <p className="text-sm text-ink/55">{monatName(tagImMonat)}</p>
      <p className="mt-1 font-display text-4xl font-semibold leading-none">
        {stunden(bilanz.minuten)}
        <span className="ml-2 text-lg font-normal text-ink/50">Std.</span>
      </p>

      {grenzeStunden > 0 && (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full ${knapp ? "bg-terracotta" : "bg-green"}`}
              style={{ width: `${anteil * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            von {stunden(grenzeMinuten)} Std. im Vertrag
            {knapp && <span className="ml-2 font-medium text-terracotta">wird knapp</span>}
          </p>
        </>
      )}

      <p className="mt-4 text-sm text-ink/60">
        Urlaub {bilanz.urlaub} · Krank {bilanz.krank} · Frei {bilanz.frei}
      </p>
    </section>
  );
}

/**
 * Der Urlaubsstand des Jahres.
 *
 * Gezählt werden Kalendertage mit dem Status „Urlaub", nicht Einträge - ein
 * Tag kann inzwischen mehrere Zeilen haben. Bewusst für beide Rollen sichtbar:
 * Wer wissen will, wie viele Tage noch offen sind, soll nicht nachfragen
 * müssen.
 */
export function UrlaubsKarte({ konto, jahr }: { konto: Urlaubskonto | null; jahr: number }) {
  const kontingent = konto?.kontingent ?? 0;
  const genommen = konto?.genommen ?? 0;
  const rest = Math.max(0, kontingent - genommen);
  const anteil = kontingent > 0 ? Math.min(1, genommen / kontingent) : 0;

  return (
    <section className="rounded-2xl border border-ink/10 bg-cream p-5">
      <p className="text-sm text-ink/55">Urlaub {jahr}</p>

      {kontingent > 0 ? (
        <>
          <p className="mt-1 font-display text-4xl font-semibold leading-none">
            {zahl(rest)}
            <span className="ml-2 text-lg font-normal text-ink/50">
              {rest === 1 ? "Tag offen" : "Tage offen"}
            </span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-gold" style={{ width: `${anteil * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            {genommen} von {zahl(kontingent)} Tagen genommen
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 font-display text-4xl font-semibold leading-none text-ink/35">–</p>
          <p className="mt-4 text-sm text-ink/60">
            Für dieses Jahr sind noch keine Urlaubstage hinterlegt. Die Leitung trägt sie im
            Bereich Team ein.
          </p>
        </>
      )}
    </section>
  );
}

/** 25 statt 25,0 - halbe Tage sollen aber halbe bleiben. */
function zahl(wert: number): string {
  return Number.isInteger(wert) ? String(wert) : wert.toFixed(1).replace(".", ",");
}
