import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { playerToSlug } from "@/lib/utils/playerSlug";
import MetaBreakdownChart from "./meta-breakdown-chart";

export const dynamic = 'force-dynamic';

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (!tournament || !tournament.rk9_id) notFound();

  // Get standings
  const { data: standings, count: totalEntries } = await supabase
    .from('rk9_standings')
    .select('player_name, archetype, rank, country', { count: 'exact' })
    .eq('tournament_id', tournament.rk9_id)
    .order('rank', { ascending: true });

  const standingsWithKnownDecks = standings?.filter(s => s.archetype !== 'Unknown') || [];

  // Calculate meta breakdown
  const metaBreakdown: Record<string, number> = {};
  for (const s of standingsWithKnownDecks) {
    metaBreakdown[s.archetype] = (metaBreakdown[s.archetype] || 0) + 1;
  }

  const metaBreakdownArray = Object.entries(metaBreakdown)
    .map(([deck, count]) => ({
      deck,
      count,
      percentage: parseFloat(((count / standingsWithKnownDecks.length) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  // Winner
  const winner = standings?.[0];

  // Top cuts
  const top8 = standings?.filter(s => s.rank <= 8) || [];
  const top16 = standings?.filter(s => s.rank <= 16) || [];
  const top32 = standings?.filter(s => s.rank <= 32) || [];

  // Format date
  const eventDate = new Date(tournament.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to Events
        </Link>
        <h1 className="text-4xl font-black mb-2">
          {tournament.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-400">
          <span>📅 {formattedDate}</span>
          <span>•</span>
          <span>👥 {totalEntries} entries</span>
          <span>•</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            tournament.status === 'completed' ? 'bg-green-400/10 text-green-400' :
            tournament.status === 'live' ? 'bg-yellow-400/10 text-yellow-400' :
            'bg-gray-400/10 text-gray-400'
          }`}>
            {tournament.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Winner Spotlight */}
          {winner && (
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl">🏆</div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2">
                    Champion
                  </h2>
                  <Link 
                    href={`/players/${playerToSlug(winner.player_name)}`}
                    className="text-2xl font-black hover:text-yellow-400 transition-colors"
                  >
                    {winner.player_name}
                  </Link>
                  <p className="text-gray-400 mt-1">
                    {winner.archetype} · {winner.country}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top 8 Standings */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
              Top 8 Finishers
            </h2>
            <div className="space-y-2">
              {top8.map((player) => (
                <div 
                  key={player.rank} 
                  className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black w-8 ${
                      player.rank === 1 ? 'text-yellow-400' :
                      player.rank <= 4 ? 'text-orange-400' :
                      'text-gray-400'
                    }`}>
                      #{player.rank}
                    </span>
                    <div>
                      <Link 
                        href={`/players/${playerToSlug(player.player_name)}`}
                        className="font-medium hover:text-yellow-400 transition-colors"
                      >
                        {player.player_name}
                      </Link>
                      <p className="text-xs text-gray-500">{player.archetype}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{player.country}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full Standings Toggle */}
          <details className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <summary className="cursor-pointer text-sm font-bold text-gray-400 uppercase tracking-wide hover:text-white transition-colors">
              View All Standings ({standings?.length || 0} players)
            </summary>
            <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
              {standings?.map((player) => (
                <div 
                  key={player.rank} 
                  className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 w-12">#{player.rank}</span>
                    <Link 
                      href={`/players/${playerToSlug(player.player_name)}`}
                      className="hover:text-yellow-400 transition-colors"
                    >
                      {player.player_name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-xs">{player.archetype}</span>
                    <span className="text-gray-600 text-xs w-8">{player.country}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Tournament Stats */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
              Tournament Stats
            </h2>
            <div className="space-y-3">
              <StatRow label="Total Entries" value={totalEntries?.toString() || '0'} />
              <StatRow label="Top 8" value={top8.length.toString()} />
              <StatRow label="Top 16" value={top16.length.toString()} />
              <StatRow label="Top 32" value={top32.length.toString()} />
              <StatRow label="Unique Decks" value={metaBreakdownArray.length.toString()} />
            </div>
          </div>

          {/* Meta Breakdown Chart */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
              Meta Breakdown
            </h2>
            <MetaBreakdownChart data={metaBreakdownArray.slice(0, 8)} />
          </div>

          {/* Top Decks List */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
              Most Played Decks
            </h2>
            <div className="space-y-2">
              {metaBreakdownArray.slice(0, 5).map((item, i) => (
                <div key={item.deck} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                    <span className="text-sm truncate">{item.deck}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-400">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
