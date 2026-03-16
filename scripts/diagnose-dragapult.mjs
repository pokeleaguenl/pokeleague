import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Diagnosing Dragapult Issue ===\n');

// Check both archetypes
const archetypes = [
  { id: 23, name: 'Dragapult ex' },
  { id: 27, name: 'Dragapult ex / Dusknoir' }
];

for (const archetype of archetypes) {
  console.log(`\n${archetype.name} (id: ${archetype.id})`);
  console.log('='.repeat(50));
  
  // Get aliases
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetype.id);
  
  console.log(`\nAliases (${aliases?.length || 0}):`);
  aliases?.forEach(a => console.log(`  - "${a.alias}"`));
  
  // Get standings count
  if (aliases && aliases.length > 0) {
    const aliasStrings = aliases.map(a => a.alias);
    const { data: standings } = await supabase
      .from('rk9_standings')
      .select('tournament_id, archetype')
      .in('archetype', aliasStrings);
    
    const uniqueTournaments = new Set(standings?.map(s => s.tournament_id));
    console.log(`\nStandings: ${standings?.length || 0} entries`);
    console.log(`Tournaments: ${uniqueTournaments.size}`);
    
    // Show unique archetype strings
    const uniqueArchs = [...new Set(standings?.map(s => s.archetype))];
    console.log(`\nUnique archetype strings in standings:`);
    uniqueArchs.forEach(a => console.log(`  - "${a}"`));
  }
}

console.log('\n\n=== THE ISSUE ===');
console.log('Both archetypes might have the alias "Dragapult ex", causing the base');
console.log('archetype to show minimal data instead of all solo Dragapult entries.');

process.exit(0);
