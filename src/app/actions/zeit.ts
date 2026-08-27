"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { alsAdmin } from "@/lib/zeit-server";
import { LOGIN_DOMAIN, type Eintragstyp } from "@/lib/zeit";

export type LoginState = { error?: string };
export type Antwort = { ok: true; hinweis?: string } | { ok: false; fehler: string };

// --- Anmeldung -----------------------------------------------------------

export async function anmelden(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passwort = String(formData.get("passwort") ?? "");
  if (!email || !passwort) return { error: "Bitte Anmeldename und Passwort eingeben." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Die Anmeldung ist gerade nicht verfügbar." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwort });
  if (error) {
    console.error("Zeiterfassung-Anmeldung fehlgeschlagen", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    if (error.code === "email_not_confirmed") {
      return { error: "Dieses Konto ist noch nicht bestätigt. Bitte bei der Leitung melden." };
    }
    return { error: "Anmeldename oder Passwort ist falsch." };
  }
  if (!data.session) return { error: "Die Anmeldung konnte nicht abgeschlossen werden." };

  redirect("/zeiterfassung");
}

export async function abmelden() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/zeiterfassung/login");
}

// --- Zeiten schreiben ----------------------------------------------------

export type Zeile = {
  /** Vorhandener Eintrag; fehlt bei einer neuen Zeile. */
  id?: string;
  datum: string;
  typ: Eintragstyp;
  beginn: string;
  ende: string;
  pauseMinuten: number;
  notiz: string;
  loeschen?: boolean;
};

/** Land aus der Verbindung - grob und ohne Zutun des Geräts. */
async function landAusVerbindung(): Promise<string | null> {
  try {
    const kopf = await headers();
    return kopf.get("x-vercel-ip-country") ?? null;
  } catch {
    return null;
  }
}

function grenzeText(meldung: string): string | null {
  const treffer = /Monatsgrenze ueberschritten: ([\d.]+) von ([\d.]+)/.exec(meldung);
  return treffer
    ? `Das überschreitet die Monatsstunden: ${treffer[1]} von ${treffer[2]} Stunden. Bitte bei der Leitung melden.`
    : null;
}

/**
 * Speichert mehrere Zeilen auf einmal.
 *
 * Zeilenweise zu speichern hiess: je Zeile ein Serverbesuch, und bei einer
 * abgelehnten Zeile mitten in der Woche blieb der Rest ungespeichert, ohne
 * dass klar war welcher. Jetzt geht alles in einem Zug, und die Antwort sagt,
 * woran es lag.
 *
 * Bewusst kein "alles oder nichts": Wenn eine Zeile die Monatsgrenze reisst,
 * sollen die anderen trotzdem gespeichert sein - sonst tippt jemand seine
 * ganze Woche zweimal.
 */
export async function eintraegeSpeichern(
  userId: string,
  zeilen: Zeile[],
  zeitzone: string,
): Promise<Antwort> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, fehler: "Keine Verbindung." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, fehler: "Nicht angemeldet." };

  const fremd = userId !== user.id;
  const land = await landAusVerbindung();
  const fehler: string[] = [];
  let gespeichert = 0;

  for (const zeile of zeilen) {
    if (zeile.loeschen) {
      if (!zeile.id) continue;
      const { error } = await supabase.from("zeit_eintraege").delete().eq("id", zeile.id);
      if (error) fehler.push(`${zeile.datum}: Löschen ging nicht.`);
      else gespeichert += 1;
      continue;
    }

    const arbeit = zeile.typ === "arbeit";
    if (arbeit && (!zeile.beginn || !zeile.ende)) {
      fehler.push(`${zeile.datum}: Beginn und Ende fehlen.`);
      continue;
    }

    const werte = {
      user_id: userId,
      datum: zeile.datum,
      typ: zeile.typ,
      beginn: arbeit ? zeile.beginn : null,
      ende: arbeit ? zeile.ende : null,
      pause_minuten: arbeit ? Math.max(0, Math.round(zeile.pauseMinuten)) : 0,
      notiz: zeile.notiz.trim() || null,
      erfasst_zeitzone: zeitzone || null,
      erfasst_land: land,
      // Nur bei fremden Zeiten - sonst stünde bei jedem eigenen Eintrag eine
      // Korrektur, die keine ist.
      geaendert_von: fremd ? user.id : null,
      geaendert_at: fremd ? new Date().toISOString() : null,
    };

    const { error } = zeile.id
      ? await supabase.from("zeit_eintraege").update(werte).eq("id", zeile.id)
      : await supabase.from("zeit_eintraege").insert(werte);

    if (error) {
      const grenze = grenzeText(error.message);
      if (grenze) {
        fehler.push(`${zeile.datum}: ${grenze}`);
      } else if (error.code === "23505") {
        fehler.push(`${zeile.datum}: Für diesen Tag gibt es schon einen Status.`);
      } else if (error.code === "23514") {
        fehler.push(`${zeile.datum}: Ende muss nach Beginn liegen, Pause kürzer als die Schicht.`);
      } else {
        console.error("Zeiteintrag konnte nicht gespeichert werden:", error);
        fehler.push(`${zeile.datum}: Speichern ging nicht.`);
      }
      continue;
    }
    gespeichert += 1;
  }

  revalidatePath("/zeiterfassung");

  if (fehler.length) {
    return {
      ok: false,
      fehler:
        gespeichert > 0
          ? `${gespeichert} gespeichert, ${fehler.length} nicht:\n${fehler.join("\n")}`
          : fehler.join("\n"),
    };
  }
  return { ok: true, hinweis: gespeichert === 1 ? "Gespeichert." : `${gespeichert} Einträge gespeichert.` };
}

// --- Leitung -------------------------------------------------------------

export async function mitarbeiterAnlegen(
  name: string,
  login: string,
  passwort: string,
  rolle: "mitarbeiter" | "admin",
  stundenProMonat: number,
  urlaubstageProJahr: number,
): Promise<Antwort> {
  if (!(await alsAdmin())) return { ok: false, fehler: "Kein Zugriff." };

  const email = login.trim().toLowerCase();
  if (!name.trim()) return { ok: false, fehler: "Bitte einen Namen angeben." };
  if (!email.endsWith(`@${LOGIN_DOMAIN}`)) {
    return { ok: false, fehler: `Der Anmeldename muss auf @${LOGIN_DOMAIN} enden.` };
  }
  if (passwort.length < 8) {
    return { ok: false, fehler: "Das Startpasswort braucht mindestens 8 Zeichen." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, fehler: "Anlegen ist gerade nicht möglich." };

  // Sofort bestätigt: An eine erfundene Adresse kann keine Bestätigungsmail
  // gehen, das Konto käme sonst nie durch die Anmeldung.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: passwort,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Mitarbeiterkonto konnte nicht angelegt werden:", error);
    return {
      ok: false,
      fehler: error?.message.includes("already")
        ? "Diesen Anmeldenamen gibt es schon."
        : "Anlegen hat nicht geklappt.",
    };
  }

  const { error: profilFehler } = await admin.from("zeit_mitarbeiter").insert({
    user_id: data.user.id,
    name: name.trim(),
    rolle,
    stunden_pro_monat: Math.max(0, stundenProMonat),
    urlaubstage_pro_jahr: Math.max(0, urlaubstageProJahr),
  });

  if (profilFehler) {
    // Ohne Profil käme die Person nicht in den Bereich, das Konto wäre eine
    // Leiche. Also zurücknehmen statt halb angelegt stehen lassen.
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("Mitarbeiterprofil konnte nicht angelegt werden:", profilFehler);
    return { ok: false, fehler: "Anlegen hat nicht geklappt." };
  }

  revalidatePath("/zeiterfassung/team");
  return { ok: true, hinweis: `${name.trim()} angelegt.` };
}

export async function passwortSetzen(userId: string, passwort: string): Promise<Antwort> {
  if (!(await alsAdmin())) return { ok: false, fehler: "Kein Zugriff." };
  if (passwort.length < 8) {
    return { ok: false, fehler: "Das Passwort braucht mindestens 8 Zeichen." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, fehler: "Gerade nicht möglich." };

  const { error } = await admin.auth.admin.updateUserById(userId, { password: passwort });
  if (error) {
    console.error("Passwort konnte nicht gesetzt werden:", error);
    return { ok: false, fehler: "Ändern hat nicht geklappt." };
  }
  return { ok: true, hinweis: "Passwort geändert." };
}

export async function mitarbeiterAendern(
  userId: string,
  felder: {
    aktiv?: boolean;
    stunden_pro_monat?: number;
    urlaubstage_pro_jahr?: number;
    rolle?: "mitarbeiter" | "admin";
    name?: string;
  },
): Promise<Antwort> {
  const ich = await alsAdmin();
  if (!ich) return { ok: false, fehler: "Kein Zugriff." };

  // Wer sich selbst die Rechte oder den Zugang nimmt, sperrt sich aus - und
  // niemand sonst kann es zurücknehmen, wenn er der letzte Admin war.
  if (userId === ich.user_id && (felder.aktiv === false || felder.rolle === "mitarbeiter")) {
    return { ok: false, fehler: "Du kannst dir nicht selbst den Zugang entziehen." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, fehler: "Keine Verbindung." };

  const { error } = await supabase.from("zeit_mitarbeiter").update(felder).eq("user_id", userId);
  if (error) {
    console.error("Mitarbeiter konnte nicht geändert werden:", error);
    return { ok: false, fehler: "Ändern hat nicht geklappt." };
  }

  revalidatePath("/zeiterfassung/team");
  return { ok: true };
}
