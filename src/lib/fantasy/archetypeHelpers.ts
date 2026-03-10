import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get image URL(s) for an archetype, with fallback logic.
 * Returns { image1, image2 } where image2 may be null for single-pokemon decks.
 */
export async function getArchetypeImages(
  supabase: SupabaseClient,
  deckName: string,
  image1Fallback?: string | null,
  image2Fallback?: string | null,
): Promise<{ image1: string | null; image2: string | null }> {
  const slug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data } = await supabase
    .from("fantasy_archetypes")
    .select("image_url, image_url_2")
    .eq("slug", slug)
    .maybeSingle();

  return {
    image1: data?.image_url || image1Fallback || null,
    image2: data?.image_url_2 || image2Fallback || null,
  };
}

/**
 * Legacy single-image helper for backwards compatibility.
 */
export async function getArchetypeImage(
  supabase: SupabaseClient,
  deckName: string,
  fallback?: string | null,
): Promise<string | null> {
  const { image1 } = await getArchetypeImages(supabase, deckName, fallback);
  return image1;
}
