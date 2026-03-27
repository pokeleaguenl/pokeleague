import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchAll } from "@/lib/supabase/fetchAll";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get tournament
  const { data: tournament } = await supabase
    .from("tournaments").select("*").eq("id", numId).single();
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (!tournament.rk9_id) return NextResponse.json({ error: "No RK9 ID on this tournament" }, { status: 400 });

  // Get all RK9 standings (paginated — tournaments can have 2000+ players)
  const standings = await fetchAll<{ player_name: string; archetype: string; rank: number; win_rate: number | null; wins: number | null; losses: number | null }>(
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

  // Build archetype stats from standings
  const archetypeStats: Record<string, {
    count: number; top8: boolean; won: boolean;
    totalWins: number; totalLosses: number; topRank: number;
  }> = {};

  for (const row of standings) {
    const arch = row.archetype;
    if (!arch) continue;
    if (!archetypeStats[arch]) {
      archetypeStats[arch] = { count: 0, top8: false, won: false, totalWins: 0, totalLosses: 0, topRank: 999 };
    }
    archetypeStats[arch].count++;
    if (row.rank <= 8) archetypeStats[arch].top8 = true;
    if (row.rank === 1) archetypeStats[arch].won = true;
    archetypeStats[arch].totalWins += row.wins ?? 0;
    archetypeStats[arch].totalLosses += row.losses ?? 0;
    if (row.rank < archetypeStats[arch].topRank) archetypeStats[arch].topRank = row.rank;
  }

  // Get fantasy archetypes + their deck mappings
  const { data: archetypes } = await supabase
    .from("fantasy_archetypes")
    .select("id, name, canonical_id");

  const { data: aliases } = await supabase
    .from("fantasy_archetype_aliases")
    .select("archetype_id, alias");

  // Build alias -> archetype_id map
  const aliasMap = new Map<string, number>();
  for (const a of aliases ?? []) {
    aliasMap.set(a.alias.toLowerCase(), a.archetype_id);
  }
  for (const a of archetypes ?? []) {
    aliasMap.set(a.name.toLowerCase(), a.id);
  }

  // Get decks with archetype_id
  const { data: decks } = await supabase
    .from("decks").select("id, name, archetype_id");

  const deckByArchetype = new Map<number, number>(); // archetype_id -> deck_id
  for (const d of decks ?? []) {
    if (d.archetype_id) deckByArchetype.set(d.archetype_id, d.id);
  }

  const results: Array<{
    archetype: string; deck_id: number; deck_name: string;
    made_day2: boolean; top8: boolean; won: boolean;
    win_rate: number; had_win: boolean; base_points: number;
  }> = [];
  const unmatched: string[] = [];

  for (const [archName, stats] of Object.entries(archetypeStats)) {
    // Skip archetypes below 0.5% meta share
    const metaShare = (stats.count / totalPlayers) * 100;
    if (metaShare < 0.5) continue;

    // Find deck via alias map
    const archId = aliasMap.get(archName.toLowerCase());
    if (!archId) { unmatched.push(archName); continue; }

    const deckId = deckByArchetype.get(archId);
    if (!deckId) { unmatched.push(archName); continue; }

    const totalGames = stats.totalWins + stats.totalLosses;
    const winRate = totalGames > 0 ? stats.totalWins / totalGames : 0;
    const made_day2 = stats.topRank <= Math.ceil(totalPlayers * 0.3);

    let pts = 0;
    if (made_day2) pts += 3;
    if (stats.top8) pts += 10;
    if (stats.won) pts += 25;
    if (winRate >= 0.6) pts += 20;
    if (stats.totalWins > 0) pts += 1;

    const deck = decks?.find(d => d.id === deckId);
    results.push({
      archetype: archName,
      deck_id: deckId,
      deck_name: deck?.name ?? archName,
      made_day2,
      top8: stats.top8,
      won: stats.won,
      win_rate: winRate,
      had_win: stats.totalWins > 0,
      base_points: pts,
    });
  }

  // Upsert tournament_results
  const upsertErrors: string[] = [];
  for (const r of results) {
    const { error: upsertError } = await supabase.from("tournament_results").upsert({
      tournament_id: numId,
      deck_id: r.deck_id,
      made_day2: r.made_day2,
      top8: r.top8,
      won: r.won,
      win_rate: r.win_rate,
      had_win: r.had_win,
      base_points: r.base_points,
    }, { onConflict: "tournament_id,deck_id" });
    if (upsertError) upsertErrors.push(`${r.deck_name}: ${upsertError.message}`);
  }

  // Update tournament status to completed
  await supabase.from("tournaments")
    .update({ status: "completed" })
    .eq("id", numId);

  return NextResponse.json({
    ok: upsertErrors.length === 0,
    scored: results.length - upsertErrors.length,
    unmatched: unmatched.length,
    unmatched_list: unmatched.slice(0, 20),
    upsert_errors: upsertErrors.length > 0 ? upsertErrors : undefined,
    results: results.map(r => ({ deck: r.deck_name, pts: r.base_points, top8: r.top8, won: r.won })),
  });
}
