import type { SupabaseClient } from "@supabase/supabase-js";
import { calcArchetypeBasePoints, applyMultiplier } from "./bracketScoring";
import { upsertArchetypeScores, upsertTeamScores } from "./storage";
import type { SnapshotPayload, TeamScoreBreakdown, SlotScore } from "./types";
import { FANTASY_CONFIG } from "./config";

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
  event_effect: string | null;
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
  const tournamentSize = payload.tournament_size;

  // 1. Build archetype slug → scored data map
  const archetypeData: Record<string, { points: number; placement: number | null; won: boolean }> = {};
  for (const result of payload.archetypes) {
    archetypeData[result.archetype_slug] = {
      points: calcArchetypeBasePoints(result, tournamentSize),
      placement: result.placement ?? result.best_rank ?? null,
      won: result.won,
    };
  }

  // 2. Upsert archetype scores
  const slugs = Object.keys(archetypeData);
  const archetypeScores: Parameters<typeof upsertArchetypeScores>[1] = [];

  if (slugs.length > 0) {
    const { data: archetypes } = await supabase
      .from("fantasy_archetypes").select("id, slug").in("slug", slugs);

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

  // 3. Load squads
  const { data: rawSquads } = await supabase.from("squads").select(
    "user_id, active_deck_id, active_variant, " +
    "bench_1, bench_1_variant, bench_2, bench_2_variant, bench_3, bench_3_variant, " +
    "bench_4, bench_4_variant, bench_5, bench_5_variant, " +
    "hand_1, hand_1_variant, hand_2, hand_2_variant, hand_3, hand_3_variant, hand_4, hand_4_variant, " +
    "event_effect"
  );
  const squads = (rawSquads ?? []) as unknown as SquadRow[];

  // 4. Batch-load decks with tiers
  const allDeckIds = new Set<number>();
  for (const s of squads) {
    if (s.active_deck_id) allDeckIds.add(s.active_deck_id);
    for (const k of BENCH_SLOTS) if (s[k]) allDeckIds.add(s[k]!);
    for (const k of HAND_SLOTS)  if (s[k]) allDeckIds.add(s[k]!);
  }
  const { data: allDecks } = await supabase
    .from("decks").select("id, name, tier").in("id", [...allDeckIds]);
  const deckMap = new Map((allDecks ?? []).map(d => [d.id as number, { name: d.name as string, tier: (d.tier as string) ?? "D" }]));

  // 5. Identify bottom 25% for catch-up multiplier
  const { data: allProfiles } = await supabase
    .from("profiles").select("id, total_points").order("total_points", { ascending: true });
  const catchupSet = new Set<string>();
  if (allProfiles && allProfiles.length >= 4) {
    const cutoff = Math.floor(allProfiles.length * 0.25);
    for (const p of (allProfiles as { id: string; total_points: number }[]).slice(0, cutoff)) {
      catchupSet.add(p.id);
    }
  }

  const winnerSlug = Object.entries(archetypeData).find(([, v]) => v.won)?.[0] ?? null;
  const teamScores: Parameters<typeof upsertTeamScores>[1] = [];
  const achievementQueue: Array<{ user_id: string; achievement_id: string }> = [];

  for (const s of squads) {
    const eventEffect = s.event_effect;
    const breakdown: TeamScoreBreakdown = { slots: [], total: 0 };

    // captain_swap: find best-scoring bench deck and promote it to active
    let captainSwapDeckId: number | null = null;
    let captainSwapSlot: string | null = null;
    if (eventEffect === "captain_swap") {
      let bestPts = -1;
      for (const k of BENCH_SLOTS) {
        const did = s[k];
        if (!did) continue;
        const info = deckMap.get(did);
        if (!info) continue;
        const slug = slugify(info.name);
        const matched = payload.archetypes.find(
          a => a.archetype_slug === slug || a.archetype_name.toLowerCase() === info.name.toLowerCase()
        );
        const pts = matched ? calcArchetypeBasePoints(matched, tournamentSize) : 0;
        if (pts > bestPts) { bestPts = pts; captainSwapDeckId = did; captainSwapSlot = k; }
      }
    }

    const processSlot = (
      deckId: number | null,
      slotName: string,
      zone: "active" | "bench" | "hand",
      variantName: string | null
    ) => {
      if (!deckId) return;
      const info = deckMap.get(deckId);
      if (!info) {
        warnings.push(`[${s.user_id}] slot=${slotName} deck_id=${deckId} not found`);
        breakdown.slots.push({ slot: slotName, archetype_slug: null, base_points: 0, multiplier: 0, final_points: 0, warning: `Deck id=${deckId} not found` });
        return;
      }

      const baseSlug = slugify(info.name);
      const matchedResult =
        (variantName ? payload.archetypes.find(a => a.variant_name === variantName) : null) ??
        payload.archetypes.find(a => a.archetype_slug === baseSlug) ??
        payload.archetypes.find(a => a.archetype_name.toLowerCase() === info.name.toLowerCase());

      if (!matchedResult) {
        warnings.push(`[${s.user_id}] slot=${slotName} deck="${info.name}" not in snapshot (0 pts)`);
      }

      const basePoints = matchedResult ? calcArchetypeBasePoints(matchedResult, tournamentSize) : 0;

      let effectiveZone = zone;
      let effectForMult: string | null = eventEffect;
      if (eventEffect === "captain_swap") {
        if (deckId === captainSwapDeckId && slotName === captainSwapSlot) effectiveZone = "active";
        else if (slotName === "active") effectiveZone = "bench";
        effectForMult = null;
      }

      const finalPoints = applyMultiplier(basePoints, effectiveZone, effectForMult);
      const multiplier = effectiveZone === "active"
        ? (effectForMult === "x3" ? 3 : 2)
        : effectiveZone === "bench"
          ? (effectForMult === "bench_blitz" ? 1.5 : 1)
          : (effectForMult === "hand_boost" ? 1 : 0);

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

    // Conditional effect bonuses
    let bonusPoints = 0;

    if (eventEffect === "meta_call" && winnerSlug) {
      const activeSlug = breakdown.slots.find(sl => sl.slot === "active")?.archetype_slug;
      if (activeSlug === winnerSlug) bonusPoints += FANTASY_CONFIG.META_CALL_BONUS;
    }

    if (eventEffect === "dark_horse") {
      for (const sl of breakdown.slots) {
        if (!sl.archetype_slug) continue;
        const deckEntry = [...allDeckIds].find(id => {
          const d = deckMap.get(id);
          return d && slugify(d.name) === sl.archetype_slug;
        });
        const tier = deckEntry ? deckMap.get(deckEntry)?.tier : null;
        if (tier === "C" || tier === "D") {
          const r = payload.archetypes.find(a => a.archetype_slug === sl.archetype_slug);
          if (r && (r.top16 || (r.best_rank != null && r.best_rank <= 16) || (r.top16_count != null && r.top16_count > 0))) {
            bonusPoints += FANTASY_CONFIG.DARK_HORSE_BONUS;
            break;
          }
        }
      }
    }

    breakdown.bonus_points = bonusPoints;
    breakdown.total += bonusPoints;

    // Catch-up multiplier for bottom 25%
    if (catchupSet.has(s.user_id) && breakdown.total > 0) {
      const boosted = Math.round(breakdown.total * FANTASY_CONFIG.CATCHUP_MULTIPLIER);
      breakdown.bonus_points = (breakdown.bonus_points ?? 0) + (boosted - breakdown.total);
      breakdown.total = boosted;
      breakdown.catchup_applied = true;
    }

    teamScores.push({ fantasy_event_id: fantasyEventId, user_id: s.user_id, points: breakdown.total, breakdown });

    // Queue achievements
    if (breakdown.total === 0) achievementQueue.push({ user_id: s.user_id, achievement_id: "ice_cold" });
    if (breakdown.total > 0)  achievementQueue.push({ user_id: s.user_id, achievement_id: "first_points" });
    if (eventEffect === "x3") achievementQueue.push({ user_id: s.user_id, achievement_id: "all_in" });
    if (eventEffect === "hand_boost" && breakdown.slots.some(sl => sl.slot.startsWith("hand") && sl.final_points > 0)) {
      achievementQueue.push({ user_id: s.user_id, achievement_id: "underdog" });
    }
    if (winnerSlug && breakdown.slots.find(sl => sl.slot === "active")?.archetype_slug === winnerSlug) {
      achievementQueue.push({ user_id: s.user_id, achievement_id: "meta_predictor" });
    }
    if (bonusPoints >= FANTASY_CONFIG.DARK_HORSE_BONUS) {
      achievementQueue.push({ user_id: s.user_id, achievement_id: "dark_horse_hunter" });
    }
  }

  await upsertTeamScores(supabase, teamScores);

  if (achievementQueue.length > 0) {
    await supabase.from("player_achievements")
      .upsert(achievementQueue, { onConflict: "user_id,achievement_id" });
  }

  return { archetypesScored: archetypeScores.length, teamsScored: teamScores.length, warnings };
}
