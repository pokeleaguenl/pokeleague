import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Get the most recent live fantasy event
  const { data: latestEvent } = await supabase
    .from("fantasy_events")
    .select("id, name, event_date, status")
    .in("status", ["live", "upcoming"])
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!latestEvent) return NextResponse.json({ event: null, scores: [] });

  const { data: scores } = await supabase
    .from("fantasy_team_scores_live")
    .select("*, profile:profiles(display_name, username, total_points)")
    .eq("fantasy_event_id", latestEvent.id)
    .order("points", { ascending: false });

  return NextResponse.json({ event: latestEvent, scores: scores ?? [] });
}
