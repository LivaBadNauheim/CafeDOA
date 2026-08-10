import Link from "next/link";
import { PendantLampIcon } from "./icons";
import { CAFE_INFO } from "@/lib/cafe-info";

export default function Hero() {
  return (
    <section id="top" className="mosaic-bg relative overflow-hidden bg-cream pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">Café · Bad Nauheim</p>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
            Coffee, Breakfast{" "}
            <span className="italic text-terracotta">&amp; Lunch</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Mitten in Bad Nauheim: guter Kaffee, Matcha, Acai Bowls und frisch
            zubereitete Bowls in gemütlicher Atmosphäre – zum Reinsetzen oder
            Mitnehmen.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/#menu"
              className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              Menü entdecken
            </Link>
            <Link
              href="/#reservierung"
              className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
            >
              Tisch reservieren
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
            <span>{CAFE_INFO.openingHours}</span>
            <span className="hidden sm:inline">·</span>
            <span>{CAFE_INFO.postalCity}</span>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-green text-cream shadow-xl shadow-ink/10">
            <PendantLampIcon className="h-16 w-16 opacity-90" />
            <p className="font-display px-8 text-center text-xl italic">
              &ldquo;Dear coffee, I love you.&rdquo;
            </p>
            <span className="text-xs uppercase tracking-[0.3em] text-cream/70">Café DOA</span>
          </div>
          <span className="absolute -bottom-5 -left-5 h-24 w-24 rotate-6 rounded-2xl border border-terracotta/40" />
          <span className="absolute -right-4 -top-4 h-16 w-16 -rotate-12 rounded-2xl bg-gold/30" />
        </div>
      </div>
    </section>
  );
}
