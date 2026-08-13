<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Café DOA – Orientierung

Diese Datei wird in **jede** Session geladen. Sie ist deshalb bewusst kurz:
sie soll das Suchen ersparen, nicht das Lesen ersetzen. Details stehen im
README, Begründungen in den Kommentaren am Code.

## Wo was liegt

| Thema | Datei |
|---|---|
| Adresse, Telefon, Öffnungszeiten-Text, Instagram, Domain | `src/lib/cafe-info.ts` |
| Buchbare Zeiten, Vorlauf, Slot-Länge | `src/lib/opening-hours.ts` |
| Speise- und Getränkekarte | `src/lib/menu-data.ts` |
| Fotos (Hero + Galerie) | `src/lib/photos.ts`, Dateien in `public/fotos/` |
| Alle vier Mail-Texte | `src/lib/email.ts` |
| E-Mail-/Telefonprüfung | `src/lib/contact-validation.ts` |
| Bon-Prüfung (TSE-Signatur) | `src/lib/tse-beleg.ts` |
| Punkteprogramm (Regeln, Schalter) | `src/lib/punkte.ts` |
| Reservierung speichern, bestätigen, absagen | `src/app/actions/` |
| Mitarbeiter-Ansicht | `src/app/reservierung/` |
| Datenbank + Rechte | `supabase/migrations/` |

Diese Werte stehen jeweils **an genau einer Stelle** und werden überall
importiert. Eine Öffnungszeit zu ändern heißt: eine Datei anfassen, nicht
sechs. Wer dieselbe Zahl ein zweites Mal irgendwo hinschreibt, baut den
nächsten Widerspruch ein.

## Was hier schon schiefgegangen ist

Nicht wiederholen:

- **Küchenschluss (18:00) ist an `lastSlotAt` gekoppelt.** Ändert sich der
  eine Wert, muss der andere mit – sonst kann man Tische buchen, an denen
  es nichts mehr zu essen gibt.
- **Zeitrechnung immer in `Europe/Berlin`.** Der Server läuft UTC; ohne
  Zeitzone werden rund um Mitternacht und bei der Zeitumstellung falsche
  Slots akzeptiert.
- **`libphonenumber-js/max`, nicht der Standard-Import.** Der Standardbau
  liefert für *jede* Nummer `type: undefined`, damit läuft die Prüfung auf
  Servicenummern ins Leere, ohne einen Fehler zu werfen.
- **Im Browser nur der `sb_publishable_…`-Key.** Der `sb_secret`-Key gehört
  ausschließlich in Server-Umgebungsvariablen.
- **Der Resend-MX-Eintrag gehört auf die Subdomain `send`, nie auf `@`** –
  sonst empfangen die IONOS-Postfächer des Cafés keine Mail mehr.
- **`src/components/logo-path.ts` ist generiert.** Bei neuer Vorlage neu
  tracen, nicht von Hand nachbessern.
- **Das Punkteprogramm ist noch nicht freigegeben.** Es hängt an
  `PUNKTE_PROGRAMM_AKTIV`; ohne den Schalter antworten seine Seiten mit
  „nicht gefunden". Nichts davon darf ohne Absprache sichtbar werden.
- **Für Gäste gibt es keine Datenbank-Policy, und das ist Absicht.** Ein
  Gast hat keine Sitzung; geschrieben wird ausschließlich serverseitig,
  nachdem die Bon-Signatur geprüft wurde. Wer dem Browser Schreibrechte
  gibt, macht die Prüfung wertlos – dann trägt jeder beliebige Beträge ein.
- **Die von der TSE signierten Bytes haben kein äußeres `SEQUENCE`**, und die
  Transaktionsnummer steckt als `OCTET STRING` darin, nicht als `INTEGER`.
  Beides falsch anzunehmen liegt nahe und kostete hier mehrere tausend
  vergeblich durchprobierte Varianten. Wer `tse-beleg.ts` anfasst, muss
  danach `npm run test:tse` laufen lassen – der Selbsttest prüft gegen echte
  Bons und gegen manipulierte.
- **Preise und Gerichte stammen aus der offiziellen Karte** (`MENU_DOA_AUGUST_26.pdf`,
  Stand August 2026) – vorher waren es Instagram-Screenshots und die lagen
  an mehreren Stellen daneben. Bei einer neuen Karte wieder aus der PDF
  übernehmen, nicht aus Fotos.

## Arbeitsweise

- Vor dem Bauen `npm run build` und `npx eslint .` – beides muss sauber
  durchlaufen.
- Kommentare erklären das *Warum*, nicht das *Was*. Was der Code tut,
  steht im Code.
- Texte auf der Seite sind deutsch und geduzt, Zielgruppe 16–35. Keine
  Werbefloskeln.
- Für Änderungen einen Branch anlegen, committen, pushen. Keinen Pull
  Request ohne Aufforderung.

## Sparsam bleiben

Der Verlauf einer Session wird bei jeder Nachricht komplett erneut
verarbeitet – lange Sessions sind der größte Kostenfaktor, nicht die Länge
der Antworten. Deshalb:

- Erst die Tabelle oben lesen, dann gezielt eine Datei öffnen. Nicht das
  halbe Projekt durchsuchen, um sich zu orientieren.
- Nichts erneut prüfen, was in dieser Session schon geprüft wurde.
- Nicht ungefragt aufräumen, umbenennen oder „verbessern".
