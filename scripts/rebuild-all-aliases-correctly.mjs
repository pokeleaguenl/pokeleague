import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== REBUILDING ALL ALIASES CORRECTLY ===\n');

// Get all archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, canonical_id')
  .order('id');

console.log(`Processing ${archetypes?.length} archetypes...\n`);

let fixed = 0;
let skipped = 0;
let noMatches = 0;

for (const archetype of archetypes || []) {
  // Skip canonical references
  if (archetype.canonical_id) {
    skipped++;
    continue;
  }

  // Search for this archetype in rk9_standings using the archetype name
  // Use ilike to find all variants
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .ilike('archetype', `%${archetype.name}%`);

  if (!standings || standings.length === 0) {
    console.log(`⚪ ${archetype.name} - no standings found`);
    noMatches++;
    continue;
  }

  // Get unique ACTUAL archetype strings from standings
  const uniqueArchetypes = [...new Set(standings.map(s => s.archetype))];

  // Filter to only those that are actually relevant
  // (e.g., searching "Charizard ex" should match "Charizard ex" and "Charizard ex / Pidgeot ex"
  // but not "Pidgeot ex / Charizard ex" as a primary deck)
  const relevantArchetypes = uniqueArchetypes.filter(arch => {
    const lowerArch = arch.toLowerCase();
    const lowerName = archetype.name.toLowerCase();
    // Must start with the archetype name or be an exact match
    return lowerArch === lowerName || lowerArch.startsWith(lowerName + ' /');
  });

  if (relevantArchetypes.length === 0) {
    console.log(`⚠️  ${archetype.name} - found ${uniqueArchetypes.length} matches but none relevant`);
    noMatches++;
    continue;
  }

  // Delete existing aliases
  await supabase
    .from('fantasy_archetype_aliases')
    .delete()
    .eq('archetype_id', archetype.id);

  // Insert correct aliases
  const inserts = relevantArchetypes.map(arch => ({
    archetype_id: archetype.id,
    alias: arch
  }));

  const { error } = await supabase
    .from('fantasy_archetype_aliases')
    .insert(inserts);

  if (error) {
    console.log(`❌ ${archetype.name} - Error: ${error.message}`);
  } else {
    console.log(`✅ ${archetype.name} - ${relevantArchetypes.length} aliases`);
    fixed++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total archetypes: ${archetypes?.length}`);
console.log(`Fixed with new aliases: ${fixed}`);
console.log(`Skipped (canonical): ${skipped}`);
console.log(`No matches found: ${noMatches}`);

process.exit(0);
