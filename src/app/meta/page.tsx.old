import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MetaChart from "./meta-chart";

export const dynamic = 'force-dynamic';

export default async function MetaTimelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get top decks by meta share
  const { data: topDecks } = await supabase
    .rpc('get_deck_list_with_points')
    .order('meta_share', { ascending: false })
    .limit(8);

  // Get all tournaments ordered by date
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, event_date')
    .order('event_date', { ascending: true });

  // For each top deck, get entry counts per tournament
  const deckData = [];

  for (const deck of topDecks || []) {
    // Get archetype
    const { data: archetype } = await supabase
      .from('fantasy_archetypes')
      .select('id')
      .eq('id', deck.archetype_id)
      .single();

    if (!archetype) continue;

    // Get aliases
    const { data: aliases } = await supabase
      .from('fantasy_archetype_aliases')
      .select('alias')
      .eq('archetype_id', archetype.id);

    if (!aliases || aliases.length === 0) continue;

    // Get standings
    const aliasStrings = aliases.map(a => a.alias);
    const { data: standings } = await supabase
      .from('rk9_standings')
      .select('tournament_id')
      .in('archetype', aliasStrings);

    // Count by tournament
    const countsByTournament: Record<string, number> = {};
    for (const s of standings || []) {
      if (!countsByTournament[s.tournament_id]) countsByTournament[s.tournament_id] = 0;
      countsByTournament[s.tournament_id]++;
    }

    deckData.push({
      name: deck.deck_name,
      slug: deck.archetype_slug,
      countsByTournament
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">
          Meta <span className="text-yellow-400">Timeline</span>
        </h1>
        <p className="text-gray-400">
          Track deck popularity across tournaments
        </p>
      </div>

      {/* Chart */}
      <MetaChart 
        deckData={deckData}
        tournaments={tournaments || []}
      />
    </div>
  );
}
