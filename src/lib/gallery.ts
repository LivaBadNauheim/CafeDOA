import { getSupabaseClient } from "@/lib/supabase";

const GALLERY_BUCKET = "gallery";

export type GalleryImage = {
  url: string;
  name: string;
  alt: string;
};

/**
 * Turns a file name into readable alt text, so the café can describe a photo
 * by naming the file. A leading sort prefix ("01_", "02-") is stripped, as is
 * the extension: "02_gemuetliche-fensterplaetze.jpg" becomes
 * "Gemütliche fensterplaetze". Falls back to a generic description.
 */
function altFromFileName(fileName: string): string {
  const generic = "Impression aus dem Café DOA";
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const withoutSortPrefix = withoutExtension.replace(/^\d+\s*[_-]\s*/, "");
  const words = withoutSortPrefix.replace(/[_-]+/g, " ").trim();

  if (!words) return generic;
  // Camera defaults (IMG_2029, DSC0001, PXL_20240101) describe nothing, so
  // they make worse alt text than a plain generic description.
  if (/^(img|dsc|dscf|dji|pxl|photo|foto|screenshot)[\s\d]/i.test(words)) return generic;
  if (/^\d+$/.test(words)) return generic;

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} – Café DOA`;
}

/**
 * Reads photos from the public "gallery" bucket in Supabase Storage.
 * Returns an empty array when Supabase isn't configured yet, or the
 * bucket has no files - callers fall back to placeholder tiles in that case.
 *
 * Files are listed by name, so prefixing them ("01_", "02_") controls the
 * order they appear in on the page.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).list("", {
    limit: 24,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data) return [];

  return data
    .filter((file) => file.id !== null && !file.name.startsWith("."))
    .map((file) => {
      const { data: publicUrl } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(file.name);
      return {
        url: publicUrl.publicUrl,
        name: file.name,
        alt: altFromFileName(file.name),
      };
    });
}
