import Image from "next/image";
import Link from "next/link";
import { HERO_PHOTO } from "@/lib/photos";

const FACTS = [
  { label: "Geöffnet", value: "Täglich 9:30–19 Uhr" },
  { label: "Küche", value: "Täglich bis 18 Uhr" },
  { label: "Zum Mitnehmen", value: "Gibt es alles" },
];

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-ink">
      {/* Two crops of one shot: a wide banner would slice the food away on a
          phone, a tall one would need upscaling on a desktop. */}
      <Image
        src={HERO_PHOTO.tall.src}
        alt={HERO_PHOTO.alt}
        fill
        sizes="100vw"
        className="object-cover object-center sm:hidden"
        priority
      />
      <Image
        src={HERO_PHOTO.wide.src}
        alt=""
        fill
        sizes="100vw"
        className="hidden object-cover object-center sm:block"
        priority
      />

      {/* Darkened in the café's own ink and green rather than plain black, so
          the photo keeps its warmth while the text stays readable. The
          horizontal gradient carries wide screens, the vertical one phones,
          where the text sits over the middle of the frame. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink/85 sm:bg-gradient-to-r sm:from-ink/90 sm:via-ink/70 sm:to-ink/25"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-green/25 mix-blend-multiply" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[34rem] max-w-6xl items-center px-5 py-20 sm:min-h-[38rem] sm:px-8 sm:py-24">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-cream sm:text-5xl lg:text-6xl">
            Coffee, Breakfast{" "}
            <span className="italic text-terracotta-light">&amp; Lunch</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/90">
            Matcha, Bowls und Limo, die wir selbst ansetzen. Hauptstraße 11,
            mitten in Bad Nauheim, täglich ab 9:30 Uhr.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#menu"
              className="rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-cream-soft"
            >
              Zur Karte
            </Link>
            <Link
              href="/#reservierung"
              className="rounded-full border border-cream/40 px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream/80 hover:bg-cream/10"
            >
              Tisch reservieren
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-cream/20 pt-6 text-sm sm:grid-cols-3">
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-cream/60">{fact.label}</dt>
                <dd className="mt-0.5 font-medium text-cream">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
