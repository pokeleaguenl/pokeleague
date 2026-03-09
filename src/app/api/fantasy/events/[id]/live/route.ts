import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: archetypeScores }, { data: teamScores }, { data: event }] = await Promise.all([
    supabase.from("fantasy_archetype_scores_live")
      .select("*, archetype:fantasy_archetypes(id, slug, name, image_url)")
      .eq("fantasy_event_id", parseInt(id))
      .order("points", { ascending: false }),
    supabase.from("fantasy_team_scores_live")
      .select("*, profile:profiles(display_name, username)")
      .eq("fantasy_event_id", parseInt(id))
      .order("points", { ascending: false }),
    supabase.from("fantasy_events")
      .select("*, tournament:tournaments(name, event_date, city)")
      .eq("id", parseInt(id))
      .maybeSingle(),
  ]);

  return NextResponse.json({ event, archetypeScores: archetypeScores ?? [], teamScores: teamScores ?? [] });
}
