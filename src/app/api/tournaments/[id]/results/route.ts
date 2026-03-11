import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Base points from tournament performance.
 * Points order: Base → +1 win bonus → multiplier
 */
function calcBasePoints(made_day2: boolean, top8: boolean, won: boolean, win_rate: number, had_win: boolean): number {
  let pts = 0;
  if (made_day2) pts += 3;
  if (top8) pts += 10;
  if (won) pts += 25;
  if (win_rate >= 0.6) pts += 20;
  if (had_win) pts += 1; // participation bonus
  return pts;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    deck_id,
    made_day2 = false,
    top8 = false,
    won = false,
    win_rate = 0,
    had_win = false,
  } = body;

  const base_points = calcBasePoints(made_day2, top8, won, win_rate, had_win);

  // Upsert the deck result
  const { error: resultError } = await supabase
    .from("tournament_results")
    .upsert(
      { tournament_id: parseInt(id), deck_id, made_day2, top8, won, win_rate, had_win, base_points },
      { onConflict: "tournament_id,deck_id" }
    );

  if (resultError) return NextResponse.json({ error: resultError.message }, { status: 500 });

  // Calculate points for all users who have this deck in their squad
  const { data: squads } = await supabase.from("squads").select("*");
  if (squads) {
    for (const squad of squads) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = squad as any;

      const activeKey = s.active_deck_id === deck_id;
      const benchKeys = ["bench_1", "bench_2", "bench_3", "bench_4", "bench_5"] as const;
      const handKeys = ["hand_1", "hand_2", "hand_3", "hand_4"] as const;
      const isBench = benchKeys.some((k) => s[k] === deck_id);
      const isHand = handKeys.some((k) => s[k] === deck_id);

      if (!activeKey && !isBench && !isHand) continue;

      // Determine stadium effect for this squad
      const eventEffect = s.event_effect as string | null;
      const x3Valid = eventEffect === "x3" && !s.x3_effect_used;
      const handBoostValid = eventEffect === "hand_boost" && !s.hand_boost_used;

      let pts = 0;
      if (activeKey) {
        const multiplier = x3Valid ? 3 : 2;
        pts = Math.round(base_points * multiplier);
      } else if (isBench) {
        pts = base_points;
      } else if (isHand) {
        pts = handBoostValid ? base_points : 0; // Hand scores 0 unless hand_boost
      }

      if (pts === 0 && !activeKey && !isBench) {
        // Only continue with 0 if it's a hand deck not being boosted — still need to mark effects
        if (!isHand) continue;
      }

      // Get existing score
      const { data: existing } = await supabase
        .from("league_scores")
        .select("points_earned")
        .eq("user_id", s.user_id)
        .eq("tournament_id", parseInt(id))
        .maybeSingle();

      const newPoints = (existing?.points_earned ?? 0) + pts;

      await supabase.from("league_scores").upsert(
        { user_id: s.user_id, tournament_id: parseInt(id), points_earned: newPoints },
        { onConflict: "user_id,tournament_id" }
      );

      // Update squad total_points
      await supabase.from("squads")
        .update({ total_points: (s.total_points ?? 0) + pts })
        .eq("user_id", s.user_id);

      // Update profile total
      const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", s.user_id).single();
      if (profile) {
        await supabase.from("profiles")
          .update({ total_points: (profile.total_points ?? 0) + pts })
          .eq("id", s.user_id);
      }
    }

    // After scoring all squads for this deck: mark effects as used for squads that used them
    for (const squad of squads) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = squad as any;
      if (!s.event_effect) continue;
      if (s.event_effect === "x3" && !s.x3_effect_used) {
        await supabase.from("squads")
          .update({ x3_effect_used: true, event_effect: null })
          .eq("user_id", s.user_id);
      } else if (s.event_effect === "hand_boost" && !s.hand_boost_used) {
        await supabase.from("squads")
          .update({ hand_boost_used: true, event_effect: null })
          .eq("user_id", s.user_id);
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
