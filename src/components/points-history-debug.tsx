import { createClient } from "@/lib/supabase/server";

export async function PointsHistoryDebug({ userId }: { userId: string }) {
  const supabase = await createClient();
  
  const { data: history, error } = await supabase
    .from('tournament_scores')
    .select(`
      points_earned,
      squad_snapshot,
      created_at,
      tournament:tournaments(name, event_date)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
        <p className="text-red-400">Error loading history: {error.message}</p>
      </div>
    );
  }
  
  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-gray-400">No tournament history yet</p>
        <p className="text-xs text-gray-600 mt-1">Points will appear here after tournaments</p>
        <p className="text-xs text-yellow-600 mt-2">User ID: {userId}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-green-400 mb-2">✅ Found {history.length} tournament(s)</div>
      {history.map((entry, i) => {
        const tournament = Array.isArray(entry.tournament) 
          ? entry.tournament[0] 
          : entry.tournament;
        const scoredDecks = entry.squad_snapshot?.scored_decks || [];
        
        return (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <pre className="text-xs text-gray-500 mb-2">
              {JSON.stringify({ tournament, points: entry.points_earned, decks: scoredDecks.length }, null, 2)}
            </pre>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{tournament?.name || 'Unknown Tournament'}</p>
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
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-2xl font-bold text-yellow-400">
                  +{entry.points_earned}
                </p>
                <p className="text-[10px] text-gray-600">points</p>
              </div>
            </div>
            
            {scoredDecks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                  Point Breakdown
                </p>
                {scoredDecks.map((deck: any, j: number) => (
                  <div key={j} className="flex items-center justify-between text-sm bg-black/20 rounded-lg px-3 py-2">
                    <span className="text-gray-300 truncate flex-1">{deck.deck}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-gray-500">Rank {deck.rank}</span>
                      <span className="text-yellow-400 font-semibold min-w-[3rem] text-right">+{deck.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
