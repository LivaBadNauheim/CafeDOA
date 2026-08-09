import { getSupabaseClient } from "@/lib/supabase";

const GALLERY_BUCKET = "gallery";

export type GalleryImage = {
  url: string;
  name: string;
};

/**
 * Reads photos from the public "gallery" bucket in Supabase Storage.
 * Returns an empty array when Supabase isn't configured yet, or the
 * bucket has no files - callers fall back to placeholder tiles in that case.
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
      return { url: publicUrl.publicUrl, name: file.name };
    });
}
