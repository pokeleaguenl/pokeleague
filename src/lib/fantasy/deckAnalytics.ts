import type { SupabaseClient } from "@supabase/supabase-js";

export interface DeckAnalytics {
  // Top Stats
  fantasyPoints: number;
  pointsPerEvent: number;
  recentForm: number; // Points from last 3 events
  
  // Core Metrics
  metaShare: number;
  metaRank: number;
  winRate: number | null;
  day2Conversion: number | null;
  top32Conversion: number | null;
  
  // Tournament Results
  tournamentResults: {
    eventName: string;
    eventDate: string;
    placement: number;
    points: number;
    top32Copies?: number;
  }[];
  
  // Placement Breakdown
  placementBreakdown: {
    top64: number;
    top32: number;
    top16: number;
    top8: number;
    finals: number; // Top 4
    wins: number;
  };
  
  // Meta Efficiency
  metaEfficiency: {
    score: number;
    top32Share: number;
    metaShare: number;
    description: string;
  };
  
  // Future: Ownership, Matchups, Radar
  ownership?: {
    selectedBy: number;
    captainRate: number;
    transfersIn: number;
    transfersOut: number;
  };
}

/**
 * Calculate comprehensive deck analytics from available data
 */
export async function calculateDeckAnalytics(
  supabase: SupabaseClient,
  archetypeId: number,
  deckData?: { meta_share?: number; cost?: number }
): Promise<DeckAnalytics> {
  
  // Fetch variant archetype IDs that roll up to this canonical
  const { data: variants, error: variantsError } = await supabase
    .from("fantasy_archetypes")
    .select("id")
    .eq("canonical_id", archetypeId);

  if (variantsError) {
    console.warn("[deckAnalytics] canonical_id query failed (column may not exist yet):", variantsError.message);
  }

  const allArchetypeIds = [archetypeId, ...(variants?.map(v => v.id) ?? [])];

  // Fetch all scores for this archetype AND its variants
  const { data: scores, error: scoresError } = await supabase
    .from("fantasy_archetype_scores_live")
    .select("*, event:fantasy_events(id, name, event_date, status)")
    .in("archetype_id", allArchetypeIds)
    .order("computed_at", { ascending: false });

  if (scoresError) {
    console.error("[deckAnalytics] Error fetching scores:", scoresError);
  }

  type ScoreRow = { event: unknown; points?: number; placement?: number; win_rate?: number };

  // Deduplicate by event - keep best placement (highest points) per event
  const eventMap = new Map<number, { eventName: string; eventDate: string; placement: number; points: number }>();
  for (const s of (scores || []) as ScoreRow[]) {
    const event = s.event;
    const eventData = (Array.isArray(event) ? event[0] : event) as { id?: number; name?: string; event_date?: string } | null;
    const eventId = eventData?.id;
    if (!eventId) continue;

    const existing = eventMap.get(eventId);
    const points = s.points || 0;
    const placement = s.placement || 0;

    if (!existing || points > existing.points) {
      eventMap.set(eventId, {
        eventName: eventData?.name || "Unknown Event",
        eventDate: eventData?.event_date || "",
        placement,
        points,
      });
    }
  }
  const tournamentResults = Array.from(eventMap.values())
    .sort((a, b) => b.points - a.points);

  // Total fantasy points
  const fantasyPoints = scores?.reduce((sum, s) => sum + ((s as ScoreRow).points || 0), 0) || 0;

  // Points per event
  const eventCount = eventMap.size || 0;
  const pointsPerEvent = eventCount > 0 ? Math.round(fantasyPoints / eventCount) : 0;

  // Recent form (last 3 events)
  const recentForm = scores?.slice(0, 3).reduce((sum, s) => sum + ((s as ScoreRow).points || 0), 0) || 0;

  // Placement breakdown
  const placementBreakdown = {
    top64: 0,
    top32: 0,
    top16: 0,
    top8: 0,
    finals: 0,
    wins: 0,
  };

  scores?.forEach(s => {
    const placement = (s as ScoreRow).placement;
    if (!placement || placement === 0) return; // Skip if no placement data
    
    if (placement <= 64) placementBreakdown.top64++;
    if (placement <= 32) placementBreakdown.top32++;
    if (placement <= 16) placementBreakdown.top16++;
    if (placement <= 8) placementBreakdown.top8++;
    if (placement <= 4) placementBreakdown.finals++;
    if (placement === 1) placementBreakdown.wins++;
  });

  // Conversion rates
  const top32Conversion = eventCount > 0 
    ? Math.round((placementBreakdown.top32 / eventCount) * 100) 
    : null;

  const day2Conversion = eventCount > 0
    ? Math.round((placementBreakdown.top32 / eventCount) * 100) // Using top32 as proxy for day2
    : null;

  // Meta efficiency
  const metaShare = deckData?.meta_share || 0;
  const cost = deckData?.cost || 1;
  const top32Share = eventCount > 0
    ? (placementBreakdown.top32 / eventCount) * 100
    : 0;

  const efficiencyScore = metaShare > 0 ? top32Share / metaShare : 0;

  let efficiencyDescription = "Standard meta performance";
  if (efficiencyScore >= 2) {
    efficiencyDescription = "Highly efficient deck performing almost 2x better than expected based on play rate";
  } else if (efficiencyScore >= 1.5) {
    efficiencyDescription = "Very efficient deck outperforming its meta share significantly";
  } else if (efficiencyScore < 0.7) {
    efficiencyDescription = "Underperforming relative to play rate - may need optimization";
  }

  const metaEfficiency = {
    score: parseFloat(efficiencyScore.toFixed(2)),
    top32Share: parseFloat(top32Share.toFixed(1)),
    metaShare,
    description: efficiencyDescription,
  };

  // Calculate average win rate from scores that have win_rate data
  const winRates = (scores || [])
    .map(s => (s as ScoreRow).win_rate)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const winRate = winRates.length > 0
    ? parseFloat((winRates.reduce((a, b) => a + b, 0) / winRates.length).toFixed(2))
    : null;

  return {
    fantasyPoints,
    pointsPerEvent,
    recentForm,
    metaShare,
    metaRank: 0, // Will be set by caller after sorting all decks
    winRate,
    day2Conversion,
    top32Conversion,
    tournamentResults,
    placementBreakdown,
    metaEfficiency,
  };
}
