"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Die Anmeldung ist gerade nicht verfügbar." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // The message shown stays vague - naming which half was wrong tells an
    // attacker whether an address is a real staff account - but the cause
    // belongs in the logs, otherwise a failed login is undiagnosable.
    console.error("Staff sign-in failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    // Unconfirmed accounts are a setup mistake rather than a wrong password,
    // and the guess-protection argument does not apply once credentials
    // have already been accepted.
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Dieses Konto ist noch nicht bestätigt. Bitte in Supabase unter Authentication → Users bestätigen.",
      };
    }

    return { error: "E-Mail oder Passwort ist falsch." };
  }

  if (!data.session) {
    console.error("Staff sign-in returned no session");
    return { error: "Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut." };
  }

  redirect("/reservierung");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/reservierung/login");
}

export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled";

export async function setReservationStatus(id: string, status: ReservationStatus) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Keine Verbindung zur Datenbank." };

  // The form is only rendered behind a login, but a Server Action is a public
  // endpoint - so re-check the session here rather than trusting the caller.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("reservations")
    .update({ status, handled_by: user.id, handled_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Reservation status update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "Die Änderung konnte nicht gespeichert werden." };
  }

  refresh();
  return {};
}
