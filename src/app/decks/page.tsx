import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DeckFilters from "./deck-filters";
import MetaSnapshotChart from "./meta-snapshot-chart";

export const dynamic = 'force-dynamic';

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase.rpc("get_deck_list_with_points");
  const allDecks = decks ?? [];

  // Tier counts for header
  const byTier: Record<string, number> = {};
  for (const deck of allDecks) {
    const tier = deck.tier || "D";
    byTier[tier] = (byTier[tier] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-1">
          Deck <span className="text-yellow-400">Analytics</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span>{allDecks.length} fantasy-eligible decks</span>
          {byTier["S"] > 0 && <span className="text-red-400 font-semibold">{byTier["S"]} S-tier</span>}
          {byTier["A"] > 0 && <span className="text-orange-400 font-semibold">{byTier["A"]} A-tier</span>}
        </div>
      </div>

      {/* Meta Snapshot chart */}
      <MetaSnapshotChart decks={allDecks} />

      {/* Client-side filters and deck list */}
      <DeckFilters decks={allDecks} />
    </div>
  );
}
