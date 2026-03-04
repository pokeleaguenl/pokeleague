import type { SupabaseClient } from "@supabase/supabase-js";
import { calcArchetypeBasePoints, applyMultiplier } from "./bracketScoring";
import { upsertArchetypeScores, upsertTeamScores } from "./storage";
import type { SnapshotPayload, TeamScoreBreakdown, SlotScore } from "./types";

/**
 * Triggered when a new snapshot arrives.
 * Computes archetype scores + team scores and writes to live tables.
 * This is the ONLY place score computation happens.
 */
export async function processSnapshot(
  supabase: SupabaseClient,
  fantasyEventId: number,
  payload: SnapshotPayload
): Promise<{ archetypesScored: number; teamsScored: number }> {

  // 1. Build archetype slug → base points map
  const archetypePoints: Record<string, number> = {};
  for (const result of payload.archetypes) {
    archetypePoints[result.archetype_slug] = calcArchetypeBasePoints(result);
  }

  // 2. Resolve archetype slugs to IDs
  const slugs = Object.keys(archetypePoints);
  const archetypeScores: Parameters<typeof upsertArchetypeScores>[1] = [];

  if (slugs.length > 0) {
    const { data: archetypes } = await supabase
      .from("fantasy_archetypes")
      .select("id, slug")
      .in("slug", slugs);

    for (const arch of archetypes ?? []) {
      archetypeScores.push({
        fantasy_event_id: fantasyEventId,
        archetype_id: arch.id,
        points: archetypePoints[arch.slug] ?? 0,
        placement: null,
      });
    }
    await upsertArchetypeScores(supabase, archetypeScores);
  }

  // 3. Compute team scores from squads
  const { data: squads } = await supabase.from("squads").select("*");
  const teamScores: Parameters<typeof upsertTeamScores>[1] = [];

  const BENCH_SLOTS = ["bench_1", "bench_2", "bench_3", "bench_4", "bench_5"] as const;
  const HAND_SLOTS = ["hand_1", "hand_2", "hand_3", "hand_4"] as const;

  for (const squad of squads ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = squad as any;
    const eventEffect = s.event_effect as "x3" | "hand_boost" | null;
    const breakdown: TeamScoreBreakdown = { slots: [], total: 0 };

    const processSlot = async (
      deckId: number | null,
      slotName: string,
      zone: "active" | "bench" | "hand"
    ) => {
      if (!deckId) return;
      const { data: deck } = await supabase
        .from("decks")
        .select("name")
        .eq("id", deckId)
        .maybeSingle();

      if (!deck) return;
      // Match deck name to archetype slug via aliases or direct name
      const deckName = deck.name as string;
      const baseSlug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // Try to find matching archetype result in snapshot
      const matchedResult = payload.archetypes.find(
        (a) => a.archetype_slug === baseSlug ||
               a.archetype_name.toLowerCase() === deckName.toLowerCase()
      );
      const basePoints = matchedResult ? calcArchetypeBasePoints(matchedResult) : 0;
      const finalPoints = applyMultiplier(basePoints, zone, eventEffect);

      const slotScore: SlotScore = {
        slot: slotName,
        archetype_slug: baseSlug,
        base_points: basePoints,
        multiplier: zone === "active" ? (eventEffect === "x3" ? 3 : 2) : zone === "bench" ? 1 : (eventEffect === "hand_boost" ? 1 : 0),
        final_points: finalPoints,
      };
      breakdown.slots.push(slotScore);
      breakdown.total += finalPoints;
    };

    await processSlot(s.active_deck_id, "active", "active");
    for (const k of BENCH_SLOTS) await processSlot(s[k], k, "bench");
    for (const k of HAND_SLOTS) await processSlot(s[k], k, "hand");

    teamScores.push({
      fantasy_event_id: fantasyEventId,
      user_id: s.user_id,
      points: breakdown.total,
      breakdown,
    });
  }

  await upsertTeamScores(supabase, teamScores);

  return { archetypesScored: archetypeScores.length, teamsScored: teamScores.length };
}
