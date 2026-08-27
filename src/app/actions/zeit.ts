"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  monatsErster,
  monatsLetzter,
  tagPlus,
  LOGIN_DOMAIN,
  type Eintragstyp,
  type Mitarbeiter,
  type ZeitEintrag,
} from "@/lib/zeit";

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

/**
 * Wer ist angemeldet - und darf diese Person hier überhaupt sein?
 *
 * Ein Supabase-Konto allein genügt nicht: Erst der Eintrag in
 * `zeit_mitarbeiter` macht jemanden zum Nutzer dieses Bereichs. Ein
 * deaktiviertes Konto kommt hier ebenfalls nicht durch.
 */
export type Zugang =
  | { status: "anonym" }
  | { status: "ohne-profil"; email: string }
  | { status: "gesperrt"; email: string }
  | { status: "ok"; person: Mitarbeiter };

/**
 * Wer ist angemeldet - und darf diese Person hier überhaupt sein?
 *
 * Gibt die drei Fehlerfälle einzeln zurück, statt sie zu einem "nein"
 * zusammenzufassen. Vorher landete jeder davon wortlos wieder auf der
 * Anmeldung: Wer richtige Zugangsdaten eingibt und trotzdem zurückgeworfen
 * wird, kann unmöglich erraten, dass nur der Profileintrag fehlt.
 */
export async function zugang(): Promise<Zugang> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "anonym" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonym" };

  const email = user.email ?? "";
  const { data, error } = await supabase
    .from("zeit_mitarbeiter")
    .select("user_id, name, rolle, stunden_pro_monat, aktiv")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Zeiterfassung: Profil konnte nicht gelesen werden", {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return { status: "ohne-profil", email };
  }
  if (!data) return { status: "ohne-profil", email };
  if (!data.aktiv) return { status: "gesperrt", email };

  return { status: "ok", person: data as Mitarbeiter };
}

export async function angemeldet(): Promise<Mitarbeiter | null> {
  const ergebnis = await zugang();
  return ergebnis.status === "ok" ? ergebnis.person : null;
}

// --- Zeiten lesen --------------------------------------------------------

export async function eintraegeLaden(
  userId: string,
  von: string,
  bis: string,
): Promise<ZeitEintrag[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  // Kein zusaetzlicher Rechte-Check: Die Datenbank gibt fremde Zeilen ohnehin
  // nicht heraus, egal welche Kennung hier steht.
  const { data, error } = await supabase
    .from("zeit_uebersicht")
    .select("*")
    .eq("user_id", userId)
    .gte("datum", von)
    .lte("datum", bis)
    .order("datum");

  if (error) {
    console.error("Zeiten konnten nicht geladen werden:", error);
    return [];
  }
  return (data as ZeitEintrag[] | null) ?? [];
}

export type Monatsstand = {
  minuten: number;
  urlaub: number;
  krank: number;
  frei: number;
  grenzeStunden: number;
};

export async function monatsstand(userId: string, tagImMonat: string): Promise<Monatsstand> {
  const supabase = await createSupabaseServerClient();
  const leer = { minuten: 0, urlaub: 0, krank: 0, frei: 0, grenzeStunden: 0 };
  if (!supabase) return leer;

  const [eintraege, profil] = await Promise.all([
    eintraegeLaden(userId, monatsErster(tagImMonat), monatsLetzter(tagImMonat)),
    supabase
      .from("zeit_mitarbeiter")
      .select("stunden_pro_monat")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    minuten: eintraege.reduce((summe, e) => summe + e.minuten, 0),
    urlaub: eintraege.filter((e) => e.typ === "urlaub").length,
    krank: eintraege.filter((e) => e.typ === "krank").length,
    frei: eintraege.filter((e) => e.typ === "frei").length,
    grenzeStunden: Number(profil.data?.stunden_pro_monat ?? 0),
  };
}

// --- Zeiten schreiben ----------------------------------------------------

export async function eintragSpeichern(
  userId: string,
  datum: string,
  typ: Eintragstyp,
  beginn: string,
  ende: string,
  pauseMinuten: number,
  notiz: string,
): Promise<Antwort> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, fehler: "Keine Verbindung." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, fehler: "Nicht angemeldet." };

  const arbeit = typ === "arbeit";
  if (arbeit && (!beginn || !ende)) {
    return { ok: false, fehler: "Bitte Beginn und Ende angeben." };
  }

  const zeile = {
    user_id: userId,
    datum,
    typ,
    beginn: arbeit ? beginn : null,
    ende: arbeit ? ende : null,
    pause_minuten: arbeit ? Math.max(0, Math.round(pauseMinuten)) : 0,
    notiz: notiz.trim() || null,
    // Nur setzen, wenn jemand fremde Zeiten ändert - sonst stünde bei jedem
    // eigenen Eintrag eine Korrektur, die keine ist.
    geaendert_von: userId === user.id ? null : user.id,
    geaendert_at: userId === user.id ? null : new Date().toISOString(),
  };

  const { error } = await supabase
    .from("zeit_eintraege")
    .upsert(zeile, { onConflict: "user_id,datum" });

  if (error) {
    // 23514 = Prüfregel verletzt. Das ist hier fast immer die Monatsgrenze,
    // und deren Text ist für den Mitarbeiter die eigentliche Information.
    if (error.code === "23514" || error.message.includes("Monatsgrenze")) {
      const treffer = /Monatsgrenze ueberschritten: ([\d.]+) von ([\d.]+)/.exec(error.message);
      return {
        ok: false,
        fehler: treffer
          ? `Das überschreitet deine Monatsstunden: ${treffer[1]} von ${treffer[2]} Stunden. Bitte bei der Leitung melden.`
          : "Die Eingabe passt nicht: Ende muss nach Beginn liegen, und die Pause kürzer sein als die Schicht.",
      };
    }
    console.error("Zeiteintrag konnte nicht gespeichert werden:", error);
    return { ok: false, fehler: "Speichern hat nicht geklappt." };
  }

  revalidatePath("/zeiterfassung");
  return { ok: true };
}

export async function eintragLoeschen(id: string): Promise<Antwort> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, fehler: "Keine Verbindung." };

  const { error } = await supabase.from("zeit_eintraege").delete().eq("id", id);
  if (error) {
    console.error("Zeiteintrag konnte nicht gelöscht werden:", error);
    return { ok: false, fehler: "Löschen hat nicht geklappt." };
  }

  revalidatePath("/zeiterfassung");
  return { ok: true };
}

// --- Leitung -------------------------------------------------------------

async function alsAdmin() {
  const person = await angemeldet();
  return person?.rolle === "admin" ? person : null;
}

export async function mitarbeiterListe(): Promise<Mitarbeiter[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("zeit_mitarbeiter")
    .select("user_id, name, rolle, stunden_pro_monat, aktiv")
    .order("name");

  return (data as Mitarbeiter[] | null) ?? [];
}

export async function mitarbeiterAnlegen(
  name: string,
  login: string,
  passwort: string,
  rolle: "mitarbeiter" | "admin",
  stundenProMonat: number,
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
  });

  if (profilFehler) {
    // Ohne Profil kaeme die Person nicht in den Bereich, das Konto waere eine
    // Leiche. Also zuruecknehmen statt halb angelegt stehen lassen.
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
  felder: { aktiv?: boolean; stunden_pro_monat?: number; rolle?: "mitarbeiter" | "admin"; name?: string },
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

// --- Auswertung für die Leitung ------------------------------------------

export type Zeitraum = { von: string; bis: string };

export async function alleEintraege(zeitraum: Zeitraum): Promise<ZeitEintrag[]> {
  if (!(await alsAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("zeit_uebersicht")
    .select("*")
    .gte("datum", zeitraum.von)
    .lte("datum", zeitraum.bis)
    .order("name")
    .order("datum")
    .limit(20_000);

  if (error) {
    console.error("Auswertung konnte nicht geladen werden:", error);
    return [];
  }
  return (data as ZeitEintrag[] | null) ?? [];
}

/** Kennzahlen fürs Dashboard: laufender Monat bis heute. */
export async function dashboardZahlen(bisTag: string) {
  if (!(await alsAdmin())) return null;

  const [team, eintraege] = await Promise.all([
    mitarbeiterListe(),
    alleEintraege({ von: monatsErster(bisTag), bis: bisTag }),
  ]);

  const jeMitarbeiter = new Map<string, { name: string; minuten: number }>();
  for (const eintrag of eintraege) {
    const stand = jeMitarbeiter.get(eintrag.user_id) ?? { name: eintrag.name, minuten: 0 };
    stand.minuten += eintrag.minuten;
    jeMitarbeiter.set(eintrag.user_id, stand);
  }

  return {
    minutenGesamt: eintraege.reduce((summe, e) => summe + e.minuten, 0),
    aktive: team.filter((m) => m.aktiv).length,
    inaktive: team.filter((m) => !m.aktiv).length,
    eintraege: eintraege.length,
    top: [...jeMitarbeiter.values()].sort((a, b) => b.minuten - a.minuten).slice(0, 3),
    naechsterMonat: tagPlus(monatsLetzter(bisTag), 1),
  };
}
