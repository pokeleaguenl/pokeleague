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
 * Calculate deck analytics from rk9_standings data using fantasy_archetype_aliases
 */
export async function calculateRK9Analytics(
  supabase: SupabaseClient,
  archetypeName: string,
  tournamentId?: string,
  round?: number
): Promise<RK9Analytics | null> {

  // Get the archetype by name
  let { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("id, name, canonical_id")
    .eq("name", archetypeName)
    .maybeSingle();

  if (!archetype) return null;

  // If this archetype has a canonical_id, use the canonical archetype instead
  if (archetype.canonical_id) {
    const { data: canonical } = await supabase
      .from("fantasy_archetypes")
      .select("id, name")
      .eq("id", archetype.canonical_id)
      .single();
    
    if (canonical) {
      archetype = { ...canonical, canonical_id: null };
    }
  }

  // Fetch all aliases for this archetype
  const { data: aliases } = await supabase
    .from("fantasy_archetype_aliases")
    .select("alias")
    .eq("archetype_id", archetype.id);

  if (!aliases || aliases.length === 0) return null;

  // Get standings matching any of the aliases
  const aliasStrings = aliases.map(a => a.alias);

  const { data: standings } = await supabase
    .from("rk9_standings")
    .select("player_name, rank, country, card_list, decklist_url, archetype, tournament_id")
    .in("archetype", aliasStrings)
    .not("rank", "is", null)
    .order("rank", { ascending: true })
    .limit(10000);

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
