import { createClient } from "@/lib/supabase/server";

type ScoredDeck = { deck: string; rank: number; points: number; zone?: string };

function PlacementBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  if (rank <= 8) return <span className="text-xs font-bold text-yellow-400">Top 8</span>;
  if (rank <= 16) return <span className="text-xs font-bold text-purple-400">Top 16</span>;
  if (rank <= 32) return <span className="text-xs font-bold text-blue-400">Top 32</span>;
  return <span className="text-xs text-gray-600">#{rank}</span>;
}

function ScoreBar({ points, maxPoints }: { points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  return (
    <div className="h-1 rounded-full bg-gray-800 overflow-hidden mt-1">
      <div
        className="h-1 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export async function PointsHistory({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: history } = await supabase
    .from('tournament_scores')
    .select(`
      points_earned,
      squad_snapshot,
      created_at,
      tournament:tournaments(name, event_date, rk9_id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!history || history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-800 p-10 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-400 font-semibold">No tournament history yet</p>
        <p className="text-xs text-gray-600 mt-1">Points will appear here after tournaments are scored</p>
      </div>
    );
  }

  const totalTournaments = history.length;
  const totalPointsFromHistory = history.reduce((sum, entry) => sum + entry.points_earned, 0);
  const avgPerEvent = totalTournaments > 0 ? Math.round(totalPointsFromHistory / totalTournaments) : 0;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 text-center">
          <p className="text-xl font-black text-yellow-400">{totalPointsFromHistory}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Total pts</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
          <p className="text-xl font-black text-white">{totalTournaments}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Events</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
          <p className="text-xl font-black text-white">{avgPerEvent}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Avg/event</p>
        </div>
      </div>

      {/* Tournament list */}
      <div className="space-y-3">
        {history.map((entry, i) => {
          const tournament = Array.isArray(entry.tournament) ? entry.tournament[0] : entry.tournament;
          const scoredDecks: ScoredDeck[] = entry.squad_snapshot?.scored_decks || [];
          const totalDecks = entry.squad_snapshot?.total_decks || 10;
          const nonScoringCount = totalDecks - scoredDecks.length;
          const maxDeckPoints = scoredDecks.length > 0 ? Math.max(...scoredDecks.map(d => d.points)) : 0;

          return (
            <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden hover:border-gray-700 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between p-4 pb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{tournament?.name || 'Unknown Tournament'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {tournament?.event_date
                        ? new Date(tournament.event_date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
                        : 'Date unknown'}
                    </p>
                    {tournament?.rk9_id && (
                      <a href={`https://rk9.gg/pairings/${tournament.rk9_id}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline">RK9 ↗</a>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-3xl font-black text-yellow-400">+{entry.points_earned}</p>
                  <p className="text-[10px] text-gray-600">points</p>
                </div>
              </div>

              {/* Scored decks — visual bar breakdown */}
              {scoredDecks.length > 0 ? (
                <div className="border-t border-white/5 bg-black/20 px-4 py-3 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">
                    {scoredDecks.length} deck{scoredDecks.length !== 1 ? "s" : ""} scored
                  </p>
                  {scoredDecks.map((deck, j) => (
                    <div key={j}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <PlacementBadge rank={deck.rank} />
                          <p className="text-sm font-medium text-gray-200 truncate">{deck.deck}</p>
                          {deck.zone === "active" && (
                            <span className="shrink-0 text-[9px] rounded bg-yellow-400/15 px-1.5 py-0.5 text-yellow-400 font-bold">⭐ 2×</span>
                          )}
                        </div>
                        <span className="text-sm font-black text-yellow-400 shrink-0 ml-3">+{deck.points}</span>
                      </div>
                      <ScoreBar points={deck.points} maxPoints={maxDeckPoints} />
                    </div>
                  ))}
                  {nonScoringCount > 0 && (
                    <p className="text-[10px] text-gray-700 pt-1">
                      {nonScoringCount} deck{nonScoringCount !== 1 ? "s" : ""} did not place in top 32
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t border-white/5 bg-black/10 px-4 py-3 text-center">
                  <p className="text-xs text-gray-600">No decks placed in top 32 this event</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
