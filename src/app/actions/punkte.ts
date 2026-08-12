"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { pruefeBelegCode } from "@/lib/tse-beleg";
import {
  GUTSCHRIFT_MAX,
  PUNKTE_REGELN,
  cafeTag,
  neuerToken,
  punkteProgrammAktiv,
  tokenNormalisieren,
  TOKEN_MUSTER,
  type Praemie,
  type PunkteStand,
} from "@/lib/punkte";

/**
 * Die Karte, nicht der Browser, ist die Identität.
 *
 * Als serverseitig gesetztes Cookie und nicht im Browser-Speicher: Safari
 * löscht auf dem iPhone von Skripten geschriebene Daten nach sieben Tagen
 * ohne Besuch. Ein Gast, der zwei Wochen nicht scannt, wäre danach ein
 * Fremder. Und selbst wenn das Cookie verlorengeht, genügt ein Blick auf die
 * Karte, um das Gerät wieder zu verbinden.
 */
const COOKIE = "doa_punkte";
const COOKIE_MAXAGE = 60 * 60 * 24 * 365;

export type PunkteAktion =
  | { status: "ok"; meldung: string; punkte?: number }
  | { status: "fehler"; meldung: string };

async function tokenAusCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

async function cookieSetzen(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAXAGE,
    path: "/",
  });
}

/**
 * Legt eine Karte ohne Zutun des Cafés an.
 *
 * Ich hatte das zuerst gesperrt, aus Sorge vor erfundenen Konten - die Sorge
 * war unbegründet: Punkte entstehen ausschließlich aus signierten Bons, und
 * jeder Bon lässt sich genau einmal einreichen. Wer sich zehn Konten anlegt,
 * hat zehn leere Konten; ein Bon auf mehrere zu verteilen geht nicht. Die
 * Sperre kostete also nur Gäste, die abends um zehn eine Karte wollen.
 */
export async function karteSelbstAnlegen(vorname: string): Promise<
  { status: "ok"; token: string } | { status: "fehler"; meldung: string }
> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const token = neuerToken();
  const { error } = await supabase
    .from("punkte_konten")
    .insert({ token, vorname: vorname.trim().slice(0, 40) || null });

  if (error) {
    console.error("Karte konnte nicht angelegt werden:", error);
    return { status: "fehler", meldung: "Hat nicht geklappt. Bitte nochmal." };
  }

  await cookieSetzen(token);
  revalidatePath("/punkte");
  return { status: "ok", token };
}

/** Verbindet dieses Gerät mit einer bestehenden Karte. */
export async function karteVerbinden(rohToken: string): Promise<boolean> {
  if (!punkteProgrammAktiv()) return false;

  const token = tokenNormalisieren(rohToken);
  if (!TOKEN_MUSTER.test(token)) return false;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("punkte_konten")
    .select("token")
    .eq("token", token)
    .maybeSingle();

  // Nur bestehende Karten: Ein ausgedachter Code soll nicht stillschweigend
  // zu einem Konto werden - wer neu anfaengt, nimmt "Karte anlegen".
  if (!data) return false;

  await cookieSetzen(token);
  return true;
}

export async function standLesen(): Promise<PunkteStand | null> {
  if (!punkteProgrammAktiv()) return null;

  const token = await tokenAusCookie();
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("punkte_stand")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  return (data as PunkteStand | null) ?? null;
}

export async function praemienLesen(): Promise<Praemie[]> {
  if (!punkteProgrammAktiv()) return [];

  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("punkte_praemien")
    .select("id, name, punkte")
    .eq("aktiv", true)
    .order("sortierung")
    .order("punkte");

  return (data as Praemie[] | null) ?? [];
}

/**
 * Nimmt den Inhalt des QR-Codes vom Kassenbon entgegen.
 *
 * Die Reihenfolge der Prüfungen ist Absicht: Zuerst die Signatur, weil ohne
 * sie alle anderen Angaben - Betrag, Zeit, Kasse - beliebig behauptet sein
 * könnten und jede Prüfung darauf ins Leere liefe.
 */
export async function belegEinreichen(
  qrInhalt: string,
  manuell = false,
): Promise<PunkteAktion> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };

  const token = await tokenAusCookie();
  if (!token) {
    return { status: "fehler", meldung: "Scan zuerst deine Karte, dann den Bon." };
  }

  const geprueft = pruefeBelegCode(qrInhalt ?? "");
  if (!geprueft.ok) return { status: "fehler", meldung: geprueft.grund };
  const beleg = geprueft.beleg;

  if (cafeTag(beleg.zeitpunkt) !== cafeTag(new Date())) {
    return { status: "fehler", meldung: `Bons lassen sich nur ${PUNKTE_REGELN.fensterLabel} einreichen.` };
  }
  if (beleg.punktefaehigCent > PUNKTE_REGELN.maxBetragCent) {
    return { status: "fehler", meldung: "Für diesen Bon fragst du bitte am Tresen." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { status: "fehler", meldung: "Gerade nicht möglich. Bitte später nochmal." };

  const { data: konto } = await supabase
    .from("punkte_konten")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!konto) return { status: "fehler", meldung: "Diese Karte kennen wir nicht." };

  const { error } = await supabase.from("punkte_belege").insert({
    konto_id: konto.id,
    beleg_schluessel: beleg.belegSchluessel,
    betrag_cent: beleg.punktefaehigCent,
    brutto_cent: beleg.bruttoGesamtCent,
    bon_zeit: beleg.zeitpunkt.toISOString(),
    manuell,
  });

  if (error) {
    // 23505 = Eindeutigkeitsregel verletzt, also schon eingereicht. Das ist
    // kein Fehler, sondern der Normalfall bei einem zweiten Versuch.
    if (error.code === "23505") {
      return { status: "fehler", meldung: "Diesen Bon hast du schon eingereicht." };
    }
    console.error("Beleg konnte nicht gespeichert werden:", error);
    return { status: "fehler", meldung: "Gerade nicht möglich. Bitte später nochmal." };
  }

  const neuePunkte = Math.floor(beleg.punktefaehigCent / 100);
  revalidatePath("/punkte");
  return {
    status: "ok",
    meldung: neuePunkte === 1 ? "1 Punkt gutgeschrieben." : `${neuePunkte} Punkte gutgeschrieben.`,
    punkte: neuePunkte,
  };
}

// --- Mitarbeiter ---------------------------------------------------------

/**
 * Läuft über die Sitzung des Mitarbeiters, nicht über den Admin-Zugang:
 * So entscheidet die Datenbank selbst, ob jemand zum Team gehört, und beim
 * Einlösen wird festgehalten, wer es war.
 */
export async function kontoSuchen(suche: string): Promise<PunkteStand[]> {
  if (!punkteProgrammAktiv()) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const begriff = suche.trim();
  if (begriff.length < 2) return [];

  const token = tokenNormalisieren(begriff);
  const { data } = await supabase
    .from("punkte_stand")
    .select("*")
    .or(`token.eq.${token},vorname.ilike.%${begriff.replace(/[%,()]/g, "")}%`)
    .limit(10);

  return (data as PunkteStand[] | null) ?? [];
}

/**
 * Gibt eine neue Karte aus. Nur das Café kann das - deshalb legt
 * `karteVerbinden` unbekannte Codes nicht selbst an: Sonst dächte sich jeder
 * einen aus und sammelte darauf.
 */
export async function karteAusgeben(vorname: string): Promise<
  { status: "ok"; token: string } | { status: "fehler"; meldung: string }
> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "fehler", meldung: "Nicht angemeldet." };

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const { data: team } = await supabase.from("staff").select("user_id").maybeSingle();
  if (!team) return { status: "fehler", meldung: "Kein Zugriff." };

  const token = neuerToken();
  const { error } = await admin
    .from("punkte_konten")
    .insert({ token, vorname: vorname.trim() || null });

  if (error) {
    console.error("Karte konnte nicht angelegt werden:", error);
    return { status: "fehler", meldung: "Hat nicht geklappt." };
  }
  return { status: "ok", token };
}

async function alsTeamPruefen() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: team } = await supabase.from("staff").select("user_id").maybeSingle();
  return team ? supabase : null;
}

/**
 * Legt einen Schwung Karten auf einmal an - die kommen ohnehin
 * bogenweise aus dem Drucker, nicht einzeln.
 */
export async function kartenAnlegen(anzahl: number): Promise<PunkteAktion> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };
  if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > 200) {
    return { status: "fehler", meldung: "Zwischen 1 und 200 Karten." };
  }
  if (!(await alsTeamPruefen())) return { status: "fehler", meldung: "Kein Zugriff." };

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const neue = Array.from({ length: anzahl }, () => ({ token: neuerToken() }));
  const { error } = await admin.from("punkte_konten").insert(neue);
  if (error) {
    console.error("Karten konnten nicht angelegt werden:", error);
    return { status: "fehler", meldung: "Hat nicht geklappt." };
  }

  revalidatePath("/reservierung/punkte/drucken");
  return { status: "ok", meldung: `${anzahl} Karten angelegt.` };
}

/**
 * Hakt die gerade gedruckten Karten ab. Ohne diesen Schritt läge beim
 * nächsten Druck derselbe Stapel wieder im Bogen.
 */
export async function alsGedrucktMarkieren(ids: string[]): Promise<PunkteAktion> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };
  if (ids.length === 0) return { status: "fehler", meldung: "Nichts zu markieren." };
  if (!(await alsTeamPruefen())) return { status: "fehler", meldung: "Kein Zugriff." };

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const { error } = await admin
    .from("punkte_konten")
    .update({ gedruckt_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    console.error("Markieren fehlgeschlagen:", error);
    return { status: "fehler", meldung: "Hat nicht geklappt." };
  }

  revalidatePath("/reservierung/punkte/drucken");
  return { status: "ok", meldung: `${ids.length} Karten als gedruckt abgehakt.` };
}

export async function ungedruckteKarten(): Promise<{ id: string; token: string }[]> {
  if (!punkteProgrammAktiv()) return [];
  if (!(await alsTeamPruefen())) return [];

  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("punkte_konten")
    .select("id, token")
    .is("gedruckt_at", null)
    .order("created_at")
    .limit(200);

  return (data as { id: string; token: string }[] | null) ?? [];
}

/**
 * Punkte von Hand vergeben - oder zurücknehmen.
 *
 * Ein Grund ist Pflicht, und wer es getan hat, wird mitgeschrieben. Nicht aus
 * Misstrauen, sondern weil sonst in vier Wochen niemand mehr sagen kann,
 * warum ein Konto 200 Punkte hat, die aus keinem Bon stammen.
 */
export async function punkteGutschreiben(
  kontoId: string,
  punkte: number,
  grund: string,
): Promise<PunkteAktion> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };

  if (!Number.isInteger(punkte) || punkte === 0) {
    return { status: "fehler", meldung: "Bitte eine Punktzahl angeben." };
  }
  if (Math.abs(punkte) > GUTSCHRIFT_MAX) {
    return { status: "fehler", meldung: `Höchstens ${GUTSCHRIFT_MAX} Punkte auf einmal.` };
  }
  if (!grund.trim()) {
    return { status: "fehler", meldung: "Bitte einen Grund angeben." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const { data, error } = await supabase.rpc("punkte_gutschreiben", {
    p_konto_id: kontoId,
    p_punkte: punkte,
    p_grund: grund.trim().slice(0, 200),
    p_art: "manuell",
  });

  if (error) {
    if (error.message.includes("Minus")) {
      return { status: "fehler", meldung: "So viele Punkte hat das Konto nicht." };
    }
    console.error("Gutschrift fehlgeschlagen:", error);
    return { status: "fehler", meldung: "Hat nicht geklappt." };
  }

  revalidatePath("/reservierung/punkte");
  return {
    status: "ok",
    meldung:
      punkte > 0
        ? `${punkte} Punkte gutgeschrieben. Neuer Stand: ${data}.`
        : `${Math.abs(punkte)} Punkte abgezogen. Neuer Stand: ${data}.`,
    punkte: data as number,
  };
}

/**
 * Alle Karten für die interne Übersicht.
 *
 * Eine Abfrage statt mehrerer Kennzahlen-Abfragen: Bei der Größenordnung
 * eines Cafés ist die ganze Liste billiger als fünf Aggregate, und aus ihr
 * lässt sich jede Zahl ableiten, die später noch dazukommt.
 */
export async function kartenUebersicht(): Promise<PunkteStand[]> {
  if (!punkteProgrammAktiv()) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("punkte_stand")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Übersicht konnte nicht geladen werden:", error);
    return [];
  }
  return (data as PunkteStand[] | null) ?? [];
}

export async function praemieEinloesen(
  kontoId: string,
  praemieId: string,
): Promise<PunkteAktion> {
  if (!punkteProgrammAktiv()) return { status: "fehler", meldung: "Nicht verfügbar." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "fehler", meldung: "Gerade nicht möglich." };

  const { data: praemie } = await supabase
    .from("punkte_praemien")
    .select("name, punkte")
    .eq("id", praemieId)
    .maybeSingle();
  if (!praemie) return { status: "fehler", meldung: "Diese Prämie gibt es nicht mehr." };

  const { data, error } = await supabase.rpc("punkte_einloesen", {
    p_konto_id: kontoId,
    p_praemie: praemie.name,
    p_punkte: praemie.punkte,
  });

  if (error) {
    if (error.message.includes("Nicht genug Punkte")) {
      return { status: "fehler", meldung: "Dafür reichen die Punkte nicht." };
    }
    console.error("Einlösen fehlgeschlagen:", error);
    return { status: "fehler", meldung: "Einlösen hat nicht geklappt." };
  }

  revalidatePath("/reservierung/punkte");
  return {
    status: "ok",
    meldung: `${praemie.name} eingelöst. Rest: ${data} Punkte.`,
    punkte: data as number,
  };
}
