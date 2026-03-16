import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Tournament Linkage Options ===\n');

// Check what we have in tournaments table
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date, rk9_id')
  .order('event_date', { ascending: false })
  .limit(10);

console.log('Tournaments table schema:');
console.log('Columns:', tournaments?.[0] ? Object.keys(tournaments[0]) : 'No data');
console.log('Has rk9_id field?', tournaments?.[0]?.hasOwnProperty('rk9_id'));

// Get unique RK9 tournament IDs from standings
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id');

const uniqueRk9Ids = [...new Set(standings?.map(s => s.tournament_id))];

console.log(`\nUnique RK9 tournament IDs in standings: ${uniqueRk9Ids.length}`);
console.log('Sample RK9 IDs:');
uniqueRk9Ids.slice(0, 5).forEach(id => console.log(`  ${id}`));

console.log(`\nTournaments in table: ${tournaments?.length || 0}`);
console.log('Sample tournament table entries:');
tournaments?.slice(0, 3).forEach(t => {
  console.log(`  ID: ${t.id}, Name: ${t.name}`);
});

console.log('\n=== SOLUTION OPTIONS ===\n');
console.log('Option 1: Add rk9_id column to tournaments table');
console.log('  - ALTER TABLE tournaments ADD COLUMN rk9_id TEXT');
console.log('  - Manually map known tournaments to RK9 IDs');
console.log('  - Future imports store both IDs');
console.log('');
console.log('Option 2: Use tournament_id as primary join');
console.log('  - Keep RK9 IDs in standings');
console.log('  - Update tournaments.id to use RK9 format');
console.log('  - Simpler but breaks existing fantasy_events references');
console.log('');
console.log('Recommendation: Option 1 (add rk9_id column)');

process.exit(0);
