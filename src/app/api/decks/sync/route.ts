import { createClient } from "@/lib/supabase/server";
import {
  fetchMetaDecks,
  calculateCost,
  calculateTier,
} from "@/lib/limitless";
import { NextResponse } from "next/server";

/**
 * POST /api/decks/sync
 * Fetches current meta from Limitless and upserts into our decks table.
 * Requires authenticated user.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metaDecks = await fetchMetaDecks();

    if (metaDecks.length === 0) {
      return NextResponse.json(
        { error: "No decks found from Limitless" },
        { status: 502 }
      );
    }

    // Upsert each deck
    const results = [];
    for (const deck of metaDecks) {
      const { data, error } = await supabase
        .from("decks")
        .upsert(
          {
            name: deck.name,
            limitless_id: deck.limitlessId,
            meta_share: deck.metaShare,
            cost: calculateCost(deck.metaShare),
            tier: calculateTier(deck.metaShare),
            image_url: deck.imageUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "name" }
        )
        .select();

      if (error) {
        results.push({ name: deck.name, error: error.message });
      } else {
        results.push({ name: deck.name, ok: true, data });
      }
    }

    const synced = results.filter((r) => "ok" in r).length;
    const failed = results.filter((r) => "error" in r);

    // Track ingestion
    await supabase.from("ingest_runs").insert({
      source: "limitless_meta",
      event_count: synced,
      status: failed.length > 0 ? "partial" : "ok",
      notes: failed.length > 0 ? `${failed.length} decks failed to sync` : null,
    });

    return NextResponse.json({
      message: `Synced ${synced} decks from Limitless`,
      total: metaDecks.length,
      synced,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from Limitless", details: String(err) },
      { status: 502 }
    );
  }
}
