import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking the Single Tournament with Data ===\n');

// Get all unique tournament IDs
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .limit(1);

const tournamentId = standings?.[0]?.tournament_id;

console.log(`Tournament ID: ${tournamentId}\n`);

// Get tournament details
const { data: tournament } = await supabase
  .from('tournaments')
  .select('*')
  .eq('id', tournamentId)
  .single();

console.log('Tournament:', tournament?.name || 'Not found in tournaments table');
console.log('Date:', tournament?.event_date || 'Unknown');
console.log('Status:', tournament?.status || 'Unknown');

// Count total entries
const { count: totalCount } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true })
  .eq('tournament_id', tournamentId);

console.log(`Total entries: ${totalCount}\n`);

// Get unique decks
const { data: allStandings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .eq('tournament_id', tournamentId);

const uniqueDecks = [...new Set(allStandings?.map(s => s.archetype))];
console.log(`Unique decks: ${uniqueDecks.length}\n`);

console.log('Sample decks:');
uniqueDecks.slice(0, 10).forEach(d => console.log(`  - ${d}`));

console.log('\n=== ISSUE IDENTIFIED ===');
console.log('We only have 1 tournament with standings data!');
console.log('This means:');
console.log('1. Most tournaments have not had standings ingested yet');
console.log('2. Head-to-head analysis needs multiple tournaments');
console.log('3. We should build the feature but it will show limited data');
console.log('');
console.log('Alternative approach:');
console.log('Build matchup page that works with current data AND');
console.log('will automatically improve as more tournaments are added');

process.exit(0);
