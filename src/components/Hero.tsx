import Image from "next/image";
import Link from "next/link";
import { HERO_PHOTO } from "@/lib/photos";

export default function Hero() {
  return (
    <section id="top" className="bg-cream pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            Coffee, Breakfast{" "}
            <span className="italic text-terracotta">&amp; Lunch</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            Matcha, Bowls und Limo, die wir selbst ansetzen. Hauptstraße 11,
            mitten in Bad Nauheim, täglich ab 9:30 Uhr.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#menu"
              className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              Zur Karte
            </Link>
            <Link
              href="/#reservierung"
              className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
            >
              Tisch reservieren
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/10 pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-soft/70">Geöffnet</dt>
              <dd className="mt-0.5 font-medium text-ink">Täglich 9:30–19 Uhr</dd>
            </div>
            <div>
              <dt className="text-ink-soft/70">Küche</dt>
              <dd className="mt-0.5 font-medium text-ink">Mo–Sa bis 19:45</dd>
            </div>
            <div>
              <dt className="text-ink-soft/70">Zum Mitnehmen</dt>
              <dd className="mt-0.5 font-medium text-ink">Gibt es alles</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover"
              priority
            />
          </div>
          <span className="pointer-events-none absolute -bottom-4 -left-4 -z-10 h-28 w-28 rounded-2xl bg-green/15" />
          <span className="pointer-events-none absolute -right-3 -top-3 -z-10 h-20 w-20 rounded-2xl bg-terracotta/15" />
        </div>
      </div>
    </section>
  );
}
