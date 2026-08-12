import { notFound, redirect } from "next/navigation";
import { karteVerbinden } from "@/app/actions/punkte";
import { punkteProgrammAktiv } from "@/lib/punkte";

export const dynamic = "force-dynamic";

/**
 * Ziel des QR-Codes auf der Kundenkarte.
 *
 * Damit genügt die Kamera-App des Handys, um die Karte mit dem Gerät zu
 * verbinden - der Gast braucht dafür weder unsere Seite offen noch eine App.
 */
export default async function KartePage({ params }: PageProps<"/punkte/[token]">) {
  if (!punkteProgrammAktiv()) notFound();

  const { token } = await params;
  await karteVerbinden(token);
  redirect("/punkte");
}
