import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Dragapult ex (id: 23) ===\n');

const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 23);

console.log(`Aliases for archetype 23 (${aliases?.length || 0}):`);
aliases?.forEach(a => console.log(`  - "${a.alias}"`));

if (aliases && aliases.length > 0) {
  const aliasStrings = aliases.map(a => a.alias);
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .in('archetype', aliasStrings);
  
  console.log(`\nStandings matching these aliases: ${standings?.length || 0}`);
  
  if (standings && standings.length > 0) {
    const unique = [...new Set(standings.map(s => s.archetype))];
    console.log(`Unique archetype strings matched:`);
    unique.forEach(a => console.log(`  - "${a}"`));
  }
}

console.log('\n\n=== THE FIX ===');
console.log('Since "Dragapult ex" never appears solo in tournaments,');
console.log('archetype 23 should either:');
console.log('1. Be marked as canonical -> 27 (redirect to Dragapult ex / Dusknoir)');
console.log('2. Have all Dragapult variant aliases assigned to show combined stats');
console.log('3. Be deleted/hidden as an unused archetype');

process.exit(0);
