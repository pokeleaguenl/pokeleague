import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tournament_id = parseInt(searchParams.get("tournament_id") ?? "");
  if (!tournament_id) return NextResponse.json({ error: "Missing tournament_id" }, { status: 400 });

  const { data: standings, count } = await supabase
    .from("rk9_standings")
    .select("player_name, archetype, rank, record, country, decklist_url, card_list", { count: "exact" })
    .eq("tournament_id", tournament_id)
    .order("rank", { ascending: true });

  return NextResponse.json({
    tournament_id,
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
