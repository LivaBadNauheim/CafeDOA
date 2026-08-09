import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { CAFE_INFO } from "@/lib/cafe-info";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const title = "Café DOA – Coffee, Breakfast & Lunch in Bad Nauheim";
const description =
  "Café DOA in der Hauptstraße 11 in Bad Nauheim: Kaffee, Frühstück und Lunch mit Matcha, Acai Bowls und frisch zubereiteten Bowls. Menü ansehen, Eindrücke entdecken und Tisch reservieren.";

export const metadata: Metadata = {
  metadataBase: new URL(CAFE_INFO.siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: CAFE_INFO.siteUrl,
    siteName: CAFE_INFO.name,
    locale: "de_DE",
    type: "website",
  },
};

// Tells search engines the café's address, phone and hours, so they can be
// shown directly in search results and on maps.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: CAFE_INFO.name,
  url: CAFE_INFO.siteUrl,
  telephone: CAFE_INFO.phoneHref,
  servesCuisine: ["Kaffee", "Frühstück", "Lunch"],
  address: {
    "@type": "PostalAddress",
    streetAddress: CAFE_INFO.street,
    postalCode: CAFE_INFO.postalCode,
    addressLocality: CAFE_INFO.city,
    addressCountry: "DE",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:30",
      closes: "19:00",
    },
  ],
  sameAs: [CAFE_INFO.instagramUrl],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
