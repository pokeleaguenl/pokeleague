import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Variant {
  id: number;
  name: string;
  slug: string;
  entryCount: number;
}

export default async function DeckVariants({ archetypeId }: { archetypeId: number }) {
  const supabase = await createClient();

  // Find all archetypes that have this as their canonical_id
  const { data: variants } = await supabase
    .from('fantasy_archetypes')
    .select('id, name, slug')
    .eq('canonical_id', archetypeId)
    .order('name');

  if (!variants || variants.length === 0) {
    return null;
  }

  // Get entry counts for each variant
  const variantsWithCounts: Variant[] = [];

  for (const variant of variants) {
    const { data: aliases } = await supabase
      .from('fantasy_archetype_aliases')
      .select('alias')
      .eq('archetype_id', variant.id);

    let entryCount = 0;
    if (aliases && aliases.length > 0) {
      const aliasStrings = aliases.map(a => a.alias);
      const { count } = await supabase
        .from('rk9_standings')
        .select('*', { count: 'exact', head: true })
        .in('archetype', aliasStrings);
      entryCount = count || 0;
    }

    variantsWithCounts.push({
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      entryCount
    });
  }

  // Sort by entry count descending
  variantsWithCounts.sort((a, b) => b.entryCount - a.entryCount);

  // Only show variants with data
  const withData = variantsWithCounts.filter(v => v.entryCount > 0);

  if (withData.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
      <h2 className="text-base font-bold text-white mb-4">
        Popular Variants
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Other deck variants using this archetype
      </p>
      <div className="space-y-2">
        {withData.map((variant) => (
          <Link
            key={variant.id}
            href={`/decks/${variant.slug}`}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3 hover:bg-black/40 hover:border-yellow-400/30 transition-all group"
          >
            <span className="font-medium text-sm group-hover:text-yellow-400 transition-colors">
              {variant.name}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {variant.entryCount.toLocaleString()} entries
              </span>
              <span className="text-gray-600 group-hover:text-yellow-400 transition-colors">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
