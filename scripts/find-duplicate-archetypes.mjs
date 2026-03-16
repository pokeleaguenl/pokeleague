import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding duplicate archetype mappings ===\n');

// Check one example: "Mega Kangaskhan ex"
const testAlias = 'Mega Kangaskhan ex / Mega Absol ex';

const { data: existing } = await supabase
  .from('fantasy_archetype_aliases')
  .select('archetype_id, alias, fantasy_archetypes!inner(id, name)')
  .eq('alias', testAlias);

console.log(`Alias: "${testAlias}"`);
console.log('Already mapped to:');
existing?.forEach(e => {
  console.log(`  Archetype ${e.archetype_id}: ${e.fantasy_archetypes.name}`);
});

// Check how many aliases are mapped to multiple archetypes
const { data: allAliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias, archetype_id');

const aliasCounts = {};
for (const a of allAliases || []) {
  if (!aliasCounts[a.alias]) {
    aliasCounts[a.alias] = new Set();
  }
  aliasCounts[a.alias].add(a.archetype_id);
}

const duplicates = Object.entries(aliasCounts)
  .filter(([_, ids]) => ids.size > 1);

console.log(`\n${duplicates.length} aliases mapped to multiple archetypes:`);
duplicates.slice(0, 10).forEach(([alias, ids]) => {
  console.log(`  "${alias}" → ${Array.from(ids).join(', ')}`);
});

console.log('\n=== The Problem ===');
console.log('Some archetype strings (like "Mega Kangaskhan ex / Mega Absol ex")');
console.log('exist in standings and could map to EITHER:');
console.log('  - Mega Kangaskhan ex (id: 6)');
console.log('  - Mega Kangaskhan ex / Mega Absol ex (id: 240)');
console.log('  - Mega Absol ex / Mega Kangaskhan ex (id: 57)');
console.log('');
console.log('The alias table has a unique constraint, so each alias string');
console.log('can only map to ONE archetype_id.');

process.exit(0);
