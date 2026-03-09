import type { SupabaseClient } from "@supabase/supabase-js";
import type { StandingsEntry, SnapshotPayload, ArchetypeResult } from "./types";

/**
 * Normalize a deck name to slug format for matching
 */
function normalizeDeckName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolve a deck name to archetype_id using exact match or alias lookup
 * Returns null if no match found
 */
export async function resolveDeckNameToArchetype(
  supabase: SupabaseClient,
  deckName: string
): Promise<{ id: number; slug: string } | null> {
  const normalized = normalizeDeckName(deckName);

  // Try exact slug match first
  const { data: exactMatch } = await supabase
    .from("fantasy_archetypes")
    .select("id, slug")
    .eq("slug", normalized)
    .maybeSingle();

  if (exactMatch) return exactMatch;

  // Try exact name match (case-insensitive)
  const { data: nameMatch } = await supabase
    .from("fantasy_archetypes")
    .select("id, slug")
    .ilike("name", deckName)
    .maybeSingle();

  if (nameMatch) return nameMatch;

  // Try alias lookup
  const { data: aliasMatch } = await supabase
    .from("fantasy_archetype_aliases")
    .select("archetype_id, archetype:fantasy_archetypes(id, slug)")
    .eq("alias", normalized)
    .maybeSingle();

  if (aliasMatch && aliasMatch.archetype) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arch = Array.isArray(aliasMatch.archetype) ? aliasMatch.archetype[0] : aliasMatch.archetype as any;
    return { id: arch.id, slug: arch.slug };
  }

  return null;
}

/**
 * Convert standings array to SnapshotPayload format
 * Groups by archetype and computes aggregate stats
 */
export async function convertStandingsToPayload(
  supabase: SupabaseClient,
  standings: StandingsEntry[]
): Promise<{ payload: SnapshotPayload; unmatchedDecks: string[] }> {
  const archetypeStats: Record<
    string,
    {
      slug: string;
      name: string;
      placements: number[];
      winRates: number[];
      topCount: number;
      day2Count: number;
      wonCount: number;
    }
  > = {};

  const unmatchedDecks: string[] = [];

  for (const entry of standings) {
    const archetype = await resolveDeckNameToArchetype(supabase, entry.deck_name);

    if (!archetype) {
      unmatchedDecks.push(entry.deck_name);
      continue;
    }

    if (!archetypeStats[archetype.slug]) {
      archetypeStats[archetype.slug] = {
        slug: archetype.slug,
        name: entry.deck_name, // Use original name from standings
        placements: [],
        winRates: [],
        topCount: 0,
        day2Count: 0,
        wonCount: 0,
      };
    }

    const stats = archetypeStats[archetype.slug];
    stats.placements.push(entry.placement);

    // Compute win rate if wins/losses provided
    if (entry.wins !== undefined && entry.losses !== undefined) {
      const total = entry.wins + entry.losses;
      if (total > 0) {
        stats.winRates.push(entry.wins / total);
      }
    }

    // Top 8 check
    if (entry.placement <= 8) {
      stats.topCount++;
    }

    // Day 2 check (top 32 or better placement)
    if (entry.placement <= 32) {
      stats.day2Count++;
    }

    // Winner check
    if (entry.placement === 1) {
      stats.wonCount++;
    }
  }

  // Convert to ArchetypeResult format
  const archetypes: ArchetypeResult[] = Object.values(archetypeStats).map((stats) => {
    const avgWinRate =
      stats.winRates.length > 0
        ? stats.winRates.reduce((a, b) => a + b, 0) / stats.winRates.length
        : 0;

    const bestPlacement = Math.min(...stats.placements);

    return {
      archetype_slug: stats.slug,
      archetype_name: stats.name,
      placement: bestPlacement,
      made_day2: stats.day2Count > 0,
      top8: stats.topCount > 0,
      won: stats.wonCount > 0,
      win_rate: avgWinRate,
      had_win: avgWinRate > 0 || stats.wonCount > 0,
    };
  });

  return {
    payload: {
      archetypes,
      recorded_at: new Date().toISOString(),
    },
    unmatchedDecks: Array.from(new Set(unmatchedDecks)),
  };
}
