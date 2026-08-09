import Image from "next/image";
import { getGalleryImages } from "@/lib/gallery";
import { GALLERY_PLACEHOLDERS, PlaceholderTile } from "./PlaceholderTile";

export default async function Gallery() {
  const images = await getGalleryImages();

  return (
    <section id="galerie" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="eyebrow">Eindrücke</p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-ink sm:text-4xl">
            Ein Blick ins DOA
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.length > 0
            ? images.map((image, index) => (
                <div
                  key={image.url}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-cream-soft"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    // Two columns on phones, three from the sm breakpoint up.
                    sizes="(max-width: 640px) 50vw, (max-width: 1152px) 33vw, 368px"
                    className="object-cover"
                    priority={index < 3}
                  />
                </div>
              ))
            : GALLERY_PLACEHOLDERS.map((variant) => (
                <PlaceholderTile key={variant.key} variant={variant} />
              ))}
        </div>

        {images.length === 0 && (
          <p className="mt-6 text-sm text-ink-soft/60">
            Platzhalter-Motive – echte Fotos erscheinen hier automatisch, sobald sie im
            Supabase-Storage-Bucket &ldquo;gallery&rdquo; hochgeladen werden.
          </p>
        )}
      </div>
    </section>
  );
}
