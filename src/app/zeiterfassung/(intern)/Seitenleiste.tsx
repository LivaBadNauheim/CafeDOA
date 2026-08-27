"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { abmelden } from "@/app/actions/zeit";
import ThemaSchalter from "./Thema";
import type { Mitarbeiter } from "@/lib/zeit";

/**
 * Vier Menüpunkte statt sechs.
 *
 * Im Vorbild lagen „Mitarbeiter anlegen", „Passwort zurücksetzen" und
 * „Mitarbeiter verwalten" getrennt nebeneinander, obwohl man dabei immer
 * dieselbe Person im Kopf hat. Zusammengelegt zu „Team" ist der Weg kürzer
 * und man muss nicht wissen, unter welchem der drei Punkte etwas steckt.
 */
export default function Seitenleiste({ person }: { person: Mitarbeiter }) {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const admin = person.rolle === "admin";

  const punkte = [
    { href: "/zeiterfassung", label: "Meine Zeiten" },
    ...(admin
      ? [
          { href: "/zeiterfassung/uebersicht", label: "Übersicht" },
          { href: "/zeiterfassung/team", label: "Team" },
          { href: "/zeiterfassung/export", label: "Export" },
        ]
      : []),
  ];

  const inhalt = (
    <>
      <div className="flex items-center gap-3 text-ink">
        <Logo markOnly />
        <div>
          <p className="text-sm font-semibold leading-tight">Zeiterfassung</p>
          <p className="text-xs text-ink/55">Café DOA</p>
        </div>
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="font-medium">{person.name}</p>
        <p className="text-sm text-ink/55">{admin ? "Leitung" : "Mitarbeiter"}</p>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {punkte.map((punkt) => {
          const aktiv =
            punkt.href === "/zeiterfassung" ? pfad === punkt.href : pfad.startsWith(punkt.href);
          return (
            <Link
              key={punkt.href}
              href={punkt.href}
              onClick={() => setOffen(false)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                aktiv ? "bg-green text-auf-green" : "text-ink hover:bg-ink/5"
              }`}
            >
              {punkt.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <ThemaSchalter />
      </div>

      <form action={abmelden} className="mt-2">
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-terracotta hover:bg-terracotta/5"
        >
          Abmelden
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Auf dem Handy zusammengeklappt - die Leiste haette dort die halbe
          Anzeige belegt, und getippt wird hier in eine Tabelle. */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-cream px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 text-ink">
          <Logo markOnly />
          <span className="text-sm font-semibold">Zeiterfassung</span>
        </div>
        <button
          type="button"
          onClick={() => setOffen(!offen)}
          className="rounded-lg px-3 py-2 text-sm font-medium"
          aria-expanded={offen}
        >
          {offen ? "Schließen" : "Menü"}
        </button>
      </div>

      {offen && (
        <div className="border-b border-ink/10 bg-cream px-5 py-5 lg:hidden">{inhalt}</div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-cream px-5 py-6 lg:block">
        {inhalt}
      </aside>
    </>
  );
}
