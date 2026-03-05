import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processSnapshot } from "@/lib/fantasy/liveScoring";
import type { SnapshotPayload } from "@/lib/fantasy/types";

/**
 * POST /api/fantasy/admin/update-live
 * Body: { fantasy_event_id: number, payload: SnapshotPayload }
 *
 * 1. Writes snapshot to fantasy_standings_snapshots (append-only)
 * 2. Triggers score computation → writes to live tables
 * API reads only query pre-computed tables.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fantasy_event_id, payload, source = "manual" } = body as {
    fantasy_event_id: number;
    payload: SnapshotPayload;
    source?: string;
  };

  if (!fantasy_event_id || !payload) {
    return NextResponse.json({ error: "fantasy_event_id and payload required" }, { status: 400 });
  }

  // 1. Write append-only snapshot
  const { error: snapshotError } = await supabase
    .from("fantasy_standings_snapshots")
    .insert({ fantasy_event_id, payload, source });

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  // 2. Trigger score computation from snapshot
  const result = await processSnapshot(supabase, fantasy_event_id, payload);

  // 3. Track event ingestion (upsert to update last_seen_at)
  const sourceEventId = payload.event_id || `fantasy_event_${fantasy_event_id}`;
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
    notes: `Snapshot for fantasy_event_id ${fantasy_event_id}`,
  });

  return NextResponse.json({
    ok: true,
    message: `Snapshot stored. Scored ${result.archetypesScored} archetypes, ${result.teamsScored} teams.`,
    ...result,
  });
}
