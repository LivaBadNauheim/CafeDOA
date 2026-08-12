import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { praemienLesen } from "@/app/actions/punkte";
import { punkteProgrammAktiv } from "@/lib/punkte";
import PunkteTresen from "./PunkteTresen";

export const metadata: Metadata = {
  title: "Punkte – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PunkteStaffPage() {
  if (!punkteProgrammAktiv()) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/reservierung/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reservierung/login");

  return <PunkteTresen praemien={await praemienLesen()} />;
}
