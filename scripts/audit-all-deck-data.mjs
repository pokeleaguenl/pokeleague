import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== COMPREHENSIVE DECK DATA AUDIT ===\n');

// Get all archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug, canonical_id')
  .order('id');

console.log(`Total archetypes: ${archetypes?.length || 0}\n`);

const results = {
  withData: [],
  withAliasesButNoData: [],
  noAliases: [],
  canonical: []
};

for (const archetype of archetypes || []) {
  // Skip canonical references
  if (archetype.canonical_id) {
    results.canonical.push(archetype);
    continue;
  }

  // Check aliases
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetype.id);

  if (!aliases || aliases.length === 0) {
    results.noAliases.push(archetype);
    continue;
  }

  // Check standings
  const aliasStrings = aliases.map(a => a.alias);
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('tournament_id')
    .in('archetype', aliasStrings)
    .limit(1);

  if (!standings || standings.length === 0) {
    results.withAliasesButNoData.push({ ...archetype, aliasCount: aliases.length });
  } else {
    results.withData.push({ ...archetype, aliasCount: aliases.length });
  }
}

console.log('=== RESULTS ===\n');

console.log(`✅ ${results.withData.length} archetypes WITH tournament data`);
console.log(`⚠️  ${results.withAliasesButNoData.length} archetypes WITH aliases but NO tournament data`);
console.log(`❌ ${results.noAliases.length} archetypes with NO aliases at all`);
console.log(`🔗 ${results.canonical.length} canonical references (duplicates)\n`);

if (results.noAliases.length > 0) {
  console.log('\n=== Archetypes with NO aliases ===');
  results.noAliases.slice(0, 10).forEach(a => {
    console.log(`  ${a.id}: ${a.name}`);
  });
  if (results.noAliases.length > 10) {
    console.log(`  ... and ${results.noAliases.length - 10} more`);
  }
}

if (results.withAliasesButNoData.length > 0) {
  console.log('\n=== Archetypes with aliases but NO data ===');
  console.log('(These aliases might be wrong or the deck never appeared in tournaments)\n');
  results.withAliasesButNoData.slice(0, 20).forEach(a => {
    console.log(`  ${a.id}: ${a.name} (${a.aliasCount} aliases)`);
  });
  if (results.withAliasesButNoData.length > 20) {
    console.log(`  ... and ${results.withAliasesButNoData.length - 20} more`);
  }
}

console.log('\n=== COVERAGE SUMMARY ===');
const total = archetypes?.length || 0;
const withDataPct = Math.round((results.withData.length / total) * 100);
console.log(`${results.withData.length}/${total} archetypes have tournament data (${withDataPct}%)`);

console.log('\n=== NEXT STEPS ===');
console.log('1. Run the alias creation script again for remaining archetypes');
console.log('2. Check if aliases are correct (maybe archetype names don\'t match standings)');
console.log('3. Some archetypes may genuinely have no tournament data (unused decks)');

process.exit(0);
