import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Database Schema ===\n');

// Check what tables exist
const tables = [
  'tournaments',
  'rk9_standings',
  'fantasy_archetypes',
  'fantasy_archetype_aliases',
  'users',
  'squads',
  'squad_decks',
  'leagues',
  'league_members',
  'league_scores'
];

for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log(`❌ ${table}: Does not exist`);
  } else {
    console.log(`✅ ${table}: Exists (${data?.length || 0} rows)`);
  }
}

console.log('\n=== Curitiba Tournament Data ===');

// Check Curitiba specifically
const { data: tournament } = await supabase
  .from('tournaments')
  .select('*')
  .eq('id', 264)
  .single();

if (tournament) {
  console.log(`\nTournament: ${tournament.name}`);
  console.log(`RK9 ID: ${tournament.rk9_id}`);
  console.log(`Status: ${tournament.status}`);
  
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.rk9_id);
  
  console.log(`Standings: ${count} entries`);
}

console.log('\n=== Next Steps ===');
console.log('1. Verify table names (might be different)');
console.log('2. Check if fantasy system exists');
console.log('3. Build scoring based on actual schema');

process.exit(0);
