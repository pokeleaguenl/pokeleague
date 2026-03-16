import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding Tournaments with Actual Data ===\n');

// Get all unique tournament IDs from standings
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id');

const uniqueTournamentIds = [...new Set(standings?.map(s => s.tournament_id))];

console.log(`Tournaments with standings data: ${uniqueTournamentIds.length}\n`);

// Get tournament details for each
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date')
  .in('id', uniqueTournamentIds)
  .order('event_date', { ascending: false });

console.log('Tournaments with data:');
for (const t of tournaments?.slice(0, 5) || []) {
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', t.id);
  
  console.log(`  ${t.name} (${t.event_date}): ${count} entries`);
}

// Pick one tournament for detailed analysis
const testTournament = tournaments?.[0];

if (testTournament) {
  console.log(`\n=== Detailed Analysis: ${testTournament.name} ===\n`);
  
  // Get top decks
  const { data: topDecks } = await supabase
    .from('rk9_standings')
    .select('archetype, rank')
    .eq('tournament_id', testTournament.id)
    .not('archetype', 'eq', 'Unknown')
    .lte('rank', 32);
  
  const deckCounts = {};
  for (const s of topDecks || []) {
    if (!deckCounts[s.archetype]) deckCounts[s.archetype] = [];
    deckCounts[s.archetype].push(s.rank);
  }
  
  console.log('Top 32 deck performance:');
  Object.entries(deckCounts)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .forEach(([deck, ranks]) => {
      const avg = Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length);
      const best = Math.min(...ranks);
      console.log(`  ${deck}:`);
      console.log(`    Count: ${ranks.length}, Best: #${best}, Avg: #${avg}`);
    });
}

console.log('\n=== Matchup Calculation Example ===');
console.log('For Deck A vs Deck B across all tournaments:');
console.log('1. Find tournaments where BOTH appeared');
console.log('2. Compare avg placement in each tournament');
console.log('3. Calculate win rate (% of tournaments where A placed better)');
console.log('4. Show confidence based on sample size');

process.exit(0);
