import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/populate-archetypes
 * Creates fantasy_archetypes from existing decks table
 * One-time migration to populate the fantasy system
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all decks
  const { data: decks, error: decksError } = await supabase
    .from("decks")
    .select("id, name, image_url");

  if (decksError || !decks) {
    return NextResponse.json({ error: "Failed to load decks" }, { status: 500 });
  }

  const results = [];
  for (const deck of decks) {
    // Generate slug from name
    const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check if archetype already exists
    const { data: existing } = await supabase
      .from("fantasy_archetypes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      results.push({ deck: deck.name, status: "skipped", reason: "already exists" });
      continue;
    }

    // Create archetype
    const { data: archetype, error } = await supabase
      .from("fantasy_archetypes")
      .insert({
        slug,
        name: deck.name,
        image_url: deck.image_url,
      })
      .select()
      .single();

    if (error) {
      results.push({ deck: deck.name, status: "error", error: error.message });
    } else {
      results.push({ deck: deck.name, status: "created", id: archetype.id });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Created ${created} archetypes (${skipped} skipped, ${errors} errors)`,
    created,
    skipped,
    errors,
    details: results,
  });
}
