import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/debug-scores
 * Shows all scores in the database with their placement data
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all scores with full details
  const { data: scores } = await supabase
    .from("fantasy_archetype_scores_live")
    .select(`
      *,
      archetype:fantasy_archetypes(slug, name),
      event:fantasy_events(id, name, event_date)
    `)
    .order("computed_at", { ascending: false });

  // Get all snapshots with their payloads
  const { data: snapshots } = await supabase
    .from("fantasy_standings_snapshots")
    .select("id, fantasy_event_id, snapshot_at, source, payload")
    .order("snapshot_at", { ascending: false });

  // Get sample archetype to check structure
  const { data: sampleArchetype } = await supabase
    .from("fantasy_archetypes")
    .select("*")
    .eq("slug", "charizard-ex")
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    counts: {
      scores: scores?.length || 0,
      snapshots: snapshots?.length || 0,
    },
    sampleArchetype,
    scores: scores?.slice(0, 5).map(s => ({
      id: s.id,
      archetype: (s as any).archetype?.slug || "unknown",
      event: (s as any).event?.name || "unknown",
      points: s.points,
      placement: s.placement, // ← Key field to check
      computed_at: s.computed_at,
    })),
    snapshots: snapshots?.slice(0, 3).map(s => ({
      id: s.id,
      event_id: s.fantasy_event_id,
      source: s.source,
      archetypes_count: (s.payload as any)?.archetypes?.length || 0,
      sample_archetype: (s.payload as any)?.archetypes?.[0] || null,
    })),
  });
}
