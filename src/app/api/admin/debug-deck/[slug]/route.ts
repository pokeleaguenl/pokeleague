import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/debug-deck/[slug]
 * Debug endpoint to check archetype lookup and score history
 */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find archetype
  const { data: archetype, error: archetypeError } = await supabase
    .from("fantasy_archetypes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Find all scores for this archetype (if found)
  const { data: liveScores } = archetype ? await supabase
    .from("fantasy_archetype_scores_live")
    .select("*, event:fantasy_events(*)")
    .eq("archetype_id", archetype.id) : { data: [] };

  // Find ALL live scores to see what's in the table
  const { data: allLiveScores } = await supabase
    .from("fantasy_archetype_scores_live")
    .select("*, archetype:fantasy_archetypes(slug, name), event:fantasy_events(name)")
    .limit(10);

  return NextResponse.json({
    ok: true,
    slug,
    archetype: {
      found: !!archetype,
      data: archetype,
      error: archetypeError?.message,
    },
    liveScoresForThisArchetype: {
      count: liveScores?.length || 0,
      data: liveScores,
    },
    allLiveScoresInDb: {
      count: allLiveScores?.length || 0,
      data: allLiveScores,
    },
  });
}
