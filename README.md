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

### Logo

`src/components/logo-path.ts` enthält den Pfad des Mosaik-Zeichens,
nachgezeichnet aus dem Original (Instagram-Profilbild). Die Datei ist
generiert – bei einer neuen Vorlage neu tracen statt von Hand
nachbessern. Gefärbt wird über `currentColor`, das Zeichen passt sich
also dunkel im Header und creme im Footer automatisch an.

### Bon-Prüfung für das Punkteprogramm

`src/lib/tse-beleg.ts` prüft den QR-Code auf dem Kassenbon gegen die
Signatur der TSE. Grundlage für das geplante Treueprogramm: Gäste reichen
ihren Bon selbst ein, die Kasse bleibt unangetastet.

Ohne Signaturprüfung wäre das Programm wertlos. Der Code ist reiner Text –
wer einen Bon gescannt hat, kennt den Aufbau und könnte sich in zwei
Minuten einen über 200 € ausdenken. Weder Dublettenprüfung noch Zeitfenster
noch Betragsgrenze würden das bemerken.

Geprüft wird gegen den öffentlichen Schlüssel der TSE, nicht gegen die
Kassenkennung: Beide Kassen (Tresen und Tischgerät) hängen an derselben
TSE, ein gültig signierter Bon kann also nur aus dem Café stammen. Kommt
ein Gerät mit eigener TSE dazu, muss dessen Schlüssel in
`TSE_PUBLIC_KEYS` ergänzt werden.

Punkte gibt es nur auf die Beträge zu 19 % und 7 %. Was zu 0 % läuft, ist
Trinkgeld, Pfand oder ein Gutscheinverkauf – Trinkgeld gehört den
Mitarbeitern, Pfand wird erstattet, und ein Gutschein zählte sonst doppelt.

```bash
npm run test:tse
```

prüft drei echte Bons und neun manipulierte. **Nach jeder Änderung an
`tse-beleg.ts` laufen lassen** – die Prüfung hängt an einer Byte-für-Byte-
Rekonstruktion dessen, was die TSE signiert hat, und ein Fehler darin fällt
sonst erst auf, wenn Gäste am Tresen stehen.

Die Prüfung läuft ausschließlich serverseitig. Im Browser wäre sie wertlos,
weil der Client sie überspringen könnte.

### Punkteprogramm

**Noch nicht aktiv.** Solange `PUNKTE_PROGRAMM_AKTIV` nicht auf `true`
steht, antworten `/punkte` und `/reservierung/punkte` mit „nicht
gefunden" – kein Hinweis darauf, dass da etwas vorbereitet wird. Der
Schalter sitzt serverseitig, im ausgelieferten Code steht nichts davon.

So läuft es:

1. Der Gast legt sich auf `/punkte` selbst eine Karte an – oder bekommt
   eine gedruckte im Café (`/reservierung/punkte` → *Neue Karte ausgeben*).
   Der Code ist zufällig, nicht fortlaufend: Eine Kundennummer 0001 ließe
   sich hochzählen, und wer fremde Codes raten kann, sieht fremde
   Punktestände.

   Selbstanlage ist unbedenklich, obwohl sie erst gesperrt war: Punkte
   entstehen ausschließlich aus signierten Bons, und jeder Bon lässt sich
   genau einmal einreichen. Zehn selbst angelegte Konten sind zehn leere
   Konten.
2. Der Gast scannt den QR der Karte mit der Handykamera, landet auf
   `/punkte/<code>` und ist ab dann auf diesem Gerät verbunden. Wer selbst
   angelegt hat, ist es sofort.

   Auf `/punkte` lässt sich die Karte als QR anzeigen – das Team scannt sie
   am Tresen mit *Karte des Gastes scannen*, statt den Code abzutippen.
3. Nach dem Bezahlen scannt er den QR seines Bons. Der Server prüft die
   Signatur (siehe oben), rechnet und schreibt gut.
4. Einlösen passiert am Tresen über `/reservierung/punkte`; den Rabatt
   bucht das Team wie jeden anderen in der Kasse.

**Ein Punkt je vollem Euro, Restcent laufen weiter.** Der Punktestand wird
nicht gespeichert, sondern aus der Umsatzsumme berechnet – dadurch stimmt
er immer, und der halbe Punkt vom letzten Bon steckt ohne Zusatzfeld in der
Summe. Der Kurs steht in der Ansicht `punkte_stand`.

Prämien werden in der Datenbank gepflegt, nicht im Code:

```sql
insert into public.punkte_praemien (name, punkte, sortierung) values
  ('Kaffee oder Limo', 100, 1),
  ('Bowl nach Wahl',   250, 2);
```

**Vor dem echten Start** die Probierdaten wegräumen – die Prämien bleiben:

```sql
truncate public.punkte_einloesungen, public.punkte_belege,
         public.punkte_konten restart identity cascade;
```

#### Punkte ohne Bon

`punkte_gutschriften` nimmt alles auf, was nicht aus einem Kassenbon kommt.
Eine eigene Tabelle, weil `punkte_belege` für signierte Bons reserviert ist –
ein erfundener Beleg darin würde die Prüfung entwerten, auf der das ganze
Programm beruht.

Gebucht wird über `punkte_gutschreiben(...)`, nicht per `insert`: Die Sperre
verhindert, dass zwei gleichzeitige Abzüge den Stand ins Minus ziehen, und
die Obergrenze von 500 begrenzt den Schaden eines Zahlendrehers.

Ein Grund ist Pflicht und wer es eingetragen hat, wird mitgeschrieben – nicht
aus Misstrauen, sondern damit in vier Wochen noch nachvollziehbar ist, warum
ein Konto Punkte hat, die aus keinem Bon stammen. Negative Werte nehmen eine
Gutschrift zurück.

**Noch nicht gebaut, wartet auf Freigabe.** Alle drei vergeben Punkte über
dieselbe Tabelle, unterscheidbar über die Spalte `art`:

| Vorhaben | Was vorher zu klären ist |
|---|---|
| Willkommenspunkte im Aktionszeitraum | Von wann bis wann, wie viele – und dass jedes Konto sie nur einmal bekommt |
| Freunde einladen | Empfehlungscode je Konto, wer wann Punkte bekommt, und was verhindert, dass sich jemand selbst zehnmal einlädt |
| Google-Bewertung | **Technisch nicht prüfbar.** Google verrät nicht, wer bewertet hat. Läuft also nur über den Tresen: Gast zeigt die Bewertung, Team trägt die Punkte ein. Dafür braucht es keine Entwicklung, nur eine Absprache im Team |

#### Als App aufs Handy

`src/app/manifest.ts` macht aus der Seite eine Web-App statt einer
Verknüpfung: eigenes Symbol, eigener Name („DOA Punkte"), Vollbild ohne
Adresszeile, eigener Eintrag im App-Umschalter. Gestartet wird direkt auf
`/punkte` – wer die App öffnet, will nicht erst durch die Speisekarte
scrollen.

Kein App Store, keine Gebühren, keine Freigabe. Updates sind sofort da.

Die Symbole in `public/` (`icon-192`, `icon-512`, `icon-maskable-512`,
`apple-touch-icon`) sind aus `src/components/logo-path.ts` erzeugt – bei
neuem Logo neu erzeugen, nicht von Hand bearbeiten. Die `maskable`-Fassung
hat mehr Rand, weil Android Symbole auf seine eigene Form beschneidet und
das Zeichen sonst angesägt wird.

**Ein Stolperstein auf dem iPhone:** Eine gespeicherte Web-App hat dort
einen eigenen Speicher, getrennt von Safari. Wer in Safari eine Karte
anlegt und die Seite danach speichert, ist in der App zunächst nicht
angemeldet. Deshalb nennt der Hinweis in `AlsAppSpeichern.tsx` den
Kartencode und erklärt, dass die Punkte nicht verloren sind – ohne das
denkt der Gast genau das.

#### Karten drucken

`/reservierung/punkte/drucken` legt Karten stapelweise an und setzt sie als
Druckbogen: **2 × 5 Karten im Format 85 × 55 mm auf A4.** Danach *Als
gedruckt abhaken* – sonst liegt beim nächsten Mal derselbe Stapel wieder im
Bogen.

Im Druckdialog **Ränder: keine** und **Skalierung: 100 %** wählen. Sonst
skaliert der Browser, und die Karten kommen in einer Größe heraus, die zu
keiner Schneidevorlage passt.

Beim QR-Code entscheiden zwei Details über brauchbar und wertlos, beide
waren beim ersten Versuch falsch:

- **Ruhezone** (`margin: 4`) – ohne den hellen Rand ringsum finden Kameras
  den Code nicht. Er ist dann gedruckt, aber unlesbar.
- **`stroke`, nicht `fill`** – die Bibliothek zeichnet die Module als
  Striche. Der erste Pfad in ihrer Ausgabe ist nur der weiße Hintergrund;
  wer den nimmt, druckt ein leeres Quadrat.

Beides wurde gegen echte Bilder geprüft: Bogen gerendert, QR wieder
ausgelesen, Zieladresse verglichen. Wer am Kartenlayout etwas ändert,
sollte das wiederholen – 500 unlesbare Karten fallen sonst erst am Tresen
auf.

Das Layout steht in `src/lib/karte.ts` (`KARTEN_LAYOUT`): `hell`, `dunkel`
oder `zweigeteilt`.

Was gespeichert wird: ein zufälliger Code, ein optionaler Vorname, je Bon
Nummer, Betrag und Zeit. Kein Name, keine E-Mail, keine Adresse, keine
Artikel – aus einem Bon geht nicht hervor, *was* jemand gegessen hat. Die
Datenschutzerklärung braucht trotzdem einen Absatz, bevor das Programm
startet.

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

- **Menü**: Übernommen aus der offiziellen Karte `MENU_DOA_AUGUST_26.pdf`
  (Stand August 2026), gepflegt in `src/lib/menu-data.ts`. Bei einer neuen
  Karte wieder aus der PDF übernehmen – die vorherige Fassung stammte aus
  Instagram-Screenshots und lag an mehreren Stellen daneben.
- **Instagram**: Verlinkt bewusst nur auf das Profil statt einen Feed
  einzubetten. Eine Einbettung würde Meta-Skripte auf jedem Seitenaufruf
  laden und Cookies setzen, bevor jemand irgendwo klickt – das schließt
  die Datenschutzerklärung aus.
