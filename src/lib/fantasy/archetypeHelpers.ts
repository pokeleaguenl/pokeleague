import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extract the base archetype name from a variant.
 * E.g., "Charizard ex / Pidgeot ex" → "Charizard ex"
 */
export function getBaseArchetypeName(name: string): string {
  // If it contains a slash, take the first part
  if (name.includes(' / ')) {
    return name.split(' / ')[0].trim();
  }
  return name;
}

/**
 * Get image URL for a deck, falling back to base archetype if needed
 */
export async function getArchetypeImage(
  supabase: SupabaseClient,
  archetypeName: string,
  currentImageUrl?: string | null
): Promise<string | null> {
  // If we already have an image, use it
  if (currentImageUrl) {
    return currentImageUrl;
  }

  // Try to find base archetype image
  const baseName = getBaseArchetypeName(archetypeName);
  
  if (baseName !== archetypeName) {
    // This is a variant, look up the base archetype
    const { data: baseArchetype } = await supabase
      .from("fantasy_archetypes")
      .select("image_url")
      .eq("name", baseName)
      .maybeSingle();
    
    if (baseArchetype?.image_url) {
      return baseArchetype.image_url;
    }
  }

  return null;
}

/**
 * Convert archetype name to slug format
 */
export function archetypeNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
