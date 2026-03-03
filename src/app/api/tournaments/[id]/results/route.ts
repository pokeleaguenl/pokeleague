import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function calcPoints(made_day2: boolean, top8: boolean, won: boolean, win_rate: number): number {
  let pts = 0;
  if (made_day2) pts += 3;
  if (top8) pts += 10;
  if (won) pts += 25;
  if (win_rate >= 60) pts += 20;
  return pts;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { deck_id, made_day2 = false, top8 = false, won = false, win_rate = 0 } = body;
  const base_points = calcPoints(made_day2, top8, won, win_rate);

  // Upsert the deck result
  const { error: resultError } = await supabase
    .from("tournament_results")
    .upsert({ tournament_id: parseInt(id), deck_id, made_day2, top8, won, win_rate, base_points }, { onConflict: "tournament_id,deck_id" });

  if (resultError) return NextResponse.json({ error: resultError.message }, { status: 500 });

  // Now calculate points for all users who have this deck in their squad
  const { data: squads } = await supabase.from("squads").select("*");
  if (squads) {
    for (const squad of squads) {
      const benchKeys = ["bench_1", "bench_2", "bench_3", "bench_4", "bench_5"] as const;
      const isActive = squad.active_deck_id === deck_id;
      const isBench = benchKeys.some((k) => squad[k] === deck_id);

      if (!isActive && !isBench) continue;

      const pts = isActive ? Math.round(base_points * 1.5) : base_points;

      // Get existing score for this user+tournament
      const { data: existing } = await supabase
        .from("league_scores")
        .select("points_earned")
        .eq("user_id", squad.user_id)
        .eq("tournament_id", parseInt(id))
        .maybeSingle();

      const newPoints = (existing?.points_earned ?? 0) + pts;

      await supabase.from("league_scores").upsert(
        { user_id: squad.user_id, tournament_id: parseInt(id), points_earned: newPoints },
        { onConflict: "user_id,tournament_id" }
      );

      // Update total_points on squad
      await supabase.from("squads")
        .update({ total_points: squad.total_points + pts })
        .eq("user_id", squad.user_id);

      // Update profile total
      const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", squad.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({ total_points: (profile.total_points ?? 0) + pts }).eq("id", squad.user_id);
      }
    }
  }

  return NextResponse.json({ ok: true, base_points });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_results")
    .select("*, deck:decks(*)")
    .eq("tournament_id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
