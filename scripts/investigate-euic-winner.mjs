import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Investigating EUIC Winner ===\n');

// Get EUIC tournament
const { data: euic } = await supabase
  .from('tournaments')
  .select('*')
  .ilike('name', '%Europe%International%')
  .single();

console.log('Tournament:', euic.name);
console.log('RK9 ID:', euic.rk9_id);
console.log('');

// Check for Edwyn
const { data: edwyn } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('tournament_id', euic.rk9_id)
  .ilike('player_name', '%Edwyn%');

console.log(`Edwyn entries: ${edwyn?.length || 0}`);
edwyn?.forEach(e => {
  console.log(`  Rank ${e.rank}: ${e.player_name} - ${e.archetype}`);
});

// Check rank 1
const { data: winner } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('tournament_id', euic.rk9_id)
  .eq('rank', 1);

console.log('\nRank 1 entries:');
winner?.forEach(w => {
  console.log(`  ${w.player_name} - ${w.archetype}`);
});

// Check all Absol variants at EUIC
const { data: allAbsol } = await supabase
  .from('rk9_standings')
  .select('archetype, rank, player_name')
  .eq('tournament_id', euic.rk9_id)
  .ilike('archetype', '%Absol%')
  .order('rank', { ascending: true })
  .limit(10);

console.log('\nTop 10 Absol decks at EUIC:');
allAbsol?.forEach(a => {
  console.log(`  Rank ${a.rank}: ${a.player_name} - ${a.archetype}`);
});

process.exit(0);
