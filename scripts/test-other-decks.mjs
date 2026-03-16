import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing other archetypes to verify no regressions ===\n');

// Test a few popular archetypes
const testArchetypes = [
  { id: 1, name: 'Charizard ex', expectedAliases: true },
  { id: 2, name: 'Mega Absol Box', expectedAliases: true },
  { id: 3, name: 'Dragapult ex', expectedAliases: true },
];

for (const archetype of testArchetypes) {
  console.log(`Testing: ${archetype.name} (id: ${archetype.id})`);
  
  // Check aliases exist
  const { count: aliasCount } = await supabase
    .from('fantasy_archetype_aliases')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  // Check scores exist
  const { count: scoreCount } = await supabase
    .from('fantasy_archetype_scores_live')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  const aliasStatus = aliasCount > 0 ? '✅' : '❌';
  const scoreStatus = scoreCount > 0 ? '✅' : '⚠️';
  
  console.log(`  ${aliasStatus} Aliases: ${aliasCount}`);
  console.log(`  ${scoreStatus} Scores: ${scoreCount}`);
  
  if (aliasCount === 0 && archetype.expectedAliases) {
    console.log(`  ⚠️  WARNING: Expected aliases but found none!`);
  }
  console.log('');
}

console.log('=== Test complete ===\n');
process.exit(0);
