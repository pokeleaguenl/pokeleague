import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/fantasy/admin/debug-pipeline
 * Returns counts for all fantasy pipeline tables for debugging
 * Admin-only endpoint
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = [
    "fantasy_archetypes",
    "fantasy_archetype_aliases",
    "fantasy_events",
    "fantasy_standings_snapshots",
    "fantasy_archetype_scores_live",
    "fantasy_team_scores_live",
  ];

  const counts: Record<string, number> = {};

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      counts[table] = -1; // Indicate error
    } else {
      counts[table] = count ?? 0;
    }
  }

  return NextResponse.json({
    ok: true,
    counts,
    timestamp: new Date().toISOString(),
  });
}
