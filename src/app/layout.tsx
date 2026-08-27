import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { CAFE_INFO } from "@/lib/cafe-info";
import { SHARE_IMAGE } from "@/lib/photos";
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
  "Café DOA in der Hauptstraße 11 in Bad Nauheim: Kaffee, Matcha, Bowls und selbst angesetzte Limos. Täglich ab 9:30 Uhr, alles auch zum Mitnehmen. Karte ansehen und Tisch reservieren.";

export const viewport: Viewport = {
  // Farbe der Statusleiste, wenn die Seite als App auf dem Handy liegt.
  themeColor: "#1f3327",
};

export const metadata: Metadata = {
  metadataBase: new URL(CAFE_INFO.siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  // Ohne das öffnet iOS die gespeicherte Seite mit Adresszeile - also als
  // Verknüpfung, nicht als App.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DOA Punkte" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title,
    description,
    url: CAFE_INFO.siteUrl,
    siteName: CAFE_INFO.name,
    images: [{ url: SHARE_IMAGE.src, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height }],
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
    // Das Thema-Skript der internen Bereiche setzt hier ein Attribut, bevor
    // React übernimmt - für React sieht das nach einer Abweichung aus. Genau
    // dieses eine Element davon auszunehmen ist die Absicht; tiefer im Baum
    // wird weiterhin geprüft.
    <html
      lang="de"
      className={`${fraunces.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
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
