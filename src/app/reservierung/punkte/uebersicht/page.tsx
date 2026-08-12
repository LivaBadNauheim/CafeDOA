import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { kartenUebersicht } from "@/app/actions/punkte";
import { cafeTag, punkteProgrammAktiv } from "@/lib/punkte";
import Uebersicht from "./Uebersicht";

export const metadata: Metadata = {
  title: "Punkte-Übersicht – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UebersichtPage() {
  if (!punkteProgrammAktiv()) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/reservierung/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reservierung/login");

  // "Heute" kommt vom Server und in Café-Zeit: Sonst rechnet ein Gerät mit
  // falsch gestellter Uhr die Wochen daneben.
  return <Uebersicht karten={await kartenUebersicht()} heute={cafeTag(new Date())} />;
}
