import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Café DOA – Coffee, Breakfast & Lunch in Bad Nauheim",
  description:
    "Café DOA in Bad Nauheim: Kaffee, Frühstück und Lunch mit Matcha, Acai Bowls und frisch zubereiteten Bowls. Menü ansehen, Eindrücke entdecken und Tisch reservieren.",
  openGraph: {
    title: "Café DOA – Coffee, Breakfast & Lunch in Bad Nauheim",
    description:
      "Kaffee, Frühstück und Lunch in Bad Nauheim. Menü, Eindrücke und Online-Reservierung.",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
