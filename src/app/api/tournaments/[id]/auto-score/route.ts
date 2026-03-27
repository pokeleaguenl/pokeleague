import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchAll } from "@/lib/supabase/fetchAll";
import { calcArchetypeBasePoints } from "@/lib/fantasy/bracketScoring";
import { FANTASY_CONFIG } from "@/lib/fantasy/config";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tournament } = await supabase
    .from("tournaments").select("*").eq("id", numId).single();
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (!tournament.rk9_id) return NextResponse.json({ error: "No RK9 ID on this tournament" }, { status: 400 });

  const standings = await fetchAll<{
    player_name: string; archetype: string; rank: number;
    win_rate: number | null; wins: number | null; losses: number | null;
  }>(
    supabase
      .from("rk9_standings")
      .select("player_name, archetype, rank, win_rate, wins, losses")
      .eq("tournament_id", tournament.rk9_id)
      .not("archetype", "is", null)
      .order("rank", { ascending: true })
  ).catch(() => null);

  if (!standings || standings.length === 0)
    return NextResponse.json({ error: "No RK9 standings found for this tournament" }, { status: 400 });

  const totalPlayers = standings.length;
  const day2Threshold = Math.ceil(totalPlayers * 0.3);

  const archetypeStats: Record<string, {
    count: number;
    top2: boolean; top4: boolean; top8: boolean; top16: boolean; won: boolean;
    totalWins: number; totalLosses: number; topRank: number;
  }> = {};

  for (const row of standings) {
    const arch = row.archetype;
    if (!arch) continue;
    if (!archetypeStats[arch]) {
      archetypeStats[arch] = {
        count: 0, top2: false, top4: false, top8: false, top16: false, won: false,
        totalWins: 0, totalLosses: 0, topRank: 999999,
      };
    }
    const s = archetypeStats[arch];
    s.count++;
    if (row.rank === 1) s.won = true;
    if (row.rank <= 2) s.top2 = true;
    if (row.rank <= 4) s.top4 = true;
    if (row.rank <= 8) s.top8 = true;
    if (row.rank <= 16) s.top16 = true;
    s.totalWins += row.wins ?? 0;
    s.totalLosses += row.losses ?? 0;
    if (row.rank < s.topRank) s.topRank = row.rank;
  }

  const [{ data: archetypes }, { data: aliases }, { data: decks }] = await Promise.all([
    supabase.from("fantasy_archetypes").select("id, name, canonical_id"),
    supabase.from("fantasy_archetype_aliases").select("archetype_id, alias"),
    supabase.from("decks").select("id, name, archetype_id, tier"),
  ]);

  const aliasMap = new Map<string, number>();
  for (const a of aliases ?? []) aliasMap.set(a.alias.toLowerCase(), a.archetype_id);
  for (const a of archetypes ?? []) aliasMap.set(a.name.toLowerCase(), a.id);

  const deckByArchetype = new Map<number, { id: number; tier: string }>();
  for (const d of decks ?? []) {
    if (d.archetype_id) deckByArchetype.set(d.archetype_id, { id: d.id, tier: d.tier ?? "D" });
  }

  const results: Array<{
    archetype: string; deck_id: number; deck_name: string;
    made_day2: boolean; top2: boolean; top4: boolean; top8: boolean; top16: boolean; won: boolean;
    win_rate: number; had_win: boolean; best_rank: number; base_points: number;
  }> = [];
  const unmatched: string[] = [];

  for (const [archName, stats] of Object.entries(archetypeStats)) {
    const metaShare = (stats.count / totalPlayers) * 100;
    if (metaShare < 0.5) continue;

    const archId = aliasMap.get(archName.toLowerCase());
    if (!archId) { unmatched.push(archName); continue; }

    const deckInfo = deckByArchetype.get(archId);
    if (!deckInfo) { unmatched.push(archName); continue; }

    const totalGames = stats.totalWins + stats.totalLosses;
    const winRate = totalGames > 0 ? stats.totalWins / totalGames : 0;
    const made_day2 = stats.topRank <= day2Threshold;

    const basePoints = calcArchetypeBasePoints({
      archetype_slug: archName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      archetype_name: archName,
      made_day2,
      top2: stats.top2,
      top4: stats.top4,
      top8: stats.top8,
      top16: stats.top16,
      top16_count: 0,
      top8_count: 0,
      top32_count: 0,
      won: stats.won,
      win_rate: winRate,
      had_win: stats.totalWins > 0,
      best_rank: stats.topRank,
    }, totalPlayers);

    const deck = decks?.find(d => d.id === deckInfo.id);
    results.push({
      archetype: archName,
      deck_id: deckInfo.id,
      deck_name: deck?.name ?? archName,
      made_day2,
      top2: stats.top2,
      top4: stats.top4,
      top8: stats.top8,
      top16: stats.top16,
      won: stats.won,
      win_rate: winRate,
      had_win: stats.totalWins > 0,
      best_rank: stats.topRank,
      base_points: basePoints,
    });
  }

  const upsertErrors: string[] = [];
  for (const r of results) {
    const { error: upsertError } = await supabase.from("tournament_results").upsert({
      tournament_id: numId,
      deck_id: r.deck_id,
      made_day2: r.made_day2,
      top2: r.top2,
      top4: r.top4,
      top8: r.top8,
      top16: r.top16,
      won: r.won,
      win_rate: r.win_rate,
      had_win: r.had_win,
      best_rank: r.best_rank,
      tournament_size: totalPlayers,
      base_points: r.base_points,
    }, { onConflict: "tournament_id,deck_id" });
    if (upsertError) upsertErrors.push(`${r.deck_name}: ${upsertError.message}`);
  }

  await supabase.from("tournaments").update({ status: "completed" }).eq("id", numId);

  // Resolve predictions for this tournament
  const winnerDeckId = results.find(r => r.won)?.deck_id ?? null;
  if (winnerDeckId) {
    const { data: preds } = await supabase
      .from("tournament_predictions")
      .select("id, user_id, predicted_deck_id")
      .eq("tournament_id", numId)
      .is("correct", null);
    for (const pred of preds ?? []) {
      const correct = pred.predicted_deck_id === winnerDeckId;
      await supabase.from("tournament_predictions").update({
        correct,
        bonus_points: correct ? FANTASY_CONFIG.PREDICTION_BONUS : 0,
      }).eq("id", pred.id);
    }
  }

  return NextResponse.json({
    ok: upsertErrors.length === 0,
    scored: results.length - upsertErrors.length,
    unmatched: unmatched.length,
    unmatched_list: unmatched.slice(0, 20),
    upsert_errors: upsertErrors.length > 0 ? upsertErrors : undefined,
    tournament_size: totalPlayers,
    results: results.map(r => ({
      deck: r.deck_name, pts: r.base_points, top8: r.top8, won: r.won, best_rank: r.best_rank,
    })),
  });
}
