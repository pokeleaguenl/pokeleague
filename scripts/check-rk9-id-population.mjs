import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking RK9 ID Population ===\n');

// Check which tournaments have rk9_id populated
const { data: tournamentsWithRk9 } = await supabase
  .from('tournaments')
  .select('id, name, rk9_id')
  .not('rk9_id', 'is', null);

console.log(`Tournaments with rk9_id: ${tournamentsWithRk9?.length || 0}`);
tournamentsWithRk9?.forEach(t => {
  console.log(`  ${t.name}: ${t.rk9_id}`);
});

// Check which tournaments DON'T have rk9_id
const { data: tournamentsWithoutRk9 } = await supabase
  .from('tournaments')
  .select('id, name, rk9_id')
  .is('rk9_id', null);

console.log(`\nTournaments WITHOUT rk9_id: ${tournamentsWithoutRk9?.length || 0}`);

// Get the single RK9 tournament we have data for
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .limit(1);

const rk9Id = standings?.[0]?.tournament_id;

console.log(`\n=== The Mystery Tournament ===`);
console.log(`RK9 ID in standings: ${rk9Id}`);

// Try to figure out which tournament this is by checking entry counts and deck distribution
const { count: totalEntries } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true })
  .eq('tournament_id', rk9Id);

console.log(`Total entries: ${totalEntries}`);

// Get top ranked players
const { data: topPlayers } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank')
  .eq('tournament_id', rk9Id)
  .order('rank', { ascending: true })
  .limit(5);

console.log('\nTop 5 finishers:');
topPlayers?.forEach(p => {
  console.log(`  #${p.rank}: ${p.player_name} - ${p.archetype}`);
});

console.log('\n=== ACTION NEEDED ===');
console.log('We need to identify which tournament this RK9 ID belongs to');
console.log('Then update: UPDATE tournaments SET rk9_id = ? WHERE id = ?');

process.exit(0);
