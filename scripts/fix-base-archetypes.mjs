import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding Base Archetypes with No Solo Tournament Data ===\n');

// List of base archetypes that likely only appear as combos
const baseArchetypes = [
  { id: 23, name: 'Dragapult ex' },
  { id: 1, name: 'Charizard ex' },
  { id: 24, name: 'Gardevoir ex' },
  { id: 25, name: 'Gholdengo ex' },
  { id: 17, name: 'Miraidon ex' },
  { id: 4, name: 'Raging Bolt ex' },
  // Add more as needed
];

const needsFix = [];

for (const archetype of baseArchetypes) {
  // Check if the EXACT archetype string exists in standings
  const { data: exactMatch } = await supabase
    .from('rk9_standings')
    .select('id')
    .eq('archetype', archetype.name)
    .limit(1);
  
  // Check aliases
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetype.id);
  
  // Count total data
  let totalEntries = 0;
  if (aliases && aliases.length > 0) {
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .in('archetype', aliases.map(a => a.alias));
    totalEntries = count || 0;
  }
  
  const hasExact = exactMatch && exactMatch.length > 0;
  const status = hasExact ? '✅' : '⚠️';
  
  console.log(`${status} ${archetype.name} (id: ${archetype.id})`);
  console.log(`   Exact solo matches: ${hasExact ? 'Yes' : 'No'}`);
  console.log(`   Aliases: ${aliases?.length || 0}`);
  console.log(`   Total entries: ${totalEntries}`);
  
  if (!hasExact && totalEntries < 50) {
    needsFix.push(archetype);
  }
  console.log('');
}

console.log(`\n=== ${needsFix.length} archetypes need fixing ===\n`);

if (needsFix.length > 0) {
  console.log('These base archetypes have no solo tournament appearances');
  console.log('and minimal data. Options:');
  console.log('1. Add ALL variant aliases to show combined stats');
  console.log('2. Mark as canonical_id pointing to most popular variant');
  console.log('3. Hide from deck list (add is_hidden flag)');
}

process.exit(0);
