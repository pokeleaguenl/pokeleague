import type { SupabaseClient } from "@supabase/supabase-js";

interface TournamentStat {
  tournamentName: string;
  eventDate: string | null;
  entries: number;
  bestRank: number;
  top8: number;
  top16: number;
  top32: number;
  metaShare: number;
}

async function getTournamentBreakdown(
  supabase: SupabaseClient,
  archetypeId: number
): Promise<TournamentStat[]> {
  // Get all aliases for this archetype
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetypeId);

  if (!aliases || aliases.length === 0) return [];

  const aliasStrings = aliases.map(a => a.alias);

  // Get all standings for this archetype
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('tournament_id, rank')
    .in('archetype', aliasStrings)
    .not('rank', 'is', null);

  if (!standings || standings.length === 0) return [];

  // Group by tournament
  const byTournament: Record<string, typeof standings> = {};
  for (const s of standings) {
    if (!byTournament[s.tournament_id]) {
      byTournament[s.tournament_id] = [];
    }
    byTournament[s.tournament_id].push(s);
  }

  // Get tournament info and total player counts
  const results: TournamentStat[] = [];

  for (const [tournamentId, tournamentStandings] of Object.entries(byTournament)) {
    // Get tournament details
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name, event_date')
      .eq('rk9_id', tournamentId)
      .single();

    if (!tournament) continue;

    // Get total players in this tournament
    const { count: totalPlayers } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .not('rank', 'is', null);

    const entries = tournamentStandings.length;
    const ranks = tournamentStandings.map(s => s.rank);
    const bestRank = Math.min(...ranks);
    const top8 = ranks.filter(r => r <= 8).length;
    const top16 = ranks.filter(r => r <= 16).length;
    const top32 = ranks.filter(r => r <= 32).length;
    const metaShare = totalPlayers ? (entries / totalPlayers) * 100 : 0;

    results.push({
      tournamentName: tournament.name,
      eventDate: tournament.event_date,
      entries,
      bestRank,
      top8,
      top16,
      top32,
      metaShare: parseFloat(metaShare.toFixed(1)),
    });
  }

  // Sort by event date descending (most recent first)
  results.sort((a, b) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });

  return results;
}

export default async function TournamentBreakdown({
  supabase,
  archetypeId,
}: {
  supabase: SupabaseClient;
  archetypeId: number;
}) {
  const breakdown = await getTournamentBreakdown(supabase, archetypeId);

  if (breakdown.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6 lg:col-span-2">
        <h2 className="mb-4 text-base font-bold text-white">Tournament Breakdown</h2>
        <p className="text-sm text-gray-500">No tournament data available yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/50 p-6 lg:col-span-2">
      <h2 className="mb-4 text-base font-bold text-white">
        Tournament Breakdown
        <span className="ml-2 text-sm font-normal text-gray-500">({breakdown.length} tournaments)</span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="pb-3 font-medium text-gray-400">Tournament</th>
              <th className="pb-3 font-medium text-gray-400 text-right">Entries</th>
              <th className="pb-3 font-medium text-gray-400 text-right">Meta %</th>
              <th className="pb-3 font-medium text-gray-400 text-right">Best</th>
              <th className="pb-3 font-medium text-gray-400 text-right">T8</th>
              <th className="pb-3 font-medium text-gray-400 text-right">T16</th>
              <th className="pb-3 font-medium text-gray-400 text-right">T32</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((stat, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3">
                  <div className="font-medium">{stat.tournamentName}</div>
                  {stat.eventDate && (
                    <div className="text-xs text-gray-500">{stat.eventDate}</div>
                  )}
                </td>
                <td className="py-3 text-right">{stat.entries}</td>
                <td className="py-3 text-right text-gray-400">{stat.metaShare}%</td>
                <td className={`py-3 text-right font-bold ${
                  stat.bestRank === 1 ? 'text-yellow-400' :
                  stat.bestRank <= 8 ? 'text-orange-400' :
                  stat.bestRank <= 32 ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  #{stat.bestRank}
                </td>
                <td className="py-3 text-right text-gray-400">{stat.top8}</td>
                <td className="py-3 text-right text-gray-400">{stat.top16}</td>
                <td className="py-3 text-right text-gray-400">{stat.top32}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
