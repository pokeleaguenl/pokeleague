import type { SupabaseClient } from "@supabase/supabase-js";
import { calcArchetypeBasePoints, applyMultiplier } from "./bracketScoring";
import { upsertArchetypeScores, upsertTeamScores } from "./storage";
import type { SnapshotPayload, TeamScoreBreakdown, SlotScore } from "./types";

/**
 * Triggered when a new snapshot arrives.
 * Computes archetype scores + team scores and writes to live tables.
 * This is the ONLY place score computation happens.
 */

interface SquadRow {
  user_id: string;
  active_deck_id: number | null;
  active_variant: string | null;
  bench_1: number | null; bench_1_variant: string | null;
  bench_2: number | null; bench_2_variant: string | null;
  bench_3: number | null; bench_3_variant: string | null;
  bench_4: number | null; bench_4_variant: string | null;
  bench_5: number | null; bench_5_variant: string | null;
  hand_1: number | null; hand_1_variant: string | null;
  hand_2: number | null; hand_2_variant: string | null;
  hand_3: number | null; hand_3_variant: string | null;
  hand_4: number | null; hand_4_variant: string | null;
  event_effect: "x3" | "hand_boost" | null;
}

const BENCH_SLOTS = ["bench_1", "bench_2", "bench_3", "bench_4", "bench_5"] as const;
const HAND_SLOTS  = ["hand_1",  "hand_2",  "hand_3",  "hand_4"]            as const;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function processSnapshot(
  supabase: SupabaseClient,
  fantasyEventId: number,
  payload: SnapshotPayload
): Promise<{ archetypesScored: number; teamsScored: number; warnings: string[] }> {
  const warnings: string[] = [];

  // 1. Build archetype slug → data map (points + placement)
  const archetypeData: Record<string, { points: number; placement: number | null }> = {};
  for (const result of payload.archetypes) {
    archetypeData[result.archetype_slug] = {
      points: calcArchetypeBasePoints(result),
      placement: result.placement ?? null,
    };
  }

  // 2. Resolve archetype slugs to IDs and upsert scores
  const slugs = Object.keys(archetypeData);
  const archetypeScores: Parameters<typeof upsertArchetypeScores>[1] = [];

  if (slugs.length > 0) {
    const { data: archetypes } = await supabase
      .from("fantasy_archetypes")
      .select("id, slug")
      .in("slug", slugs);

    for (const arch of archetypes ?? []) {
      const data = archetypeData[arch.slug];
      archetypeScores.push({
        fantasy_event_id: fantasyEventId,
        archetype_id: arch.id,
        points: data?.points ?? 0,
        placement: data?.placement ?? null,
      });
    }
    await upsertArchetypeScores(supabase, archetypeScores);
  }

  // 3. Compute team scores from squads
  const { data: rawSquads } = await supabase.from("squads").select(
    "user_id, active_deck_id, active_variant, " +
    "bench_1, bench_1_variant, bench_2, bench_2_variant, bench_3, bench_3_variant, " +
    "bench_4, bench_4_variant, bench_5, bench_5_variant, " +
    "hand_1, hand_1_variant, hand_2, hand_2_variant, hand_3, hand_3_variant, hand_4, hand_4_variant, " +
    "event_effect"
  );
  const squads = (rawSquads ?? []) as unknown as SquadRow[];
  const teamScores: Parameters<typeof upsertTeamScores>[1] = [];

  // Batch load all decks upfront to avoid N+1
  const allDeckIds = new Set<number>();
  for (const s of squads) {
    if (s.active_deck_id) allDeckIds.add(s.active_deck_id);
    for (const k of BENCH_SLOTS) if (s[k]) allDeckIds.add(s[k]!);
    for (const k of HAND_SLOTS)  if (s[k]) allDeckIds.add(s[k]!);
  }

  const { data: allDecks } = await supabase
    .from("decks").select("id, name").in("id", [...allDeckIds]);
  const deckMap = new Map((allDecks ?? []).map(d => [d.id, d.name]));

  for (const s of squads) {
    const eventEffect = s.event_effect;
    const breakdown: TeamScoreBreakdown = { slots: [], total: 0 };

    const processSlot = (
      deckId: number | null,
      slotName: string,
      zone: "active" | "bench" | "hand",
      variantName: string | null
    ) => {
      if (!deckId) return;

      const deckName = deckMap.get(deckId);
      if (!deckName) {
        warnings.push(`[${s.user_id}] slot=${slotName} deck_id=${deckId} not found in decks table`);
        // Still add a zero-point slot so the breakdown is complete
        breakdown.slots.push({
          slot: slotName,
          archetype_slug: null,
          variant_name: null,
          base_points: 0,
          multiplier: 0,
          final_points: 0,
          warning: `Deck id=${deckId} not found`,
        });
        return;
      }

      const baseSlug = slugify(deckName);

      // Match by variant first (exact variant_name match), then by slug, then by name
      const matchedResult =
        (variantName
          ? payload.archetypes.find(a => a.variant_name === variantName)
          : null) ??
        payload.archetypes.find(a => a.archetype_slug === baseSlug) ??
        payload.archetypes.find(a =>
          a.archetype_name.toLowerCase() === deckName.toLowerCase()
        );

      if (!matchedResult) {
        warnings.push(`[${s.user_id}] slot=${slotName} deck="${deckName}" not in snapshot (0 pts)`);
      }

      const basePoints  = matchedResult ? calcArchetypeBasePoints(matchedResult) : 0;
      const multiplier  = zone === "active"
        ? (eventEffect === "x3" ? 3 : 2)
        : zone === "bench" ? 1
        : (eventEffect === "hand_boost" ? 1 : 0);
      const finalPoints = applyMultiplier(basePoints, zone, eventEffect);

      const slotScore: SlotScore = {
        slot: slotName,
        archetype_slug: baseSlug,
        variant_name: matchedResult?.variant_name ?? variantName ?? null,
        base_points: basePoints,
        multiplier,
        final_points: finalPoints,
      };
      breakdown.slots.push(slotScore);
      breakdown.total += finalPoints;
    };

    processSlot(s.active_deck_id, "active", "active", s.active_variant);
    for (const k of BENCH_SLOTS) processSlot(s[k], k, "bench", s[`${k}_variant`]);
    for (const k of HAND_SLOTS)  processSlot(s[k], k, "hand",  s[`${k}_variant`]);

    teamScores.push({
      fantasy_event_id: fantasyEventId,
      user_id: s.user_id,
      points: breakdown.total,
      breakdown,
    });
  }

  await upsertTeamScores(supabase, teamScores);

  return { archetypesScored: archetypeScores.length, teamsScored: teamScores.length, warnings };
}
