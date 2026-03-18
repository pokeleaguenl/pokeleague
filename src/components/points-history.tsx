import { createClient } from "@/lib/supabase/server";

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
      <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-gray-400">No tournament history yet</p>
        <p className="text-xs text-gray-600 mt-1">Points will appear here after tournaments</p>
      </div>
    );
  }
  
  // Calculate total tournaments and total points from history
  const totalTournaments = history.length;
  const totalPointsFromHistory = history.reduce((sum, entry) => sum + entry.points_earned, 0);
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-1">
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-2.5 text-center">
          <p className="text-lg font-bold text-yellow-400">{totalPointsFromHistory}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total Points</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-2.5 text-center">
          <p className="text-lg font-bold text-white">{totalTournaments}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Tournaments</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-2.5 text-center">
          <p className="text-lg font-bold text-white">
            {totalTournaments > 0 ? Math.round(totalPointsFromHistory / totalTournaments) : 0}
          </p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Avg/Event</p>
        </div>
      </div>
      
      {/* Tournament List */}
      <div className="space-y-3">
        {history.map((entry, i) => {
          const tournament = Array.isArray(entry.tournament) 
            ? entry.tournament[0] 
            : entry.tournament;
          const scoredDecks = entry.squad_snapshot?.scored_decks || [];
          const totalDecks = entry.squad_snapshot?.total_decks || 10;
          const nonScoringDecks = totalDecks - scoredDecks.length;
          
          return (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-colors">
              {/* Tournament Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-base">{tournament?.name || 'Unknown Tournament'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {tournament?.event_date 
                        ? new Date(tournament.event_date + 'T00:00:00Z').toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            timeZone: 'UTC'
                          })
                        : 'Date unknown'}
                    </p>
                    {tournament?.rk9_id && (
                      <a 
                        href={`https://rk9.gg/pairings/${tournament.rk9_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View on RK9 ↗
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-2xl font-bold text-yellow-400">
                    +{entry.points_earned}
                  </p>
                  <p className="text-[10px] text-gray-600">points</p>
                </div>
              </div>
              
              {/* Scoring Summary */}
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span className="text-gray-500">
                  {scoredDecks.length} of {totalDecks} decks scored
                </span>
                {scoredDecks.length > 0 && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
              
              {/* Point Breakdown */}
              {scoredDecks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                    Scoring Decks ({scoredDecks.length})
                  </p>
                  {scoredDecks.map((deck: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-sm bg-black/20 rounded-lg px-3 py-2 border border-gray-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 truncate font-medium">{deck.deck}</p>
                        <p className="text-[10px] text-gray-600">
                          Placed {deck.rank === 1 ? '🥇 1st' : deck.rank === 2 ? '🥈 2nd' : deck.rank === 3 ? '🥉 3rd' : `#${deck.rank}`}
                        </p>
                      </div>
                      <div className="shrink-0 ml-3">
                        <span className="text-yellow-400 font-bold text-lg">+{deck.points}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Non-scoring decks note */}
                  {nonScoringDecks > 0 && (
                    <p className="text-[10px] text-gray-600 mt-2 italic">
                      {nonScoringDecks} deck{nonScoringDecks > 1 ? 's' : ''} did not place in top 32
                    </p>
                  )}
                </div>
              )}
              
              {/* No scoring decks message */}
              {scoredDecks.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-3 text-center">
                  <p className="text-xs text-gray-500">No decks placed in top 32 this event</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
