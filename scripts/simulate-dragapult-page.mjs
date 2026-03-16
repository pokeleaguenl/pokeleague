import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Simulating Dragapult ex Deck Page ===\n');

// Get the archetype
const { data: archetype } = await supabase
  .from('fantasy_archetypes')
  .select('*')
  .eq('slug', 'dragapult-ex')
  .single();

console.log(`Archetype: ${archetype?.name} (id: ${archetype?.id})`);
console.log(`Canonical ID: ${archetype?.canonical_id || 'none'}`);

// Get aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', archetype.id);

console.log(`\nAliases (${aliases?.length || 0}):`);
aliases?.forEach(a => console.log(`  - "${a.alias}"`));

// Simulate what rk9Analytics does
if (aliases && aliases.length > 0) {
  const aliasStrings = aliases.map(a => a.alias);
  
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype, rank, player_name')
    .in('archetype', aliasStrings)
    .not('rank', 'is', null)
    .limit(20);
  
  console.log(`\nStandings found: ${standings?.length || 0}`);
  
  if (standings && standings.length > 0) {
    console.log('\nSample entries:');
    standings.slice(0, 5).forEach(s => {
      console.log(`  ${s.archetype} - #${s.rank} - ${s.player_name}`);
    });
    
    const uniqueArchs = [...new Set(standings.map(s => s.archetype))];
    console.log(`\nMatching archetype strings (${uniqueArchs.length}):`);
    uniqueArchs.forEach(a => console.log(`  - "${a}"`));
  }
}

console.log('\n=== DIAGNOSIS ===');
console.log('If only showing 12 entries on the page, the issue is likely:');
console.log('1. The alias "Dragapult ex" only has 12 actual standings entries');
console.log('2. Other Dragapult variants are NOT aliased to this archetype');
console.log('3. Each variant (Dragapult/Dusknoir, etc) is its own archetype');

process.exit(0);
