import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: archetype } = await supabase
    .from("fantasy_archetypes")
    .select("*, aliases:fantasy_archetype_aliases(alias)")
    .eq("slug", slug)
    .maybeSingle();

  if (!archetype) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get score history across events
  const { data: scoreHistory } = await supabase
    .from("fantasy_archetype_scores_final")
    .select("*, event:fantasy_events(name, event_date)")
    .eq("archetype_id", archetype.id)
    .order("id", { ascending: false });

  return NextResponse.json({ archetype, scoreHistory: scoreHistory ?? [] });
}
