import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DeckFilters from "./deck-filters";

export const dynamic = 'force-dynamic';

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: decks } = await supabase.rpc("get_deck_list_with_points");
  const allDecks = decks ?? [];

  // Count by tier for header stats
  const byTier: Record<string, number> = {};
  for (const deck of allDecks) {
    const tier = deck.tier || "D";
    byTier[tier] = (byTier[tier] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          Deck <span className="text-yellow-400">Analytics</span>
        </h1>
        <p className="text-sm text-gray-500">
          {allDecks.length} fantasy-eligible decks · updated from RK9 standings
        </p>
      </div>

      {/* Client-side filters and deck list */}
      <DeckFilters decks={allDecks} />
    </div>
  );
}
