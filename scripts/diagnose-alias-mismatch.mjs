import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Diagnosing Alias Mismatch Issue ===\n');

// Take a sample archetype that has aliases but no data
const testArchetype = { id: 1, name: 'Charizard ex' };

console.log(`Testing: ${testArchetype.name}\n`);

// Get its aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', testArchetype.id);

console.log(`Aliases in database (${aliases?.length}):`);
aliases?.forEach(a => console.log(`  - "${a.alias}"`));

// Check if these exact strings exist in standings
console.log('\nChecking standings for exact matches:');
for (const alias of aliases || []) {
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('archetype', alias.alias);
  
  console.log(`  "${alias.alias}": ${count} entries`);
}

// Let's see what Charizard-related entries actually exist
console.log('\n\nWhat Charizard entries ACTUALLY exist in rk9_standings:');
const { data: charizardStandings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', '%Charizard ex%')
  .limit(50);

const uniqueCharizard = [...new Set(charizardStandings?.map(s => s.archetype))];
console.log(`Found ${uniqueCharizard.length} unique Charizard archetype strings:\n`);
uniqueCharizard.forEach(arch => console.log(`  - "${arch}"`));

console.log('\n=== THE PROBLEM ===');
console.log('The aliases were created by searching with ilike (case-insensitive partial match)');
console.log('but then stored as exact match strings. However, when querying standings,');
console.log('we need EXACT matches. So if the alias is "Charizard ex" but standings have');
console.log('"Charizard ex / Pidgeot ex", there\'s no match!');

process.exit(0);
