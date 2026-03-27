import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { deck_id } = body;
  if (!deck_id || typeof deck_id !== "number") {
    return NextResponse.json({ error: "deck_id required" }, { status: 400 });
  }

  // Check tournament exists and is upcoming
  const { data: tournament } = await supabase
    .from("tournaments").select("id, status, event_date").eq("id", numId).single();
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.status === "completed") {
    return NextResponse.json({ error: "Cannot predict after tournament is completed" }, { status: 400 });
  }

  // Upsert prediction (one per user per tournament)
  const { data, error } = await supabase
    .from("tournament_predictions")
    .upsert({
      user_id: user.id,
      tournament_id: numId,
      predicted_deck_id: deck_id,
      correct: null,
      bonus_points: 0,
    }, { onConflict: "user_id,tournament_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, prediction: data });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("tournament_predictions")
    .select("predicted_deck_id, correct, bonus_points")
    .eq("user_id", user.id)
    .eq("tournament_id", numId)
    .maybeSingle();

  return NextResponse.json({ prediction: data ?? null });
}
