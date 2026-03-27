import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { computeEventStatus } from "@/lib/fantasy/eventStatus";

/**
 * POST /api/admin/seed-fantasy
 * Seeds fantasy_archetypes, aliases, and fantasy_events from existing data
 * Idempotent - safe to run multiple times
 * Uses admin client for RLS-protected writes
 */
export async function POST() {
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

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
  // PART 2: Auto-generate aliases for ALL archetypes
  // ============================================================
  log.push("\n=== Seeding Aliases ===");

  const { data: allArchetypes } = await supabase
    .from("fantasy_archetypes")
    .select("id, slug, name")
    .order("name");

  if (!allArchetypes || allArchetypes.length === 0) {
    log.push("⚠️  No archetypes found — skipping alias generation");
  }

  log.push(`Generating aliases for ${allArchetypes?.length ?? 0} archetypes...`);

  // Supplemental short-form aliases for well-known decks (additive on top of auto-gen)
  const supplementalAliases: Record<string, string[]> = {
    "charizard-ex": ["zard", "char"],
    "pidgeot-ex": ["pidg"],
    "pikachu-ex": ["pika"],
    "regidrago-vstar": ["drago"],
    "roaring-moon-ex": ["moon"],
    "raging-bolt-ex": ["bolt"],
    "snorlax-stall": ["stall"],
    "miraidon-ex": ["miraidon"],
    "lugia-vstar": ["lugia"],
    "gardevoir-ex": ["gardy", "garde"],
    "iron-valiant-ex": ["valiant"],
    "gholdengo-ex": ["gholdy"],
    "dragapult-ex": ["dragapult"],
    "klawf": ["klawf-stall"],
    "lost-zone-toolbox": ["lost-box", "lostbox", "lz-toolbox"],
    "palkia-vstar": ["palkia"],
    "origin-forme-palkia-vstar": ["palkia", "origin-palkia"],
  };

  // Suffixes to strip when generating bare-word aliases
  const STRIP_SUFFIXES = [" ex", " vstar", " vmax", " v", " gx", " stall", "-ex", "-vstar", "-vmax", "-v", "-gx"];

  function generateAliases(slug: string, name: string): string[] {
    const generated = new Set<string>();
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // The slug itself (always exact match via slug column, but add as alias too for alias-path lookups)
    generated.add(slug);

    // If name has " / " (multi-pokemon), add each part as its own slug
    if (name.includes(" / ")) {
      const parts = name.split(" / ");
      for (const part of parts) {
        const partSlug = slugify(part);
        generated.add(partSlug);
        // Also strip suffixes from each part
        for (const suffix of STRIP_SUFFIXES) {
          if (partSlug.endsWith(suffix.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) {
            const stripped = partSlug.slice(0, partSlug.length - suffix.replace(/[^a-z0-9]+/g, "-").length - 1);
            if (stripped.length > 2) generated.add(stripped);
          }
          const namePart = part.toLowerCase();
          if (namePart.endsWith(suffix.toLowerCase())) {
            const bare = slugify(namePart.slice(0, namePart.length - suffix.length));
            if (bare.length > 2) generated.add(bare);
          }
        }
      }
    }

    // Strip common suffixes from the full name
    let stripped = name.toLowerCase();
    for (const suffix of STRIP_SUFFIXES) {
      if (stripped.endsWith(suffix.toLowerCase())) {
        const bare = slugify(stripped.slice(0, stripped.length - suffix.length));
        if (bare.length > 2) generated.add(bare);
        stripped = stripped.slice(0, stripped.length - suffix.length);
        break;
      }
    }

    // If first word of name is a Pokemon, add it as alias (only if > 3 chars to avoid noise)
    const firstWord = slugify(name.split(/\s+/)[0]);
    if (firstWord.length > 3) generated.add(firstWord);

    // Remove the slug from generated (it's already the primary key, alias would be redundant
    // but is harmless — keep it for alias-path lookup coverage)
    return Array.from(generated).filter(a => a.length > 1);
  }

  let aliasesCreated = 0;
  const archetypesWithNoAliases: string[] = [];

  for (const archetype of allArchetypes ?? []) {
    const autoAliases = generateAliases(archetype.slug, archetype.name);
    const extra = supplementalAliases[archetype.slug] ?? [];
    const allAliases = Array.from(new Set([...autoAliases, ...extra]));

    if (allAliases.length === 0) {
      archetypesWithNoAliases.push(archetype.slug);
      continue;
    }

    const aliasRecords = allAliases.map(alias => ({
      alias,
      archetype_id: archetype.id,
    }));

    const { data: upserted, error } = await adminClient
      .from("fantasy_archetype_aliases")
      .upsert(aliasRecords, { onConflict: "alias" })
      .select();

    if (error) {
      log.push(`❌ Failed aliases for ${archetype.slug}: ${error.message}`);
    } else {
      aliasesCreated += upserted?.length ?? 0;
    }
  }

  log.push(`✅ Aliases: ${aliasesCreated} upserted across ${allArchetypes?.length ?? 0} archetypes`);
  if (archetypesWithNoAliases.length > 0) {
    log.push(`⚠️  ${archetypesWithNoAliases.length} archetypes generated no aliases: ${archetypesWithNoAliases.join(", ")}`);
  }

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

    const eventDate = tournament.event_date ?? new Date().toISOString().split("T")[0];
    const status = computeEventStatus(eventDate);

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
