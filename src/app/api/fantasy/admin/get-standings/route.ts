import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tournament_id = parseInt(searchParams.get("tournament_id") ?? "");
  if (!tournament_id) return NextResponse.json({ error: "Missing tournament_id" }, { status: 400 });

  // Get the rk9_id for this tournament
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, rk9_id")
    .eq("id", tournament_id)
    .maybeSingle();

  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (!tournament.rk9_id) return NextResponse.json({ 
    error: "Tournament has no RK9 ID — cannot fetch standings",
    tournament_id,
    count: 0,
    standings: [],
  });

  // Fetch standings using rk9_id
  const { data: standings, count } = await supabase
    .from("rk9_standings")
    .select("player_name, archetype, rank, record, country, decklist_url, card_list", { count: "exact" })
    .eq("tournament_id", tournament.rk9_id)
    .order("rank", { ascending: true });

  return NextResponse.json({
    tournament_id,
    rk9_id: tournament.rk9_id,
    tournament_name: tournament.name,
    count: count ?? 0,
    standings: (standings ?? []).map(s => ({
      player_name: s.player_name,
      archetype_name: s.archetype ?? "Unknown",
      archetype_slug: (s.archetype ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      placement: s.rank,
      record: s.record,
      country: s.country,
      decklist_url: s.decklist_url,
      card_list: s.card_list,
    })),
  });
}
