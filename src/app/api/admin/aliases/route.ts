import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

function normalizeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** GET — return unmatched rk9 archetype names with frequency counts */
export async function GET() {
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();

  const [{ data: archetypesRaw }, { data: aliasesRaw }, { data: rk9Raw }] = await Promise.all([
    supabase.from("fantasy_archetypes").select("id, name, slug"),
    supabase.from("fantasy_archetype_aliases").select("archetype_id, alias"),
    supabase.from("rk9_standings")
      .select("archetype")
      .not("archetype", "is", null)
      .not("archetype", "eq", "Unknown"),
  ]);

  // Build resolution maps
  const bySlug = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const a of archetypesRaw ?? []) {
    bySlug.set(a.slug as string, a.id as number);
    byName.set((a.name as string).toLowerCase(), a.id as number);
  }
  const byAlias = new Map<string, number>();
  for (const al of aliasesRaw ?? []) {
    byAlias.set((al.alias as string).toLowerCase(), al.archetype_id as number);
  }

  function canResolve(deckName: string): boolean {
    const slug = normalizeSlug(deckName);
    if (bySlug.has(slug)) return true;
    if (byName.has(deckName.toLowerCase())) return true;
    if (byAlias.has(slug) || byAlias.has(deckName.toLowerCase())) return true;
    if (deckName.includes(" / ")) {
      const first = deckName.split(" / ")[0].trim();
      return canResolve(first);
    }
    if (slug.includes("-") && !deckName.includes(" / ")) {
      const firstSeg = slug.split("-")[0];
      if (firstSeg.length >= 4 && (bySlug.has(firstSeg) || byAlias.has(firstSeg))) return true;
    }
    return false;
  }

  // Count frequency of each unresolved name
  const freq = new Map<string, number>();
  for (const row of rk9Raw ?? []) {
    const name = row.archetype as string;
    if (!name) continue;
    if (!canResolve(name)) {
      freq.set(name, (freq.get(name) ?? 0) + 1);
    }
  }

  const archetypeList = (archetypesRaw ?? []).map(a => ({ id: a.id as number, name: a.name as string, slug: a.slug as string }));
  const unmatched = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({ unmatched, archetypes: archetypeList });
}

/** POST — create a new alias */
export async function POST(req: Request) {
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const body = await req.json();
  const { alias, archetype_id } = body;

  if (!alias || !archetype_id) {
    return NextResponse.json({ error: "alias and archetype_id required" }, { status: 400 });
  }

  const normalized = normalizeSlug(alias);
  const { error } = await supabase.from("fantasy_archetype_aliases").upsert(
    { alias: normalized, archetype_id },
    { onConflict: "alias" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, alias: normalized, archetype_id });
}

/** DELETE — remove an alias */
export async function DELETE(req: Request) {
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;

  const supabase = await createClient();
  const { alias } = await req.json();
  if (!alias) return NextResponse.json({ error: "alias required" }, { status: 400 });

  const { error } = await supabase.from("fantasy_archetype_aliases").delete().eq("alias", alias);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
