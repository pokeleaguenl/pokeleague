import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processSnapshot } from "@/lib/fantasy/liveScoring";
import { convertStandingsToPayload } from "@/lib/fantasy/standingsMapper";
import type { SnapshotPayload, StandingsEntry } from "@/lib/fantasy/types";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * POST /api/fantasy/admin/update-live
 * Body: { fantasy_event_id: number, payload?: SnapshotPayload, standings?: StandingsEntry[] }
 *
 * Accepts either:
 * - Direct payload (SnapshotPayload format)
 * - Standings array (will be converted to payload via deck name resolution)
 *
 * 1. Writes snapshot to fantasy_standings_snapshots (append-only)
 * 2. Triggers score computation → writes to live tables
 * API reads only query pre-computed tables.
 */
export async function POST(req: Request) {
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fantasy_event_id, payload, standings, source = "manual" } = body as {
    fantasy_event_id: number;
    payload?: SnapshotPayload;
    standings?: StandingsEntry[];
    source?: string;
  };

  if (!fantasy_event_id) {
    return NextResponse.json({ error: "fantasy_event_id required" }, { status: 400 });
  }

  let finalPayload: SnapshotPayload;
  let unmatchedDecks: string[] = [];

  // Convert standings to payload if provided
  if (standings && standings.length > 0) {
    const conversion = await convertStandingsToPayload(supabase, standings);
    finalPayload = conversion.payload;
    unmatchedDecks = conversion.unmatchedDecks;
    console.log(`[update-live] Converted ${standings.length} standings to ${finalPayload.archetypes.length} archetypes`);
    if (unmatchedDecks.length > 0) {
      console.log(`[update-live] Unmatched decks: ${unmatchedDecks.join(", ")}`);
    }
  } else if (payload) {
    finalPayload = payload;
  } else {
    return NextResponse.json({ error: "Either payload or standings required" }, { status: 400 });
  }

  // 1. Write append-only snapshot
  const { error: snapshotError } = await supabase
    .from("fantasy_standings_snapshots")
    .insert({ fantasy_event_id, payload: finalPayload, source });

  if (snapshotError) {
    console.error(`[update-live] Snapshot insert failed:`, snapshotError);
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  console.log(`[update-live] Snapshot stored: ${finalPayload.archetypes.length} archetypes`);

  // 2. Trigger score computation from snapshot
  const result = await processSnapshot(supabase, fantasy_event_id, finalPayload);

  console.log(`[update-live] Archetypes scored: ${result.archetypesScored}; Teams scored: ${result.teamsScored}`);

  // 3. Track event ingestion (upsert to update last_seen_at)
  const sourceEventId = `fantasy_event_${fantasy_event_id}`;
  await supabase.from("ingest_events_seen").upsert(
    {
      source: source || "manual",
      source_event_id: sourceEventId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "source,source_event_id" }
  );

  // 4. Track ingestion run
  await supabase.from("ingest_runs").insert({
    source: source || "manual",
    event_count: 1,
    status: "ok",
    notes: `Snapshot for fantasy_event_id ${fantasy_event_id}: ${finalPayload.archetypes.length} archetypes`,
  });

  return NextResponse.json({
    ok: true,
    message: `Snapshot stored: ${finalPayload.archetypes.length} archetypes. Scored ${result.archetypesScored} archetypes, ${result.teamsScored} teams.`,
    ...result,
    unmatchedDecks: unmatchedDecks.length > 0 ? unmatchedDecks : undefined,
  });
}
