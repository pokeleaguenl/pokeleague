import { createClient } from "@/lib/supabase/server";
import { fetchRK9Events } from "@/lib/rk9";
import { NextResponse } from "next/server";

/**
 * POST /api/events/sync
 * Fetches TCG events from RK9 and upserts into tournaments table.
 * Requires authenticated user.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const allEvents = await fetchRK9Events();

    // Only keep Sept 2025 onwards
    const CUTOFF = "2025-09-01";
    const events = allEvents.filter((e) => e.startDate >= CUTOFF);

    if (events.length === 0) {
      return NextResponse.json({ error: "No TCG events found from RK9" }, { status: 502 });
    }

    let synced = 0;
    const failed: string[] = [];

    for (const event of events) {
      const { error } = await supabase
        .from("tournaments")
        .upsert(
          {
            name: event.name,
            event_date: event.startDate,
            end_date: event.endDate,
            city: event.city,
            format: "STANDARD",
            status: event.upcoming ? "upcoming" : "completed",
            rk9_id: event.rk9Id,
            rk9_url: event.rk9Url,
          },
          { onConflict: "rk9_id" }
        );

      if (error) {
        failed.push(`${event.name}: ${error.message}`);
      } else {
        synced++;
      }
    }

    // Write ingest watermark
    const eventDates = events.map((e) => e.startDate).filter(Boolean).sort();
    await supabase.from("ingest_runs").insert({
      source: "rk9",
      min_date: eventDates[0] ?? null,
      max_date: eventDates[eventDates.length - 1] ?? null,
      event_count: synced,
      status: failed.length > 0 ? "partial" : "ok",
      notes: failed.length > 0 ? failed.join("; ") : null,
    });

    // Update ingest_events_seen
    for (const event of events) {
      await supabase.from("ingest_events_seen").upsert(
        {
          source: "rk9",
          source_event_id: event.rk9Id,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "source,source_event_id" }
      );
    }

    return NextResponse.json({
      message: `Synced ${synced} TCG events from RK9`,
      total: events.length,
      synced,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from RK9", details: String(err) },
      { status: 502 }
    );
  }
}
