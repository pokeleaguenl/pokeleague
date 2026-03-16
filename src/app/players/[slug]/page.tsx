import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PlayerStats {
  totalEntries: number;
  bestFinish: number;
  avgFinish: number;
  top8Count: number;
  top16Count: number;
  top32Count: number;
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Convert slug back to player name (slug is lowercase with hyphens)
  // We'll need to search case-insensitively
  const searchName = slug.replace(/-/g, ' ');

  // Get player's tournament history
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('tournament_id, archetype, rank, player_name, country, decklist_url')
    .ilike('player_name', searchName)
    .not('rank', 'is', null)
    .order('rank', { ascending: true });

  if (!standings || standings.length === 0) {
    notFound();
  }

  // Get the actual player name (with correct capitalization)
  const playerName = standings[0].player_name;
  const country = standings[0].country || '??';

  // Calculate stats
  const ranks = standings.map(s => s.rank);
  const stats: PlayerStats = {
    totalEntries: standings.length,
    bestFinish: Math.min(...ranks),
    avgFinish: Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length),
    top8Count: standings.filter(s => s.rank <= 8).length,
    top16Count: standings.filter(s => s.rank <= 16).length,
    top32Count: standings.filter(s => s.rank <= 32).length,
  };

  // Get unique tournaments
  const tournamentIds = [...new Set(standings.map(s => s.tournament_id))];
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, event_date')
    .in('id', tournamentIds);

  const tournamentMap = new Map(tournaments?.map(t => [t.id, t]) || []);

  // Group by tournament
  const byTournament = standings.reduce((acc, s) => {
    if (!acc[s.tournament_id]) {
      acc[s.tournament_id] = [];
    }
    acc[s.tournament_id].push(s);
    return acc;
  }, {} as Record<string, typeof standings>);

  // Sort tournaments by date (most recent first)
  const sortedTournaments = Object.entries(byTournament).sort((a, b) => {
    const dateA = tournamentMap.get(a[0])?.event_date || '';
    const dateB = tournamentMap.get(b[0])?.event_date || '';
    return dateB.localeCompare(dateA);
  });

  // Count deck usage
  const deckUsage = standings.reduce((acc, s) => {
    if (s.archetype && s.archetype !== 'Unknown') {
      acc[s.archetype] = (acc[s.archetype] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topDecks = Object.entries(deckUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/leaderboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to Leaderboard
        </Link>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-black">{playerName}</h1>
          <span className="text-2xl">{country === 'US' ? '🇺🇸' : country === 'CA' ? '🇨🇦' : country === 'GB' ? '🇬🇧' : country === 'AU' ? '🇦🇺' : country === 'JP' ? '🇯🇵' : country === 'DE' ? '🇩🇪' : country === 'FR' ? '🇫🇷' : '🌍'}</span>
        </div>
        <p className="text-gray-400">Tournament Player Profile</p>
      </div>

      {/* Stats Grid */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Tournaments" value={tournamentIds.length} />
          <StatCard label="Total Entries" value={stats.totalEntries} />
          <StatCard label="Best Finish" value={`#${stats.bestFinish}`} highlight={stats.bestFinish <= 8} />
          <StatCard label="Top 8s" value={stats.top8Count} highlight={stats.top8Count > 0} />
          <StatCard label="Top 16s" value={stats.top16Count} />
          <StatCard label="Top 32s" value={stats.top32Count} />
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tournament History */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Tournament History</h2>
          <div className="space-y-4">
            {sortedTournaments.map(([tournamentId, entries]) => {
              const tournament = tournamentMap.get(tournamentId);
              const bestRank = Math.min(...entries.map(e => e.rank));
              
              return (
                <div key={tournamentId} className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{tournament?.name || 'Unknown Tournament'}</h3>
                      <p className="text-sm text-gray-500">{tournament?.event_date || 'Unknown date'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${bestRank <= 8 ? 'text-yellow-400' : bestRank <= 32 ? 'text-blue-400' : 'text-white'}`}>
                        #{bestRank}
                      </p>
                      <p className="text-xs text-gray-500">Best finish</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {entries.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-t border-white/5 pt-2">
                        <span className={entry.archetype === 'Unknown' ? 'text-gray-600' : 'text-gray-300'}>
                          {entry.archetype || 'Unknown deck'}
                        </span>
                        <span className="text-gray-500">#{entry.rank}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Favorite Decks */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-lg font-bold mb-4">Most Played Decks</h2>
            {topDecks.length > 0 ? (
              <div className="space-y-3">
                {topDecks.map(([deck, count]) => (
                  <div key={deck} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 flex-1 mr-2">{deck}</span>
                    <span className="text-sm font-bold text-yellow-400">{count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deck data</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h2 className="text-lg font-bold mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Average Finish</span>
                <span className="text-sm font-bold">#{stats.avgFinish}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 8 Rate</span>
                <span className="text-sm font-bold text-yellow-400">
                  {Math.round((stats.top8Count / stats.totalEntries) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Top 32 Rate</span>
                <span className="text-sm font-bold text-blue-400">
                  {Math.round((stats.top32Count / stats.totalEntries) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-yellow-400/30 bg-yellow-400/10' : 'border-white/10 bg-gray-900/50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
