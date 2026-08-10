import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CAFE_INFO } from "@/lib/cafe-info";

export const metadata: Metadata = {
  title: "Impressum – Café DOA",
  description: "Impressum und Anbieterkennzeichnung des Café DOA in Bad Nauheim.",
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <address>
        Nedim Berktas
        <br />
        {CAFE_INFO.name}
        <br />
        {CAFE_INFO.street}
        <br />
        {CAFE_INFO.postalCity}
      </address>

      <h2>Kontakt</h2>
      <p>
        Telefon:{" "}
        <a href={`tel:${CAFE_INFO.phoneHref}`}>{CAFE_INFO.phoneDisplay}</a>
        <br />
        E-Mail: <a href="mailto:info@cafe-doa.de">info@cafe-doa.de</a>
      </p>

      <h2>Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalPage>
  );
}
