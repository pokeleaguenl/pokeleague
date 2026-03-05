import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed-fantasy
 * Seeds fantasy_archetypes, aliases, and fantasy_events from existing data
 * Idempotent - safe to run multiple times
 * Uses admin client for RLS-protected writes
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create admin client for RLS-protected writes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[seed-fantasy] Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
    });
    return NextResponse.json({ 
      error: "Server configuration error: Missing Supabase credentials",
      details: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey,
      }
    }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
  console.log("[seed-fantasy] Admin client created with service role key");

  const log: string[] = [];

  // ============================================================
  // PART 1: Seed fantasy_archetypes from decks table
  // ============================================================
  log.push("=== Seeding Archetypes ===");
  
  const { data: decks, error: decksError } = await supabase
    .from("decks")
    .select("id, name, image_url");

  if (decksError || !decks) {
    return NextResponse.json({ error: "Failed to load decks" }, { status: 500 });
  }

  let archetypesCreated = 0;
  let archetypesSkipped = 0;

  for (const deck of decks) {
    const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: existing } = await supabase
      .from("fantasy_archetypes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      archetypesSkipped++;
      continue;
    }

    const { error } = await adminClient
      .from("fantasy_archetypes")
      .insert({
        slug,
        name: deck.name,
        image_url: deck.image_url,
      });

    if (error) {
      log.push(`❌ Failed to create archetype: ${deck.name} - ${error.message}`);
    } else {
      archetypesCreated++;
    }
  }

  log.push(`✅ Archetypes: ${archetypesCreated} created, ${archetypesSkipped} skipped`);

  // ============================================================
  // PART 2: Seed common aliases for archetypes
  // ============================================================
  log.push("\n=== Seeding Aliases ===");

  const aliasMap: Record<string, string[]> = {
    "charizard-ex": ["charizard", "zard", "char"],
    "pidgeot-ex": ["pidgeot", "pidg"],
    "pikachu-ex": ["pikachu", "pika"],
    "lugia-vstar": ["lugia"],
    "miraidon-ex": ["miraidon"],
    "raging-bolt-ex": ["raging-bolt", "bolt"],
    "regidrago-vstar": ["regidrago", "drago"],
    "roaring-moon-ex": ["roaring-moon", "moon"],
    "snorlax-stall": ["snorlax", "stall"],
  };

  let aliasesCreated = 0;
  let aliasesSkipped = 0;

  for (const [slug, aliases] of Object.entries(aliasMap)) {
    // Debug: Check archetype lookup
    console.log(`[seed-fantasy] Looking up archetype: ${slug}`);
    
    const { data: archetype, error: lookupError } = await supabase
      .from("fantasy_archetypes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (lookupError) {
      log.push(`❌ Error looking up archetype ${slug}: ${lookupError.message}`);
      console.error(`[seed-fantasy] Archetype lookup error for ${slug}:`, lookupError);
      continue;
    }

    if (!archetype) {
      log.push(`⚠️  Skipping aliases for unknown archetype: ${slug}`);
      console.log(`[seed-fantasy] Archetype not found: ${slug}`);
      continue;
    }

    console.log(`[seed-fantasy] Found archetype: ${slug} → id=${archetype.id}`);

    // Batch upsert all aliases for this archetype
    const aliasRecords = aliases.map(alias => ({
      alias,
      archetype_id: archetype.id,
    }));

    console.log(`[seed-fantasy] Upserting ${aliasRecords.length} aliases for ${slug}:`, aliasRecords);

    const { data: upserted, error } = await adminClient
      .from("fantasy_archetype_aliases")
      .upsert(aliasRecords, { onConflict: "alias" })
      .select();

    if (error) {
      const errorMsg = `❌ Failed to upsert aliases for ${slug}: ${error.message} (code: ${error.code}, details: ${error.details || 'none'}, hint: ${error.hint || 'none'})`;
      log.push(errorMsg);
      console.error(`[seed-fantasy] Alias upsert error for ${slug}:`, {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        aliasRecords,
      });
    } else {
      const count = upserted?.length || 0;
      aliasesCreated += count;
      console.log(`[seed-fantasy] Successfully upserted ${count} aliases for ${slug}`);
      if (count > 0) {
        log.push(`✅ Upserted ${count} aliases for ${slug}: ${aliases.join(", ")}`);
      }
    }
  }

  log.push(`✅ Aliases: ${aliasesCreated} created/updated, ${aliasesSkipped} skipped`);

  // ============================================================
  // PART 3: Seed fantasy_events from tournaments
  // ============================================================
  log.push("\n=== Seeding Fantasy Events ===");

  const { data: tournaments, error: tournamentsError } = await supabase
    .from("tournaments")
    .select("id, name, event_date, status")
    .gte("event_date", "2025-09-01") // Only recent tournaments
    .order("event_date", { ascending: false });

  if (tournamentsError || !tournaments) {
    return NextResponse.json({ error: "Failed to load tournaments" }, { status: 500 });
  }

  let eventsCreated = 0;
  let eventsSkipped = 0;

  for (const tournament of tournaments) {
    const { data: existing } = await supabase
      .from("fantasy_events")
      .select("id")
      .eq("tournament_id", tournament.id)
      .maybeSingle();

    if (existing) {
      eventsSkipped++;
      continue;
    }

    const now = new Date().toISOString().split("T")[0];
    const eventDate = tournament.event_date || now;
    
    let status: "upcoming" | "live" | "completed" = "upcoming";
    if (eventDate < now) {
      status = "completed";
    } else if (eventDate === now) {
      status = "live";
    }

    const { error } = await adminClient
      .from("fantasy_events")
      .insert({
        tournament_id: tournament.id,
        name: tournament.name,
        event_date: tournament.event_date,
        status,
      });

    if (error) {
      log.push(`❌ Failed to create fantasy event: ${tournament.name} - ${error.message}`);
    } else {
      eventsCreated++;
    }
  }

  log.push(`✅ Fantasy Events: ${eventsCreated} created, ${eventsSkipped} skipped`);

  return NextResponse.json({
    ok: true,
    message: `Seed complete: ${archetypesCreated} archetypes, ${aliasesCreated} aliases, ${eventsCreated} events`,
    log,
  });
}
