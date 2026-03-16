import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchupSelector from "./matchup-selector";

export const dynamic = 'force-dynamic';

export default async function MatchupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get top decks for selection
  const { data: topDecks } = await supabase
    .rpc('get_deck_list_with_points')
    .order('meta_share', { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">
          Deck <span className="text-yellow-400">Matchups</span>
        </h1>
        <p className="text-gray-400">
          Compare head-to-head performance across tournaments
        </p>
      </div>

      {/* Matchup Selector */}
      <MatchupSelector decks={topDecks || []} />
    </div>
  );
}
