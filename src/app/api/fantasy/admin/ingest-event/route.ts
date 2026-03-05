import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { convertStandingsToPayload } from "@/lib/fantasy/standingsMapper";
import { processSnapshot } from "@/lib/fantasy/liveScoring";
import type { StandingsEntry } from "@/lib/fantasy/types";

/**
 * POST /api/fantasy/admin/ingest-event
 * Body: { tournament_id: number, standings?: StandingsEntry[], force?: boolean }
 *
 * Automates the full pipeline for a tournament:
 * 1. Ensures fantasy_events row exists (creates if missing)
 * 2. Accepts standings data (required for now; future: fetch from external sources)
 * 3. Converts standings to snapshot via deck name resolution
 * 4. Computes analytics (archetype scores + team scores)
 * 5. Tracks ingestion in ingest_runs/ingest_events_seen
 *
 * Idempotent: if standings for this tournament already exist, skips unless force=true
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { tournament_id, standings, force = false } = body as {
    tournament_id: number;
    standings?: StandingsEntry[];
    force?: boolean;
  };

  if (!tournament_id) {
    return NextResponse.json({ error: "tournament_id required" }, { status: 400 });
  }

  if (!standings || standings.length === 0) {
    return NextResponse.json({ 
      error: "standings array required (future versions may auto-fetch from external sources)" 
    }, { status: 400 });
  }

  const log: string[] = [];

  // ============================================================
  // STEP 1: Ensure fantasy_events row exists
  // ============================================================
  log.push("=== Ensuring fantasy_events row ===");

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, event_date, status")
    .eq("id", tournament_id)
    .maybeSingle();

  if (tournamentError || !tournament) {
    return NextResponse.json({ 
      error: `Tournament ${tournament_id} not found` 
    }, { status: 404 });
  }

  let fantasyEvent = await supabase
    .from("fantasy_events")
    .select("id, tournament_id, status")
    .eq("tournament_id", tournament_id)
    .maybeSingle()
    .then(r => r.data);

  if (!fantasyEvent) {
    // Create fantasy_event
    const now = new Date().toISOString().split("T")[0];
    const eventDate = tournament.event_date || now;
    
    let status: "upcoming" | "live" | "completed" = "upcoming";
    if (eventDate < now) {
      status = "completed";
    } else if (eventDate === now) {
      status = "live";
    }

    const { data: created, error: createError } = await adminClient
      .from("fantasy_events")
      .insert({
        tournament_id: tournament.id,
        name: tournament.name,
        event_date: tournament.event_date,
        status,
      })
      .select()
      .single();

    if (createError || !created) {
      return NextResponse.json({ 
        error: `Failed to create fantasy_event: ${createError?.message || "no data returned"}` 
      }, { status: 500 });
    }

    fantasyEvent = created;
    log.push(`✅ Created fantasy_event id=${created.id} for tournament_id=${tournament_id}`);
  } else {
    log.push(`✅ Fantasy_event id=${fantasyEvent.id} exists for tournament_id=${tournament_id}`);
  }

  // Safety check (TypeScript guard)
  if (!fantasyEvent) {
    return NextResponse.json({ 
      error: "Internal error: fantasy_event is null after creation/lookup" 
    }, { status: 500 });
  }

  // ============================================================
  // STEP 2: Check if snapshot already exists (idempotency)
  // ============================================================
  log.push("\n=== Checking existing snapshots ===");

  const { data: existingSnapshots } = await supabase
    .from("fantasy_standings_snapshots")
    .select("id, source, snapshot_at")
    .eq("fantasy_event_id", fantasyEvent.id)
    .order("snapshot_at", { ascending: false })
    .limit(1);

  if (existingSnapshots && existingSnapshots.length > 0 && !force) {
    const existing = existingSnapshots[0];
    log.push(`⚠️  Snapshot already exists (id=${existing.id}, source=${existing.source})`);
    log.push("   Use force=true to create a new snapshot version");
    return NextResponse.json({
      ok: false,
      message: "Snapshot already exists for this tournament. Use force=true to override.",
      log,
      existing_snapshot_id: existing.id,
    });
  }

  if (force && existingSnapshots && existingSnapshots.length > 0) {
    log.push(`⚠️  Force mode: creating new snapshot version (previous: ${existingSnapshots.length})`);
  }

  // ============================================================
  // STEP 3: Convert standings to payload
  // ============================================================
  log.push("\n=== Converting standings to payload ===");

  const { payload, unmatchedDecks } = await convertStandingsToPayload(supabase, standings);

  log.push(`✅ Converted ${standings.length} standings → ${payload.archetypes.length} archetypes`);
  if (unmatchedDecks.length > 0) {
    log.push(`⚠️  Unmatched decks (${unmatchedDecks.length}): ${unmatchedDecks.join(", ")}`);
  }

  // ============================================================
  // STEP 4: Store snapshot
  // ============================================================
  log.push("\n=== Storing snapshot ===");

  const { data: snapshot, error: snapshotError } = await adminClient
    .from("fantasy_standings_snapshots")
    .insert({
      fantasy_event_id: fantasyEvent.id,
      payload,
      source: "ingest_event_api",
    })
    .select()
    .single();

  if (snapshotError || !snapshot) {
    return NextResponse.json({ 
      error: `Failed to store snapshot: ${snapshotError?.message}`,
      log,
    }, { status: 500 });
  }

  log.push(`✅ Snapshot stored (id=${snapshot.id})`);

  // ============================================================
  // STEP 5: Compute analytics
  // ============================================================
  log.push("\n=== Computing analytics ===");

  const result = await processSnapshot(supabase, fantasyEvent.id, payload);

  log.push(`✅ Scored ${result.archetypesScored} archetypes, ${result.teamsScored} teams`);

  // ============================================================
  // STEP 6: Track ingestion
  // ============================================================
  await adminClient.from("ingest_events_seen").upsert(
    {
      source: "ingest_event_api",
      source_event_id: `tournament_${tournament_id}`,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "source,source_event_id" }
  );

  await adminClient.from("ingest_runs").insert({
    source: "ingest_event_api",
    event_count: 1,
    status: "ok",
    notes: `Ingested tournament_id=${tournament_id}: ${standings.length} standings → ${payload.archetypes.length} archetypes`,
  });

  log.push("\n✅ Ingestion complete");

  return NextResponse.json({
    ok: true,
    message: `Ingested tournament ${tournament.name} (${standings.length} standings → ${payload.archetypes.length} archetypes)`,
    fantasy_event_id: fantasyEvent.id,
    snapshot_id: snapshot.id,
    archetypes_scored: result.archetypesScored,
    teams_scored: result.teamsScored,
    unmatched_decks: unmatchedDecks,
    log,
  });
}
