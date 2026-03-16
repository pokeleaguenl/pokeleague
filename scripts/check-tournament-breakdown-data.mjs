import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking data for tournament breakdown ===\n');

// Test with Mega Absol Box (archetype_id 2)
const archetypeId = 2;
const archetypeName = 'Mega Absol Box';

console.log(`Testing with: ${archetypeName} (id: ${archetypeId})\n`);

// Get aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', archetypeId);

console.log(`Aliases: ${aliases?.length || 0}`);

// Get per-tournament stats
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id, archetype, rank, player_name')
  .in('archetype', aliases?.map(a => a.alias) || [])
  .order('rank', { ascending: true });

console.log(`Total standings: ${standings?.length || 0}\n`);

// Group by tournament
const byTournament = {};
for (const s of standings || []) {
  if (!byTournament[s.tournament_id]) {
    byTournament[s.tournament_id] = [];
  }
  byTournament[s.tournament_id].push(s);
}

// Get tournament names
console.log('Per-tournament breakdown:\n');

for (const [tournamentId, tournamentStandings] of Object.entries(byTournament)) {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, rk9_id')
    .eq('rk9_id', tournamentId)
    .single();
  
  const entries = tournamentStandings.length;
  const bestRank = Math.min(...tournamentStandings.map(s => s.rank));
  const top8 = tournamentStandings.filter(s => s.rank <= 8).length;
  const top32 = tournamentStandings.filter(s => s.rank <= 32).length;
  
  console.log(`${tournament?.name || tournamentId}:`);
  console.log(`  Entries: ${entries}`);
  console.log(`  Best finish: #${bestRank}`);
  console.log(`  Top 8: ${top8}, Top 32: ${top32}`);
  console.log('');
}

console.log('=== Proposed breakdown structure ===\n');
console.log('For each tournament, show:');
console.log('  • Tournament name & date');
console.log('  • Number of entries');
console.log('  • Best finish (rank)');
console.log('  • Top placements (Top 8, Top 16, Top 32)');
console.log('  • Meta share (entries / total players in tournament)');
console.log('');

process.exit(0);
