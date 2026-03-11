import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: results } = await supabase
    .from("tournament_results")
    .select("deck_id, base_points")
    .eq("tournament_id", parseInt(id));

  if (!results || results.length === 0)
    return NextResponse.json({ error: "No results logged. Run auto-score first." }, { status: 400 });

  const deckPointsMap = new Map(results.map(r => [r.deck_id, r.base_points]));

  const { data: squads } = await supabase.from("squads").select(`
    user_id, total_points, event_effect, x3_effect_used, hand_boost_used,
    active_deck_id, bench_1, bench_2, bench_3, bench_4, bench_5,
    hand_1, hand_2, hand_3, hand_4
  `);

  if (!squads || squads.length === 0)
    return NextResponse.json({ error: "No squads found" }, { status: 400 });

  let scoredCount = 0;

  for (const squad of squads) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = squad as any;
    const activePts = deckPointsMap.get(s.active_deck_id) ?? 0;
    const benchIds = [s.bench_1, s.bench_2, s.bench_3, s.bench_4, s.bench_5].filter(Boolean);
    const handIds = [s.hand_1, s.hand_2, s.hand_3, s.hand_4].filter(Boolean);
    const benchPts = benchIds.reduce((sum: number, id: number) => sum + (deckPointsMap.get(id) ?? 0), 0);
    const handPts = handIds.reduce((sum: number, id: number) => sum + (deckPointsMap.get(id) ?? 0), 0);

    let activeMultiplier = 2;
    if (s.event_effect === "x3" && !s.x3_effect_used) activeMultiplier = 3;
    let pts = (activePts * activeMultiplier) + benchPts;
    if (s.event_effect === "hand_boost" && !s.hand_boost_used) pts += handPts;

    if (pts === 0) continue;
    scoredCount++;

    await supabase.from("league_scores").upsert(
      { user_id: s.user_id, tournament_id: parseInt(id), points_earned: pts },
      { onConflict: "user_id,tournament_id" }
    );

    const { data: allScores } = await supabase
      .from("league_scores").select("points_earned").eq("user_id", s.user_id);
    const total = (allScores ?? []).reduce((sum, sc) => sum + (sc.points_earned ?? 0), 0);

    await supabase.from("squads").update({ total_points: total }).eq("user_id", s.user_id);
    await supabase.from("profiles").update({ total_points: total }).eq("id", s.user_id);

    if (s.event_effect === "x3" && !s.x3_effect_used)
      await supabase.from("squads").update({ x3_effect_used: true, event_effect: null }).eq("user_id", s.user_id);
    else if (s.event_effect === "hand_boost" && !s.hand_boost_used)
      await supabase.from("squads").update({ hand_boost_used: true, event_effect: null }).eq("user_id", s.user_id);
  }

  await supabase.from("tournaments").update({ status: "completed" }).eq("id", id);

  return NextResponse.json({ ok: true, scored: scoredCount, total_squads: squads.length });
}
