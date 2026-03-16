import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Investigating Tournament ID Mismatch ===\n');

// Get sample tournament IDs from standings
const { data: standingsSample } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .limit(10);

const uniqueStandingsIds = [...new Set(standingsSample?.map(s => s.tournament_id))];

console.log('Tournament IDs in rk9_standings:');
uniqueStandingsIds.forEach(id => console.log(`  ${id}`));

// Get tournament IDs from tournaments table
const { data: tournamentsTable } = await supabase
  .from('tournaments')
  .select('id, name')
  .limit(10);

console.log('\nTournament IDs in tournaments table:');
tournamentsTable?.forEach(t => console.log(`  ${t.id}: ${t.name}`));

console.log('\n=== THE ISSUE ===');
console.log('The tournament IDs in rk9_standings don\'t match the IDs in tournaments table!');
console.log('This happened because:');
console.log('1. Tournaments table was seeded separately');
console.log('2. RK9 standings import uses different IDs (RK9\'s internal IDs)');
console.log('');
console.log('We need to link them by matching tournament names and dates.');

// Check if we can match by name
const standingsTournamentId = uniqueStandingsIds[0];

const { data: standingsWithName } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .eq('tournament_id', standingsTournamentId)
  .limit(1);

console.log('\nStandings uses RK9 tournament IDs (alphanumeric hashes)');
console.log('Tournaments table uses sequential integer IDs');
console.log('\nSolution: Need to match them or update tournament_id references');

process.exit(0);
