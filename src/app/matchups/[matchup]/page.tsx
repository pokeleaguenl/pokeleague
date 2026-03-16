import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface MatchupStats {
  deckName: string;
  totalEntries: number;
  avgPlacement: number;
  bestPlacement: number;
  top8Count: number;
  top16Count: number;
  top32Count: number;
  top8Rate: number;
  top16Rate: number;
  top32Rate: number;
}

export default async function MatchupPage({ params }: { params: Promise<{ matchup: string }> }) {
  const { matchup } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Parse matchup string (e.g., "charizard-ex-vs-gardevoir-ex")
  const parts = matchup.split('-vs-');
  if (parts.length !== 2) notFound();

  const [slugA, slugB] = parts;

  // Get both archetypes
  const { data: archetypeA } = await supabase
    .from('fantasy_archetypes')
    .select('id, name')
    .eq('slug', slugA)
    .single();

  const { data: archetypeB } = await supabase
    .from('fantasy_archetypes')
    .select('id, name')
    .eq('slug', slugB)
    .single();

  if (!archetypeA || !archetypeB) notFound();

  // Function to calculate stats for a deck
  async function calculateStats(archetypeId: number, archetypeName: string): Promise<MatchupStats> {
    // Get aliases
    const { data: aliases } = await supabase
      .from('fantasy_archetype_aliases')
      .select('alias')
      .eq('archetype_id', archetypeId);

    if (!aliases || aliases.length === 0) {
      return {
        deckName: archetypeName,
        totalEntries: 0,
        avgPlacement: 0,
        bestPlacement: 0,
        top8Count: 0,
        top16Count: 0,
        top32Count: 0,
        top8Rate: 0,
        top16Rate: 0,
        top32Rate: 0,
      };
    }

    // Get standings
    const aliasStrings = aliases.map(a => a.alias);
    const { data: standings } = await supabase
      .from('rk9_standings')
      .select('rank, tournament_id')
      .in('archetype', aliasStrings)
      .not('rank', 'is', null);

    if (!standings || standings.length === 0) {
      return {
        deckName: archetypeName,
        totalEntries: 0,
        avgPlacement: 0,
        bestPlacement: 0,
        top8Count: 0,
        top16Count: 0,
        top32Count: 0,
        top8Rate: 0,
        top16Rate: 0,
        top32Rate: 0,
      };
    }

    const ranks = standings.map(s => s.rank);
    const avgPlacement = Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);
    const bestPlacement = Math.min(...ranks);

    const top8Count = standings.filter(s => s.rank <= 8).length;
    const top16Count = standings.filter(s => s.rank <= 16).length;
    const top32Count = standings.filter(s => s.rank <= 32).length;

    return {
      deckName: archetypeName,
      totalEntries: standings.length,
      avgPlacement,
      bestPlacement,
      top8Count,
      top16Count,
      top32Count,
      top8Rate: parseFloat(((top8Count / standings.length) * 100).toFixed(1)),
      top16Rate: parseFloat(((top16Count / standings.length) * 100).toFixed(1)),
      top32Rate: parseFloat(((top32Count / standings.length) * 100).toFixed(1)),
    };
  }

  const [statsA, statsB] = await Promise.all([
    calculateStats(archetypeA.id, archetypeA.name),
    calculateStats(archetypeB.id, archetypeB.name),
  ]);

  // Find tournaments where both appeared
  const { data: aliasesA } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetypeA.id);

  const { data: aliasesB } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetypeB.id);

  const aliasStringsA = aliasesA?.map(a => a.alias) || [];
  const aliasStringsB = aliasesB?.map(a => a.alias) || [];

  const { data: standingsA } = await supabase
    .from('rk9_standings')
    .select('tournament_id, rank')
    .in('archetype', aliasStringsA)
    .not('rank', 'is', null);

  const { data: standingsB } = await supabase
    .from('rk9_standings')
    .select('tournament_id, rank')
    .in('archetype', aliasStringsB)
    .not('rank', 'is', null);

  // Find common tournaments
  const tournamentsA = new Set(standingsA?.map(s => s.tournament_id));
  const tournamentsB = new Set(standingsB?.map(s => s.tournament_id));
  const commonTournaments = [...tournamentsA].filter(t => tournamentsB.has(t));

  // Calculate head-to-head performance
  let deckAWins = 0;
  let deckBWins = 0;

  for (const tournamentId of commonTournaments) {
    const aRanks = standingsA?.filter(s => s.tournament_id === tournamentId).map(s => s.rank) || [];
    const bRanks = standingsB?.filter(s => s.tournament_id === tournamentId).map(s => s.rank) || [];

    const avgA = aRanks.reduce((sum, r) => sum + r, 0) / aRanks.length;
    const avgB = bRanks.reduce((sum, r) => sum + r, 0) / bRanks.length;

    if (avgA < avgB) deckAWins++;
    else if (avgB < avgA) deckBWins++;
  }

  const winRate = commonTournaments.length > 0
    ? parseFloat(((deckAWins / commonTournaments.length) * 100).toFixed(1))
    : 50;

  const confidence = commonTournaments.length >= 5 ? 'High' 
    : commonTournaments.length >= 3 ? 'Medium' 
    : 'Low';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/matchups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to Matchups
        </Link>
        <h1 className="text-3xl font-black mb-2">
          {archetypeA.name} <span className="text-yellow-400">vs</span> {archetypeB.name}
        </h1>
        <p className="text-gray-400">
          Head-to-head analysis across {commonTournaments.length} tournaments
        </p>
      </div>

      {/* Head-to-Head Summary */}
      <div className="mb-8 rounded-xl border border-white/10 bg-gray-900/50 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-black/20 px-6 py-3">
            <span className="text-sm text-gray-400">Confidence:</span>
            <span className={`text-sm font-bold ${
              confidence === 'High' ? 'text-green-400' :
              confidence === 'Medium' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {confidence}
            </span>
            <span className="text-sm text-gray-500">({commonTournaments.length} shared tournaments)</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Deck A */}
          <div className="text-center">
            <Link href={`/decks/${slugA}`} className="text-2xl font-black hover:text-yellow-400 transition-colors">
              {archetypeA.name}
            </Link>
            <p className="text-4xl font-black text-yellow-400 mt-2">{deckAWins}</p>
            <p className="text-sm text-gray-500">Tournaments Won</p>
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-6xl font-black text-gray-700">VS</div>
            <p className="text-sm text-gray-500 mt-2">{winRate}% win rate</p>
          </div>

          {/* Deck B */}
          <div className="text-center">
            <Link href={`/decks/${slugB}`} className="text-2xl font-black hover:text-yellow-400 transition-colors">
              {archetypeB.name}
            </Link>
            <p className="text-4xl font-black text-blue-400 mt-2">{deckBWins}</p>
            <p className="text-sm text-gray-500">Tournaments Won</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deck A Stats */}
        <StatsCard stats={statsA} slug={slugA} isWinner={deckAWins > deckBWins} />
        
        {/* Deck B Stats */}
        <StatsCard stats={statsB} slug={slugB} isWinner={deckBWins > deckAWins} />
      </div>

      {/* Explanation */}
      {commonTournaments.length < 3 && (
        <div className="mt-8 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-6">
          <p className="text-sm text-yellow-400">
            ⚠️ Limited data available. More reliable results require at least 3 tournaments where both decks appeared.
          </p>
        </div>
      )}
    </div>
  );
}

interface StatsCardProps {
  stats: MatchupStats;
  slug: string;
  isWinner: boolean;
}

function StatsCard({ stats, slug, isWinner }: StatsCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${
      isWinner 
        ? 'border-yellow-400/30 bg-yellow-400/5' 
        : 'border-white/10 bg-gray-900/50'
    }`}>
      <div className="mb-6">
        <Link href={`/decks/${slug}`} className="text-xl font-bold hover:text-yellow-400 transition-colors">
          {stats.deckName}
        </Link>
        {isWinner && <span className="ml-2 text-yellow-400">👑</span>}
      </div>

      <div className="space-y-4">
        <StatRow label="Total Entries" value={stats.totalEntries.toString()} />
        <StatRow label="Best Finish" value={`#${stats.bestPlacement}`} highlight />
        <StatRow label="Avg Finish" value={`#${stats.avgPlacement}`} />
        
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Top Cut Performance</p>
          <StatRow label="Top 8 Rate" value={`${stats.top8Rate}%`} subtext={`${stats.top8Count} times`} />
          <StatRow label="Top 16 Rate" value={`${stats.top16Rate}%`} subtext={`${stats.top16Count} times`} />
          <StatRow label="Top 32 Rate" value={`${stats.top32Rate}%`} subtext={`${stats.top32Count} times`} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, subtext, highlight }: { label: string; value: string; subtext?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className={`font-bold ${highlight ? 'text-yellow-400 text-lg' : 'text-white'}`}>
          {value}
        </span>
        {subtext && <p className="text-xs text-gray-600">{subtext}</p>}
      </div>
    </div>
  );
}
