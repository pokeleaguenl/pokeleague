import type { SupabaseClient } from "@supabase/supabase-js";

export interface RK9Analytics {
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
 */
export async function calculateRK9Analytics(
  supabase: SupabaseClient,
  archetypeName: string,
  tournamentId: string = 'SG0167ss5UCjklsDaPrA',
  round: number = 18
): Promise<RK9Analytics | null> {
  
  // Fetch all standings for this archetype
  const { data: standings, error: standingsError } = await supabase
    .from("rk9_standings")
    .select("player_name, rank, country, card_list, decklist_url")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .eq("archetype", archetypeName)
    .order("rank", { ascending: true });

  if (standingsError) {
    console.error("[rk9Analytics] Error fetching standings:", standingsError);
    return null;
  }

  if (!standings || standings.length === 0) {
    console.log(`[rk9Analytics] No standings found for ${archetypeName}`);
    return null;
  }

  // Get total player count for meta share calculation
  const { count: totalPlayerCount } = await supabase
    .from("rk9_standings")
    .select("*", { count: 'exact', head: true })
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .not("archetype", "is", null);

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
