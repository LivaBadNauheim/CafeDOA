import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CAFE_INFO } from "@/lib/cafe-info";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Café DOA",
  description: "Informationen zur Verarbeitung personenbezogener Daten auf der Website des Café DOA.",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>
        Der Schutz deiner persönlichen Daten ist uns wichtig. Nachfolgend informieren wir dich
        darüber, welche Daten wir auf dieser Website verarbeiten, zu welchem Zweck und auf welcher
        Rechtsgrundlage.
      </p>

      <h2>1. Verantwortlicher</h2>
      <address>
        Nedim Berktas
        <br />
        {CAFE_INFO.name}
        <br />
        {CAFE_INFO.street}
        <br />
        {CAFE_INFO.postalCity}
        <br />
        Telefon: <a href={`tel:${CAFE_INFO.phoneHref}`}>{CAFE_INFO.phoneDisplay}</a>
        <br />
        E-Mail: <a href="mailto:info@cafe-doa.de">info@cafe-doa.de</a>
      </address>

      <h2>2. Hosting</h2>
      <p>
        Diese Website wird bei der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA
        gehostet. Beim Aufruf der Website werden Daten an Server von Vercel übertragen und dort
        verarbeitet. Die Auslieferung erfolgt über Rechenzentren innerhalb der Europäischen Union.
        Für Übermittlungen in die USA stützt sich Vercel auf Standardvertragsklauseln der
        EU-Kommission.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in einer
        sicheren und zuverlässigen Bereitstellung dieser Website.
      </p>

      <h2>3. Server-Logfiles</h2>
      <p>
        Beim Aufruf der Website werden automatisch Informationen erfasst, die dein Browser
        übermittelt:
      </p>
      <ul>
        <li>aufgerufene Seite und Zeitpunkt des Zugriffs</li>
        <li>übertragene Datenmenge und Meldung über erfolgreichen Abruf</li>
        <li>Browsertyp und -version, Betriebssystem</li>
        <li>IP-Adresse</li>
      </ul>
      <p>
        Diese Daten dienen ausschließlich dem technischen Betrieb und der Sicherheit der Website.
        Eine Zusammenführung mit anderen Datenquellen findet nicht statt. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2>4. Reservierungsanfragen</h2>
      <p>
        Wenn du über das Formular einen Tisch reservierst, verarbeiten wir die von dir angegebenen
        Daten: Name, E-Mail-Adresse, Telefonnummer, Datum, Uhrzeit, Personenanzahl sowie eine
        optionale Nachricht.
      </p>
      <p>
        Diese Daten nutzen wir ausschließlich, um deine Reservierung zu bearbeiten, zu bestätigen
        und dich bei Rückfragen oder Änderungen zu erreichen. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. b DSGVO (Durchführung vorvertraglicher Maßnahmen).
      </p>
      <p>
        Die Daten werden bei der Supabase Inc., 970 Toa Payoh North, Singapore, in einem
        Rechenzentrum innerhalb der Europäischen Union gespeichert. Zugriff haben ausschließlich
        Mitarbeiterinnen und Mitarbeiter des Cafés über einen passwortgeschützten Bereich.
      </p>
      <p>
        Reservierungsdaten werden gelöscht, sobald sie für den genannten Zweck nicht mehr
        erforderlich sind, spätestens jedoch zwölf Monate nach dem Reservierungstermin. Die
        Löschung erfolgt automatisiert.
      </p>

      <h2>5. E-Mail-Versand</h2>
      <p>
        Zur Bestätigung deiner Reservierung versenden wir E-Mails über die Resend, Inc.,
        2261 Market Street #5039, San Francisco, CA 94114, USA. Der Versand erfolgt über
        Infrastruktur innerhalb der Europäischen Union (Region Irland). Übermittelt werden dabei
        deine E-Mail-Adresse sowie die Angaben zu deiner Reservierung.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Für Übermittlungen in die USA bestehen
        Standardvertragsklauseln der EU-Kommission.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Der öffentliche Bereich dieser Website setzt keine Cookies und verwendet weder Analyse-
        noch Marketing-Werkzeuge. Es findet kein Tracking statt.
      </p>
      <p>
        Im internen Bereich für Café-Mitarbeitende werden technisch notwendige Cookies gesetzt, um
        die Anmeldung aufrechtzuerhalten. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG in
        Verbindung mit Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2>7. Schriftarten und Bilder</h2>
      <p>
        Die verwendeten Schriftarten sind lokal auf unserem Server eingebunden. Beim Aufruf der
        Website wird keine Verbindung zu Servern Dritter hergestellt und es werden keine Daten an
        Anbieter von Schriftarten übertragen.
      </p>
      <p>
        Fotos der Galerie werden über den Speicherdienst von Supabase ausgeliefert (siehe Ziffer
        4).
      </p>

      <h2>8. Verlinkung externer Angebote</h2>
      <p>
        Unsere Website enthält Links zu Instagram sowie zu einem Kartendienst. Diese Verbindungen
        werden erst hergestellt, wenn du den jeweiligen Link aktiv anklickst. Ab diesem Zeitpunkt
        gelten die Datenschutzbestimmungen des jeweiligen Anbieters, auf deren Inhalt wir keinen
        Einfluss haben.
      </p>

      <h2>9. Verschlüsselung</h2>
      <p>
        Diese Website nutzt eine SSL- beziehungsweise TLS-Verschlüsselung. Du erkennst dies an der
        Adresszeile deines Browsers, die mit &bdquo;https://&ldquo; beginnt. Daten, die du an uns
        übermittelst,
        können dadurch nicht von Dritten mitgelesen werden.
      </p>

      <h2>10. Deine Rechte</h2>
      <p>Dir stehen gegenüber uns folgende Rechte hinsichtlich deiner personenbezogenen Daten zu:</p>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
      </ul>
      <p>
        Zur Ausübung dieser Rechte genügt eine formlose Nachricht an{" "}
        <a href="mailto:info@cafe-doa.de">info@cafe-doa.de</a>.
      </p>

      <h2>11. Beschwerderecht bei der Aufsichtsbehörde</h2>
      <p>
        Unbeschadet anderweitiger Rechtsbehelfe steht dir ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde zu. Für uns zuständig ist:
      </p>
      <address>
        Der Hessische Beauftragte für Datenschutz und Informationsfreiheit
        <br />
        Gustav-Stresemann-Ring 1
        <br />
        65189 Wiesbaden
      </address>

      <h2>12. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, sobald Änderungen an der Website oder an den
        eingesetzten Diensten dies erforderlich machen.
      </p>
    </LegalPage>
  );
}
