import type { SupabaseClient } from "@supabase/supabase-js";

export interface RK9Analytics {
  // Metadata
  variantName: string; // The actual archetype name used (may differ from requested if fallback to variant)
  isVariant: boolean;  // True if this is a variant fallback, not exact match
  
  // Top Stats
  totalPlayers: number;
  metaShare: number;
  bestRank: number;
  avgRank: number;
  
  // Placement Breakdown
  placementBreakdown: {
    top8: number;
    top16: number;
    top32: number;
    top64: number;
  };
  
  // Conversion Rates
  top8Conversion: number;
  top16Conversion: number;
  top32Conversion: number;
  top64Conversion: number;
  
  // Representative Decklist
  representativeDecklist: {
    playerName: string;
    rank: number;
    cardList: string;
    decklistUrl: string;
  } | null;
  
  // Top Finishers
  topFinishers: {
    playerName: string;
    rank: number;
    country: string;
  }[];
}

/**
 * Calculate deck analytics from rk9_standings data
 * If no exact match found, looks for the most popular variant
 */
export async function calculateRK9Analytics(
  supabase: SupabaseClient,
  archetypeName: string,
  tournamentId?: string,
  round?: number
): Promise<RK9Analytics | null> {

  // Fetch all aliases for this archetype name to match variants
  const { data: aliasRows } = await supabase
    .from("fantasy_archetype_aliases")
    .select("alias, fantasy_archetypes!inner(name)")
    .eq("fantasy_archetypes.name", archetypeName);

  // Build set of archetype names to match (canonical + any stored as exact archetype strings)
  // We query rk9_standings directly by archetype name across ALL tournaments
  // Get all archetype names that map to this canonical via aliases
  const { data: aliasMatches } = await supabase
    .from("fantasy_archetype_aliases")
    .select("alias, fantasy_archetypes!inner(name)")
    .filter("fantasy_archetypes.name", "eq", archetypeName);

  // Also get direct canonical match
  const { data: canonical } = await supabase
    .from("fantasy_archetypes")
    .select("name")
    .eq("name", archetypeName)
    .maybeSingle();

  // Build query using the first-token prefix match to catch all variants
  const firstToken = archetypeName.split(" /")[0].split(" ex")[0];
  
  let { data: standings } = await supabase
    .from("rk9_standings")
    .select("player_name, rank, country, card_list, decklist_url, archetype, tournament_id")
    .ilike("archetype", `${firstToken}%`)
    .not("rank", "is", null)
    .order("rank", { ascending: true })
    .limit(10000);

  // Filter to only archetypes that resolve to this canonical
  if (standings && standings.length > 0) {
    // Keep only exact name matches or known alias matches
    const validNames = new Set<string>([archetypeName]);
    // Add slug-matched names
    standings.forEach(s => {
      if (s.archetype && s.archetype.toLowerCase().startsWith(firstToken.toLowerCase())) {
        validNames.add(s.archetype);
      }
    });
    standings = standings.filter(s => validNames.has(s.archetype));
  }

  if (!standings || standings.length === 0) return null;

  const actualArchetypeName = standings[0]?.archetype || archetypeName;
  const isVariant = actualArchetypeName !== archetypeName;

  // Get total player count across all tournaments for meta share
  const { count: totalPlayerCount } = await supabase
    .from("rk9_standings")
    .select("*", { count: 'exact', head: true })
    .not("archetype", "is", null)
    .not("rank", "is", null);

  const totalPlayers = standings.length;
  const metaShare = totalPlayerCount 
    ? parseFloat(((totalPlayers / totalPlayerCount) * 100).toFixed(2))
    : 0;

  // Calculate rank stats
  const ranks = standings.map(s => s.rank);
  const bestRank = Math.min(...ranks);
  const avgRank = Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);

  // Placement breakdown
  const placementBreakdown = {
    top8: standings.filter(s => s.rank <= 8).length,
    top16: standings.filter(s => s.rank <= 16).length,
    top32: standings.filter(s => s.rank <= 32).length,
    top64: standings.filter(s => s.rank <= 64).length,
  };

  // Conversion rates (% of players who made each cut)
  const top8Conversion = parseFloat(((placementBreakdown.top8 / totalPlayers) * 100).toFixed(1));
  const top16Conversion = parseFloat(((placementBreakdown.top16 / totalPlayers) * 100).toFixed(1));
  const top32Conversion = parseFloat(((placementBreakdown.top32 / totalPlayers) * 100).toFixed(1));
  const top64Conversion = parseFloat(((placementBreakdown.top64 / totalPlayers) * 100).toFixed(1));

  // Representative decklist (from best finisher)
  const topFinisher = standings[0]; // Already sorted by rank ascending
  const representativeDecklist = topFinisher ? {
    playerName: topFinisher.player_name,
    rank: topFinisher.rank,
    cardList: topFinisher.card_list || "",
    decklistUrl: topFinisher.decklist_url || "",
  } : null;

  // Top 5 finishers
  const topFinishers = standings.slice(0, 5).map(s => ({
    playerName: s.player_name,
    rank: s.rank,
    country: s.country || "??",
  }));

  return {
    variantName: actualArchetypeName,
    isVariant,
    totalPlayers,
    metaShare,
    bestRank,
    avgRank,
    placementBreakdown,
    top8Conversion,
    top16Conversion,
    top32Conversion,
    top64Conversion,
    representativeDecklist,
    topFinishers,
  };
}
