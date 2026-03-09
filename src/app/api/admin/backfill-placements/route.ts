import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { SnapshotPayload } from "@/lib/fantasy/types";

/**
 * POST /api/admin/backfill-placements
 * Backfills placement data in fantasy_archetype_scores_live from existing snapshots
 * This fixes scores that were created before placement tracking was added
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const log: string[] = [];

  // Fetch all snapshots
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("fantasy_standings_snapshots")
    .select("id, fantasy_event_id, payload");

  if (snapshotsError) {
    return NextResponse.json({ error: snapshotsError.message }, { status: 500 });
  }

  log.push(`=== Found ${snapshots?.length || 0} snapshots ===`);

  let updated = 0;

  for (const snapshot of snapshots || []) {
    const payload = snapshot.payload as SnapshotPayload;
    
    log.push(`\nProcessing snapshot ${snapshot.id} for event ${snapshot.fantasy_event_id}`);

    for (const archetypeResult of payload.archetypes) {
      // Find the archetype ID
      const { data: archetype } = await supabase
        .from("fantasy_archetypes")
        .select("id")
        .eq("slug", archetypeResult.archetype_slug)
        .maybeSingle();

      if (!archetype) {
        log.push(`  ⚠️ Archetype not found: ${archetypeResult.archetype_slug}`);
        continue;
      }

      // Update the score with placement data
      const { error: updateError } = await adminClient
        .from("fantasy_archetype_scores_live")
        .update({ placement: archetypeResult.placement || null })
        .eq("fantasy_event_id", snapshot.fantasy_event_id)
        .eq("archetype_id", archetype.id);

      if (updateError) {
        log.push(`  ❌ Failed to update ${archetypeResult.archetype_slug}: ${updateError.message}`);
      } else {
        log.push(`  ✅ Updated ${archetypeResult.archetype_slug} placement: ${archetypeResult.placement}`);
        updated++;
      }
    }
  }

  log.push(`\n=== Complete: Updated ${updated} score records ===`);

  return NextResponse.json({
    ok: true,
    message: `Backfilled ${updated} placement records`,
    log,
  });
}
