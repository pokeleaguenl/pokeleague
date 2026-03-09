import type { SupabaseClient } from "@supabase/supabase-js";
import type { StandingsSnapshot, ArchetypeScoreLive, TeamScoreLive } from "./types";

/**
 * Fetch the latest snapshot for a fantasy event.
 */
export async function getLatestSnapshot(
  supabase: SupabaseClient,
  fantasyEventId: number
): Promise<StandingsSnapshot | null> {
  const { data } = await supabase
    .from("fantasy_standings_snapshots")
    .select("*")
    .eq("fantasy_event_id", fantasyEventId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as StandingsSnapshot | null;
}

/**
 * Write archetype score results to fantasy_archetype_scores_live.
 */
export async function upsertArchetypeScores(
  supabase: SupabaseClient,
  scores: Omit<ArchetypeScoreLive, "computed_at">[]
): Promise<void> {
  if (scores.length === 0) return;
  await supabase.from("fantasy_archetype_scores_live").upsert(
    scores.map((s) => ({ ...s, computed_at: new Date().toISOString() })),
    { onConflict: "fantasy_event_id,archetype_id" }
  );
}

/**
 * Write team score results to fantasy_team_scores_live.
 */
export async function upsertTeamScores(
  supabase: SupabaseClient,
  scores: Omit<TeamScoreLive, "computed_at">[]
): Promise<void> {
  if (scores.length === 0) return;
  await supabase.from("fantasy_team_scores_live").upsert(
    scores.map((s) => ({ ...s, computed_at: new Date().toISOString() })),
    { onConflict: "fantasy_event_id,user_id" }
  );
}
