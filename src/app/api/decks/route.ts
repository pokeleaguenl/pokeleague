import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/decks
 * Returns all decks sorted by tier and cost.
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .order("meta_share", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
