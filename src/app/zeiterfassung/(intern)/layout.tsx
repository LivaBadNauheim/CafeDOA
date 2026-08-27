import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { angemeldet } from "@/app/actions/zeit";
import Seitenleiste from "./Seitenleiste";

export const metadata: Metadata = {
  title: "Zeiterfassung – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Der Riegel für den ganzen Bereich.
 *
 * Jede Seite darunter setzt eine angemeldete Person voraus - der Riegel
 * gehört deshalb hierher und nicht in jede einzelne Datei, wo er beim
 * nächsten Hinzufügen vergessen würde.
 */
export default async function InternLayout({ children }: LayoutProps<"/zeiterfassung">) {
  const person = await angemeldet();
  if (!person) redirect("/zeiterfassung/login");

  return (
    <div className="flex min-h-dvh flex-col bg-cream-soft lg:flex-row">
      <Seitenleiste person={person} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
