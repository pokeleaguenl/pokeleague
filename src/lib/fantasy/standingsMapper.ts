import type { SupabaseClient } from "@supabase/supabase-js";
import type { StandingsEntry, SnapshotPayload, ArchetypeResult } from "./types";

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Convert standings array to SnapshotPayload.
 * Pre-loads all archetypes + aliases in 3 bulk queries then resolves in-memory.
 * This avoids N×3 sequential DB round trips for large tournaments.
 */
export async function convertStandingsToPayload(
  supabase: SupabaseClient,
  standings: StandingsEntry[]
): Promise<{ payload: SnapshotPayload; unmatchedDecks: string[] }> {

  // --- 1. Bulk-load lookup tables ---
  const [{ data: archetypesRaw }, { data: aliasesRaw }] = await Promise.all([
    supabase.from("fantasy_archetypes").select("id, name, slug"),
    supabase.from("fantasy_archetype_aliases").select("archetype_id, alias"),
  ]);

  // Build slug → { id, slug } and name (lower) → { id, slug } maps
  const bySlug = new Map<string, { id: number; slug: string }>();
  const byName = new Map<string, { id: number; slug: string }>();
  for (const a of archetypesRaw ?? []) {
    bySlug.set(a.slug as string, { id: a.id as number, slug: a.slug as string });
    byName.set((a.name as string).toLowerCase(), { id: a.id as number, slug: a.slug as string });
  }

  // Alias → archetype id (alias stored normalised)
  const byAlias = new Map<string, number>();
  for (const al of aliasesRaw ?? []) {
    byAlias.set((al.alias as string).toLowerCase(), al.archetype_id as number);
  }

  function resolveInMemory(deckName: string): { id: number; slug: string } | null {
    const slug = normalizeSlug(deckName);
    if (bySlug.has(slug)) return bySlug.get(slug)!;
    if (byName.has(deckName.toLowerCase())) return byName.get(deckName.toLowerCase())!;
    // alias lookup
    const archId = byAlias.get(slug) ?? byAlias.get(deckName.toLowerCase());
    if (archId) {
      const found = [...bySlug.values()].find(a => a.id === archId);
      if (found) return found;
    }
    return null;
  }

  // --- 2. Group standings by archetype slug ---
  const archetypeStats: Record<string, {
    slug: string; name: string;
    placements: number[];
    winRates: number[];
    topCount: number; day2Count: number; wonCount: number;
  }> = {};
  const unmatchedSet = new Set<string>();

  for (const entry of standings) {
    const archetype = resolveInMemory(entry.deck_name);
    if (!archetype) { unmatchedSet.add(entry.deck_name); continue; }

    if (!archetypeStats[archetype.slug]) {
      archetypeStats[archetype.slug] = {
        slug: archetype.slug, name: entry.deck_name,
        placements: [], winRates: [], topCount: 0, day2Count: 0, wonCount: 0,
      };
    }
    const stats = archetypeStats[archetype.slug];
    stats.placements.push(entry.placement);

    if (entry.wins !== undefined && entry.losses !== undefined) {
      const total = entry.wins + entry.losses;
      if (total > 0) stats.winRates.push(entry.wins / total);
    }
    if (entry.placement <= 8)  stats.topCount++;
    if (entry.placement <= 32) stats.day2Count++;
    if (entry.placement === 1) stats.wonCount++;
  }

  // --- 3. Convert to ArchetypeResult ---
  const archetypes: ArchetypeResult[] = Object.values(archetypeStats).map((stats) => {
    const avgWinRate = stats.winRates.length > 0
      ? stats.winRates.reduce((a, b) => a + b, 0) / stats.winRates.length
      : 0;
    const bestPlacement = stats.placements.length > 0 ? Math.min(...stats.placements) : 0;
    const variantName = stats.name.includes(" / ") ? stats.name : undefined;

    return {
      archetype_slug: stats.slug,
      archetype_name: stats.name,
      variant_name: variantName,
      placement: bestPlacement,
      best_rank: bestPlacement,
      top32_count: stats.day2Count,
      top8_count: stats.topCount,
      made_day2: stats.day2Count > 0,
      top8: stats.topCount > 0,
      top16: bestPlacement <= 16,
      top4: bestPlacement <= 4,
      top2: bestPlacement <= 2,
      won: stats.wonCount > 0,
      win_rate: avgWinRate,
      had_win: avgWinRate > 0 || stats.wonCount > 0,
    };
  });

  return {
    payload: { archetypes, recorded_at: new Date().toISOString() },
    unmatchedDecks: [...unmatchedSet],
  };
}
