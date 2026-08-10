# Café DOA – Website

Website für das Café DOA in Bad Nauheim. Next.js 16 (App Router) +
Tailwind CSS v4, Reservierungen und Galerie-Bilder laufen über Supabase.

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **Tailwind CSS v4**
- **Supabase** – Postgres-Tabelle für Reservierungsanfragen + Storage-Bucket
  für Galerie-Fotos
- **Vercel** – Hosting/Deployment (via GitHub-Integration)

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Werte aus Supabase eintragen, siehe unten
npm run dev
```

Ohne Supabase-Zugangsdaten läuft die Seite trotzdem: Das Menü ist statisch,
die Galerie zeigt Platzhalter-Kacheln, und das Reservierungsformular zeigt
einen Hinweis, dass online noch nicht reserviert werden kann.

## Supabase einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im SQL-Editor das Migrationsskript ausführen:
   `supabase/migrations/0001_init.sql`
   → legt die Tabelle `reservations` (inkl. Row Level Security) und den
   öffentlichen Storage-Bucket `gallery` an.
3. Unter **Project Settings → API** die `Project URL` und den
   `anon public` Key kopieren.
4. In `.env.local` (lokal) bzw. in den Vercel-Projekteinstellungen als
   Environment Variables eintragen:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

### Rechtliche Seiten

`/impressum` und `/datenschutz`, verlinkt im Footer. Die
Datenschutzerklärung beschreibt die tatsächlich eingesetzten Dienste
(Vercel, Supabase, Resend) – bei einem Wechsel oder Zusatz muss sie
angepasst werden.

Die Erklärung nennt eine Löschfrist von zwölf Monaten. Umgesetzt wird das
von `supabase/migrations/0003_delete_old_reservations.sql`: ein
nächtlicher `pg_cron`-Job löscht ältere Reservierungen. Läuft die
Migration nicht, steht in der Datenschutzerklärung eine Zusage, die nicht
eingehalten wird.

> Die Texte sind nach bestem Wissen erstellt, aber keine Rechtsberatung.
> Vor dem Livegang juristisch prüfen lassen.

### Reservierungsregeln

Konfiguriert in `src/lib/opening-hours.ts`:

- **Buchbare Zeiten:** 9:30 – 18:00 Uhr in 15-Minuten-Schritten – gekoppelt
  an den Küchenschluss, nicht an die Schließzeit: Wer einen Tisch bucht,
  soll auch noch etwas bestellen können. Getränke laufen ohnehin bis 19 Uhr
  und brauchen keine Reservierung.
- **Vorlauf:** Für den heutigen Tag mindestens 30 Minuten im Voraus
- **Vorausbuchung:** maximal 180 Tage

Die Zeitprüfung rechnet in `Europe/Berlin`, nicht in der Serverzeit (UTC) –
sonst würden rund um Mitternacht und bei der Zeitumstellung die falschen
Slots akzeptiert.

Bei Kontaktdaten (`src/lib/contact-validation.ts`) werden abgelehnt:
Platzhalter wie `du@du.de` oder `test@test.de`, Wegwerf-Adressen, Domains
ohne Mailserver, Tippfehler bei gängigen Anbietern (`@gmial.com` →
Hinweis auf `@gmail.com`) sowie Service- und Premiumnummern. Alle Regeln
greifen serverseitig und lassen sich nicht durch Manipulation des
Formulars umgehen.

Ob eine Adresse wirklich dem Gast gehört, beweist letztlich erst die
zugestellte Bestätigungsmail.

### E-Mails einrichten (Resend)

Es werden vier Mails verschickt (`src/lib/email.ts`):

| Auslöser | Empfänger | Inhalt |
|---|---|---|
| Anfrage abgeschickt | Café | Alle Angaben, Antwort geht direkt an den Gast |
| Anfrage abgeschickt | Gast | Eingangsbestätigung, ausdrücklich noch nicht verbindlich |
| „Bestätigen" geklickt | Gast | Feste Zusage mit Adresse und Kartenlink |
| „Ablehnen"/„Stornieren" | Gast | Absage mit Bitte um Rückruf |

Einrichtung:

1. Account auf [resend.com](https://resend.com) anlegen (kostenlos: 3.000
   Mails/Monat).
2. Unter **Domains** `cafe-doa.de` hinzufügen und die angezeigten
   DNS-Einträge bei IONOS eintragen.
   ⚠️ Resend nutzt eine Subdomain (meist `send`). Im Hostname-Feld muss
   `send` stehen, **nicht** `@` – sonst gehen die Postfächer bei IONOS
   kaputt. Der bestehende SPF-Eintrag auf `@` bleibt unverändert.
3. Unter **API Keys** einen Key mit *Sending access* erstellen.
4. In den Vercel-Projekteinstellungen hinterlegen:
   ```
   RESEND_API_KEY=re_...
   RESERVATION_NOTIFICATION_FROM=Café DOA <reservierung@cafe-doa.de>
   RESERVATION_NOTIFICATION_TO=info@cafe-doa.de
   ```
   Danach einmal **Redeploy**.

Fehlen die Werte, funktionieren Reservierungen unverändert – es geht dann
nur keine Mail raus. Auch ein fehlgeschlagener Versand lässt die
Reservierung bestehen; der Fehler landet in den Vercel-Logs.

### Reservierungen verwalten

Reservierungsanfragen landen in der Tabelle `reservations`
(Status `pending`). Aus Datenschutzgründen gibt es dafür bewusst keine
öffentliche Leseberechtigung – die Anfragen lassen sich im
**Supabase Studio → Table Editor** einsehen und bestätigen (Status auf
`confirmed`/`declined` setzen).

## Mitarbeiter-Ansicht (reservierung.cafe-doa.de)

Eingehende Reservierungen laufen live in einem geschützten Bereich auf.
Er liegt im selben Projekt, wird aber über die Subdomain ausgeliefert
(siehe `src/proxy.ts`) – lokal erreichbar unter `/reservierung`.

### Einrichten

1. **Datenbank vorbereiten:** `supabase/migrations/0002_staff_access.sql`
   im SQL-Editor ausführen. Legt die Tabelle `staff` an, gibt dem Team
   Lese- und Schreibrechte auf Reservierungen und schaltet Live-Updates
   frei.
2. **Selbstregistrierung abschalten:** In Supabase unter
   **Authentication → Sign In / Providers → Email** die Option
   *Allow new users to sign up* deaktivieren. Sonst könnte sich jeder ein
   Konto anlegen.
3. **Mitarbeiter anlegen:** **Authentication → Users → Add user**, E-Mail
   und Passwort vergeben (Häkchen bei *Auto Confirm User*).
4. **Zum Team hinzufügen** – erst dieser Schritt gibt Zugriff auf die
   Reservierungen:
   ```sql
   insert into public.staff (user_id, display_name)
   select id, 'Vorname' from auth.users where email = 'name@cafe-doa.de';
   ```
5. **Subdomain verbinden:** In Vercel unter **Settings → Domains** die
   Domain `reservierung.cafe-doa.de` hinzufügen, dann bei IONOS den von
   Vercel angezeigten `CNAME` für den Hostnamen `reservierung` eintragen.

Ein Konto ohne Eintrag in `staff` kann sich zwar anmelden, sieht aber
keine Daten – Zugriff wird bewusst einzeln vergeben.

### Bedienung

Reservierungen erscheinen automatisch, ohne die Seite neu zu laden (der
Punkt oben rechts zeigt „Live"). Zusätzlich lädt die Ansicht jede Minute
und beim Zurückwechseln auf den Tab neu, damit nichts untergeht, falls
die Verbindung abreißt.

Aufbau:

- **Offene Anfragen** ganz oben – alles, was noch nicht bestätigt oder
  abgelehnt wurde, mit Anzahl im Titel
- **Kalender** – ein Punkt pro Tag mit Reservierungen: terracotta, solange
  etwas offen ist, grün wenn alles bearbeitet ist. Ein Klick auf einen Tag
  filtert die Liste daneben, ein weiterer hebt die Auswahl auf
- **Tagesliste** – standardmäßig heute, mit Datum und Status je Eintrag

Vergangenes verschwindet automatisch: Die Abfrage holt nur Tage ab heute,
und abgelaufene Uhrzeiten des laufenden Tages werden ausgeblendet.

### Fotos

Die Seite bringt einen festen Satz Fotos mit: `public/fotos/`, gelistet in
`src/lib/photos.ts`. Die Galeriebilder sind auf maximal 1600 px
verkleinert und werden von `next/image` zusätzlich pro Gerät als WebP
ausgeliefert.

Das Hero-Foto liegt in **zwei Zuschnitten** desselben Motivs vor:
`hero-breit.jpg` (2560 × 1440) für Desktop, `hero-hoch.jpg` (1200 × 1600)
fürs Handy. Ein einzelnes Bild kann beides nicht bedienen – quer
zugeschnitten wird auf dem Handy das Motiv zerschnitten, hochkant müsste
es auf dem Desktop hochskaliert werden und wirkt unscharf. Beim Austausch
also beide Zuschnitte aus einer Vorlage mit mindestens 2560 px Breite
erzeugen.

Wer sie austauschen will, ohne den Code anzufassen, lädt Bilder im
**Supabase Studio → Storage → gallery** hoch – **vorhandene Uploads
ersetzen den mitgelieferten Satz komplett.** Die Aktualisierung greift
spätestens stündlich (siehe `revalidate` in `src/app/page.tsx`).

Zwei Dinge steuert ihr über den **Dateinamen**:

- **Reihenfolge** – die Bilder werden alphabetisch sortiert, ein Präfix
  legt die Position fest: `01_...`, `02_...`, `03_...`
- **Bildbeschreibung** – der Rest des Namens wird zum Alternativtext für
  Screenreader und Suchmaschinen. Aus `01_gemuetlicher-fensterplatz.jpg`
  wird „Gemuetlicher fensterplatz – Café DOA". Kameranamen wie `IMG_2029`
  werden erkannt und durch eine allgemeine Beschreibung ersetzt.

Die Bilder werden automatisch verkleinert und ins moderne WebP-Format
umgewandelt, ausgeliefert wird immer nur die für das Gerät passende
Größe. Ihr könnt also die Originaldateien direkt hochladen, ohne sie
vorher zu komprimieren.

## Auf Vercel deployen

1. Repo in Vercel importieren (GitHub-Integration).
2. Die beiden Environment Variables aus Schritt 4 oben in den
   Vercel-Projekteinstellungen hinterlegen.
3. Deployen – fertig.

## Noch offen / To-Do

- **Menü-Preise/Gerichte prüfen**: Aktuell aus Instagram-Screenshots
  übernommen (Stand 1. Juni) – bei Änderungen `src/lib/menu-data.ts`
  anpassen.
- **Instagram**: Verlinkt bewusst nur auf das Profil statt einen Feed
  einzubetten. Eine Einbettung würde Meta-Skripte auf jedem Seitenaufruf
  laden und Cookies setzen, bevor jemand irgendwo klickt – das schließt
  die Datenschutzerklärung aus.
