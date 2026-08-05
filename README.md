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

### Reservierungen verwalten

Reservierungsanfragen landen in der Tabelle `reservations`
(Status `pending`). Aus Datenschutzgründen gibt es dafür bewusst keine
öffentliche Leseberechtigung – die Anfragen lassen sich im
**Supabase Studio → Table Editor** einsehen und bestätigen (Status auf
`confirmed`/`declined` setzen).

### Galerie-Fotos hochladen

Fotos einfach im **Supabase Studio → Storage → gallery** hochladen. Die
Website liest den Bucket automatisch aus (Aktualisierung spätestens
stündlich, siehe `revalidate` in `src/app/page.tsx`) und zeigt die Bilder
in der Galerie – die Platzhalter-Kacheln verschwinden automatisch, sobald
mindestens ein Bild vorhanden ist.

## Auf Vercel deployen

1. Repo in Vercel importieren (GitHub-Integration).
2. Die beiden Environment Variables aus Schritt 4 oben in den
   Vercel-Projekteinstellungen hinterlegen.
3. Deployen – fertig.

## Noch offen / To-Do

- **Adresse ergänzen**: Die genaue Straße/Hausnummer fehlt noch in
  `src/lib/cafe-info.ts` (`addressLine`).
- **Menü-Preise/Gerichte prüfen**: Aktuell aus Instagram-Screenshots
  übernommen (Stand 1. Juni) – bei Änderungen `src/lib/menu-data.ts`
  anpassen.
- **"Über uns"-Text**: Aktuell ein Platzhaltertext in
  `src/components/About.tsx` – gerne durch die echte Café-Geschichte
  ersetzen.
- **Echte Fotos**: Sobald Fotos in Supabase Storage liegen, ersetzen sie
  automatisch die generierten Platzhalter-Kacheln.
