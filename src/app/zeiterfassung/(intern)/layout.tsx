import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { abmelden } from "@/app/actions/zeit";
import { zugang } from "@/lib/zeit-server";
import { LOGIN_DOMAIN } from "@/lib/zeit";
import Logo from "@/components/Logo";
import Seitenleiste from "./Seitenleiste";
import { ThemaSkript } from "./Thema";

export const metadata: Metadata = {
  title: "Zeiterfassung – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Sackgasse mit Erklärung statt einer Schleife zurück zur Anmeldung. */
function Hinweis({ titel, text, email }: { titel: string; text: string; email: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-green px-5 py-16">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 text-center shadow-xl shadow-ink/20">
        <div className="flex justify-center text-ink">
          <Logo />
        </div>
        <h1 className="font-display mt-6 text-xl font-semibold text-ink">{titel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{text}</p>
        <p className="mt-4 rounded-xl bg-cream-soft px-4 py-3 font-mono text-xs break-all text-ink-soft">
          {email}
        </p>
        <form action={abmelden}>
          <button
            type="submit"
            className="mt-6 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
          >
            Abmelden
          </button>
        </form>
      </div>
    </main>
  );
}

/**
 * Der Riegel für den ganzen Bereich.
 *
 * Jede Seite darunter setzt eine angemeldete Person voraus - der Riegel
 * gehört deshalb hierher und nicht in jede einzelne Datei, wo er beim
 * nächsten Hinzufügen vergessen würde.
 */
export default async function InternLayout({ children }: LayoutProps<"/zeiterfassung">) {
  const ergebnis = await zugang();

  if (ergebnis.status === "anonym") redirect("/zeiterfassung/login");

  if (ergebnis.status === "ohne-profil") {
    return (
      <Hinweis
        titel="Konto noch nicht freigeschaltet"
        text={`Die Anmeldung hat geklappt, aber zu diesem Konto gehört noch kein Mitarbeiterprofil. Die Leitung muss es im Bereich Team anlegen – oder beim allerersten Konto von Hand in der Datenbank. Anmeldenamen enden auf @${LOGIN_DOMAIN}.`}
        email={ergebnis.email}
      />
    );
  }

  if (ergebnis.status === "gesperrt") {
    return (
      <Hinweis
        titel="Zugang deaktiviert"
        text="Dieses Konto ist auf inaktiv gesetzt. Die Leitung kann es im Bereich Team wieder aktivieren."
        email={ergebnis.email}
      />
    );
  }

  return (
    <>
      <ThemaSkript />
      <div className="flex min-h-dvh flex-col bg-cream-soft lg:flex-row">
        <Seitenleiste person={ergebnis.person} />
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>
    </>
  );
}
