import Image from "next/image";
import { getGalleryImages } from "@/lib/gallery";
import { GALLERY_PHOTOS } from "@/lib/photos";

export default async function Gallery() {
  // Uploads to the Supabase bucket replace the set that ships with the site.
  const uploaded = await getGalleryImages();
  const photos =
    uploaded.length > 0
      ? uploaded.map((image) => ({ src: image.url, alt: image.alt }))
      : GALLERY_PHOTOS.map((photo) => ({ src: photo.src, alt: photo.alt }));

  return (
    <section id="galerie" className="bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Bei uns</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.src}
              className="relative aspect-square overflow-hidden rounded-2xl bg-cream-soft"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1152px) 33vw, 368px"
                className="object-cover"
                loading={index < 3 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
