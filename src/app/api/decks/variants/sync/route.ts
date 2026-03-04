import { createClient } from "@/lib/supabase/server";
import { fetchDeckVariants } from "@/lib/limitless";
import { NextResponse } from "next/server";

/**
 * POST /api/decks/variants/sync
 * Fetches variants for all decks from Limitless and upserts into deck_variants.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: decks, error: decksError } = await supabase
    .from("decks")
    .select("id, name, limitless_id")
    .not("limitless_id", "is", null);

  if (decksError || !decks) {
    return NextResponse.json({ error: "Failed to load decks" }, { status: 500 });
  }

  const results = [];
  for (const deck of decks) {
    try {
      const variants = await fetchDeckVariants(deck.limitless_id);
      for (const v of variants) {
        const { error } = await supabase
          .from("deck_variants")
          .upsert(
            {
              deck_id: deck.id,
              name: v.name,
              limitless_value: v.limitlessValue,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "deck_id,name" }
          );
        if (error) results.push({ deck: deck.name, variant: v.name, error: error.message });
        else results.push({ deck: deck.name, variant: v.name, ok: true });
      }
      // Small delay to be nice to Limitless servers
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      results.push({ deck: deck.name, error: String(err) });
    }
  }

  const synced = results.filter((r) => "ok" in r).length;
  const failed = results.filter((r) => "error" in r);
  return NextResponse.json({ message: `Synced ${synced} variants`, synced, failed });
}
