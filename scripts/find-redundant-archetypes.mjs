import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding potentially redundant archetypes ===\n');

// Get archetypes with no aliases
const { data: noAliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('archetype_id');

const archetypesWithAliases = new Set(noAliases?.map(a => a.archetype_id));

const { data: allArchetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .order('id');

const withoutAliases = allArchetypes?.filter(a => !archetypesWithAliases.has(a.id));

console.log('Archetypes without aliases that might be duplicates:\n');

// Group by similar names
const absol = withoutAliases?.filter(a => a.name.toLowerCase().includes('absol') && a.name.toLowerCase().includes('kangaskhan'));
const charizard = withoutAliases?.filter(a => a.name.toLowerCase().includes('charizard') && a.name.toLowerCase().includes('pidgeot'));

console.log('Absol + Kangaskhan variants:');
absol?.forEach(a => console.log(`  ${a.id}: ${a.name}`));

console.log('\nCharizard + Pidgeot variants:');
charizard?.forEach(a => console.log(`  ${a.id}: ${a.name}`));

console.log('\n=== Recommendation ===');
console.log('These archetypes appear to be duplicates/variants of existing ones.');
console.log('Options:');
console.log('1. Delete redundant archetypes (consolidate)');
console.log('2. Mark them as canonical_id pointing to main archetype');
console.log('3. Leave as-is but they will show "No tournament data"');

process.exit(0);
