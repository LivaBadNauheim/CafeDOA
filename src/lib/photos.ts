export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Two crops of the same shot. A single file cannot serve both a wide banner
 * and a phone screen without either slicing the food away or upscaling, so
 * the layout picks per breakpoint.
 */
export const HERO_PHOTO = {
  alt: "Pochiertes Ei mit Lachs und Avocado neben einem Iced Latte auf dem Holztisch im Café DOA",
  wide: { src: "/fotos/hero-breit.jpg", width: 2560, height: 1440 },
  tall: { src: "/fotos/hero-hoch.jpg", width: 1200, height: 1600 },
} as const;

export const SHARE_IMAGE: Photo = {
  src: "/fotos/hero-breit.jpg",
  alt: "Frühstück im Café DOA",
  width: 2560,
  height: 1440,
};

/** Shipped with the site; replaced by uploads to the Supabase gallery bucket. */
export const GALLERY_PHOTOS: Photo[] = [
  {
    src: "/fotos/01-limonaden.jpg",
    alt: "Vier hausgemachte Limonaden in Gläsern auf dem Holztisch",
    width: 1066,
    height: 1600,
  },
  {
    src: "/fotos/02-smoothies.jpg",
    alt: "Drei Smoothies in Glasflaschen mit Blaubeeren am Strohhalm",
    width: 1066,
    height: 1600,
  },
  {
    src: "/fotos/03-zitronenlimo.jpg",
    alt: "Hausgemachte Zitronenlimonade mit frischen Zitronen",
    width: 1067,
    height: 1600,
  },
  {
    src: "/fotos/04-burrata-brot.jpg",
    alt: "Burrata mit Tomaten, Mandeln und Sauerteigbrot in einer Schale",
    width: 1066,
    height: 1600,
  },
  {
    src: "/fotos/05-fruehstueck-tisch.jpg",
    alt: "Gedeckter Tisch mit pochierten Eiern, Lachs, Iced Latte und Limonade",
    width: 1067,
    height: 1600,
  },
  {
    src: "/fotos/06-bowl-mango-avocado.jpg",
    alt: "Bowl mit Mango, Avocado, Hummus und Minze",
    width: 1067,
    height: 1600,
  },
  {
    src: "/fotos/07-bowls-zum-mitnehmen.jpg",
    alt: "Fünf DOA-Bowls zum Mitnehmen zwischen Grünpflanzen",
    width: 1600,
    height: 1067,
  },
  {
    src: "/fotos/08-mango-kokos.jpg",
    alt: "Mango Sticky Rice mit Kokos und Minze in einer Keramikschale",
    width: 1066,
    height: 1600,
  },
  {
    src: "/fotos/09-doa-becher.jpg",
    alt: "Blauer Smoothie im DOA-Becher neben aufgeschnittener Avocado",
    width: 1067,
    height: 1600,
  },
];
