/**
 * Add High-Priority Aliases
 * 
 * Adds aliases for decks with 10+ entries that don't have coverage yet.
 * This improves overall data quality and meta accuracy.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding High-Priority Aliases ===\n');

// Map deck names to appropriate archetype IDs or create new ones
async function addHighPriorityAliases() {
  const aliasesToAdd = [
    // These need new archetypes created first
    { deckName: 'Katapuldra ex', entries: 50, createNew: true },
    { deckName: 'Garchomp ex', entries: 50, createNew: true },
    { deckName: 'Gholdengo ex / Miraidon ex', entries: 33, createNew: true },
    { deckName: 'Zoroark ex / N\'s', entries: 33, createNew: true },
    { deckName: 'Monetigo-ex / Genesect-ex', entries: 33, createNew: true },
    { deckName: 'Lanssorien-ex / Noctunoir', entries: 32, createNew: true },
    { deckName: 'Grimmsnarl ex / Bloodmoon Ursaluna ex', entries: 30, createNew: true },
    { deckName: 'Crustle', entries: 28, createNew: true },
    { deckName: 'Armarouge / Ho-Oh ex', entries: 25, createNew: true },
    { deckName: 'Noctowl / Raging Bolt ex', entries: 22, createNew: true },
    { deckName: 'Froslass / Munkidori', entries: 21, createNew: true },
    { deckName: 'Noctowl / Fezandipiti ex', entries: 21, createNew: true },
    { deckName: 'Genesect ex / Monetigo ex', entries: 20, createNew: true },
    { deckName: 'Monetigo-ex / Gierspenst', entries: 18, createNew: true },
    { deckName: 'Noctowl / Eeveelution', entries: 18, createNew: true },
    { deckName: 'Ogerpon ex / Crustle', entries: 18, createNew: true },
    { deckName: 'Katapuldra-ex', entries: 17, mapTo: 'Katapuldra ex' },
    { deckName: 'Katapuldra ex / Grolldra', entries: 17, mapTo: 'Katapuldra ex' },
    { deckName: 'Eeveelution', entries: 16, createNew: true },
    { deckName: 'Slowking / Xatu', entries: 15, createNew: true },
  ];

  let newArchetypesNeeded = aliasesToAdd.filter(a => a.createNew).length;
  let aliasesMapped = 0;

  console.log(`Found ${aliasesToAdd.length} high-priority decks to process:`);
  console.log(`  - ${newArchetypesNeeded} need new archetypes`);
  console.log(`  - ${aliasesToAdd.length - newArchetypesNeeded} can map to existing\n`);

  for (const { deckName, entries, createNew, mapTo } of aliasesToAdd) {
    // Check if alias already exists
    const { data: existingAlias } = await supabase
      .from('fantasy_archetype_aliases')
      .select('archetype_id')
      .eq('alias', deckName);

    if (existingAlias && existingAlias.length > 0) {
      console.log(`⊘ Already exists: ${deckName}`);
      continue;
    }

    if (createNew) {
      // Create new archetype
      const slug = deckName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const { data: newArch, error: archError } = await supabase
        .from('fantasy_archetypes')
        .insert({ name: deckName, slug, tier: 'D' })
        .select('id')
        .single();

      if (archError) {
        console.log(`❌ Error creating archetype for "${deckName}": ${archError.message}`);
        continue;
      }

      // Add alias
      const { error: aliasError } = await supabase
        .from('fantasy_archetype_aliases')
        .insert({ archetype_id: newArch.id, alias: deckName });

      if (aliasError) {
        console.log(`❌ Error adding alias for "${deckName}": ${aliasError.message}`);
      } else {
        console.log(`✓ Created archetype + alias: ${deckName} (${entries} entries)`);
        aliasesMapped++;
      }
    } else if (mapTo) {
      // Map to existing archetype
      const { data: targetArch } = await supabase
        .from('fantasy_archetypes')
        .select('id')
        .eq('name', mapTo)
        .single();

      if (!targetArch) {
        console.log(`❌ Target archetype not found: ${mapTo}`);
        continue;
      }

      const { error: aliasError } = await supabase
        .from('fantasy_archetype_aliases')
        .insert({ archetype_id: targetArch.id, alias: deckName });

      if (aliasError) {
        console.log(`❌ Error adding alias for "${deckName}": ${aliasError.message}`);
      } else {
        console.log(`✓ Mapped to existing: ${deckName} → ${mapTo} (${entries} entries)`);
        aliasesMapped++;
      }
    }
  }

  console.log(`\n✅ Added ${aliasesMapped} new aliases`);
  
  // Get new coverage
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .not('archetype', 'eq', 'Unknown');
  
  const uniqueDecks = [...new Set(standings?.map(s => s.archetype))];
  
  let withAliases = 0;
  for (const deckName of uniqueDecks) {
    const { data: alias } = await supabase
      .from('fantasy_archetype_aliases')
      .select('archetype_id')
      .eq('alias', deckName);
    
    if (alias && alias.length > 0) withAliases++;
  }
  
  const newCoverage = ((withAliases / uniqueDecks.length) * 100).toFixed(1);
  console.log(`\n📊 New coverage: ${newCoverage}% (was 48.8%)`);
}

async function main() {
  try {
    await addHighPriorityAliases();
    console.log('\n✅ High-priority aliases added!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
