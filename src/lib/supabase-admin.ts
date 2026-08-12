import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-Client mit vollen Rechten, ausschließlich für den Server.
 *
 * Nötig für das Punkteprogramm: Ein Gast hat kein Konto und keine Sitzung,
 * kann sich also gegenüber der Datenbank nicht ausweisen. Die Berechtigung
 * liegt stattdessen im Server: Er prüft die Signatur des Bons und schreibt
 * erst danach. Dürfte der Browser selbst schreiben, könnte jeder beliebige
 * Beträge eintragen - die ganze Prüfung wäre umsonst.
 *
 * Der Schlüssel darf niemals in den Browser gelangen. Deshalb kein
 * NEXT_PUBLIC_-Präfix: Damit landet er nicht im ausgelieferten Bundle.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
