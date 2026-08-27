import { notFound } from "next/navigation";
import { alsAdmin, mitarbeiterListe } from "@/lib/zeit-server";
import TeamVerwaltung from "./TeamVerwaltung";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const person = await alsAdmin();
  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Team</h1>
      <p className="mt-1 text-sm text-ink/60">
        Anlegen, Monatsstunden und Urlaubstage ändern, Passwort setzen, deaktivieren – alles hier.
      </p>
      <div className="mt-6">
        <TeamVerwaltung team={await mitarbeiterListe()} ichSelbst={person.user_id} />
      </div>
    </main>
  );
}
