import Image from "next/image";
import { CAFE_INFO } from "@/lib/cafe-info";
import { GALLERY_PHOTOS } from "@/lib/photos";
import { InstagramIcon } from "./icons";

/**
 * Links out to the profile rather than embedding a live feed. An embed would
 * load Meta's scripts on every page view and set cookies before anyone clicks
 * anything, which the privacy policy rules out.
 */
export default function Instagram() {
  const teaser = GALLERY_PHOTOS.slice(0, 4);

  return (
    <section id="instagram" className="bg-cream-soft py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Was gerade läuft
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-ink-soft">
              Neue Drinks, Specials und was sonst so ansteht, posten wir auf
              Instagram.
            </p>
            <a
              href={CAFE_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              <InstagramIcon className="h-5 w-5" />
              {CAFE_INFO.instagramHandle}
            </a>
          </div>

          <a
            href={CAFE_INFO.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="group grid grid-cols-4 gap-2 sm:gap-3"
            aria-label={`Café DOA auf Instagram: ${CAFE_INFO.instagramHandle}`}
          >
            {teaser.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-square overflow-hidden rounded-xl bg-cream"
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, 160px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </a>
        </div>
      </div>
    </section>
  );
}
