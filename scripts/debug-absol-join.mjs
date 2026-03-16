import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== CRITICAL CHECK: Do aliases join to standings? ===');

// Get all Absol aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 2);

console.log(`Found ${aliases?.length} aliases for archetype_id 2`);

// Check if any of these aliases exist in rk9_standings
for (const { alias } of aliases.slice(0, 5)) {
  const { data: match, count } = await supabase
    .from('rk9_standings')
    .select('archetype', { count: 'exact', head: true })
    .eq('archetype', alias);
  
  console.log(`  "${alias}" → ${count || 0} matches`);
}

console.log('\n=== CHECK: Does scoring query work manually? ===');

// Manually calculate what Stuttgart (tournament 8) should score
const stuttgartTournament = await supabase
  .from('tournaments')
  .select('rk9_id')
  .eq('id', 8)
  .single();

console.log(`Stuttgart rk9_id: ${stuttgartTournament.data?.rk9_id}`);

// Get Absol standings from Stuttgart
const { data: stuttgartAbsol } = await supabase
  .from('rk9_standings')
  .select('archetype, rank')
  .eq('tournament_id', stuttgartTournament.data?.rk9_id)
  .in('archetype', aliases.map(a => a.alias));

console.log(`\nAbsol decks in Stuttgart: ${stuttgartAbsol?.length || 0}`);
if (stuttgartAbsol?.length) {
  console.log('Top 5 results:');
  stuttgartAbsol.slice(0, 5).forEach(s => {
    console.log(`  Rank ${s.rank}: ${s.archetype}`);
  });
}

process.exit(0);
