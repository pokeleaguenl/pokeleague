/**
 * Add High-Priority Aliases (Fixed)
 * 
 * Adds aliases for decks with 10+ entries that don't have coverage yet.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding High-Priority Aliases ===\n');

async function addHighPriorityAliases() {
  const aliasesToAdd = [
    { deckName: 'Katapuldra ex', entries: 50 },
    { deckName: 'Garchomp ex', entries: 50 },
    { deckName: 'Gholdengo ex / Miraidon ex', entries: 33 },
    { deckName: 'Zoroark ex / N\'s', entries: 33 },
    { deckName: 'Monetigo-ex / Genesect-ex', entries: 33 },
    { deckName: 'Lanssorien-ex / Noctunoir', entries: 32 },
    { deckName: 'Grimmsnarl ex / Bloodmoon Ursaluna ex', entries: 30 },
    { deckName: 'Crustle', entries: 28 },
    { deckName: 'Armarouge / Ho-Oh ex', entries: 25 },
    { deckName: 'Noctowl / Raging Bolt ex', entries: 22 },
    { deckName: 'Froslass / Munkidori', entries: 21 },
    { deckName: 'Noctowl / Fezandipiti ex', entries: 21 },
    { deckName: 'Genesect ex / Monetigo ex', entries: 20 },
    { deckName: 'Monetigo-ex / Gierspenst', entries: 18 },
    { deckName: 'Noctowl / Eeveelution', entries: 18 },
    { deckName: 'Ogerpon ex / Crustle', entries: 18 },
    { deckName: 'Eeveelution', entries: 16 },
    { deckName: 'Slowking / Xatu', entries: 15 },
  ];

  // Variants that should map to base
  const variants = [
    { deckName: 'Katapuldra-ex', mapTo: 'Katapuldra ex' },
    { deckName: 'Katapuldra ex / Grolldra', mapTo: 'Katapuldra ex' },
  ];

  let created = 0;
  let mapped = 0;

  console.log(`Processing ${aliasesToAdd.length} new archetypes...\n`);

  for (const { deckName, entries } of aliasesToAdd) {
    // Check if alias already exists
    const { data: existingAlias } = await supabase
      .from('fantasy_archetype_aliases')
      .select('archetype_id')
      .eq('alias', deckName);

    if (existingAlias && existingAlias.length > 0) {
      console.log(`⊘ Already exists: ${deckName}`);
      continue;
    }

    // Create slug
    const slug = deckName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Create archetype (without tier field)
    const { data: newArch, error: archError } = await supabase
      .from('fantasy_archetypes')
      .insert({ name: deckName, slug })
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
      console.log(`✓ Created: ${deckName} (${entries} entries)`);
      created++;
    }
  }

  console.log(`\nProcessing ${variants.length} variant mappings...\n`);

  for (const { deckName, mapTo } of variants) {
    // Check if alias already exists
    const { data: existingAlias } = await supabase
      .from('fantasy_archetype_aliases')
      .select('archetype_id')
      .eq('alias', deckName);

    if (existingAlias && existingAlias.length > 0) {
      console.log(`⊘ Already exists: ${deckName}`);
      continue;
    }

    // Find target archetype (may have just been created)
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
      console.log(`✓ Mapped: ${deckName} → ${mapTo}`);
      mapped++;
    }
  }

  console.log(`\n✅ Created ${created} new archetypes + aliases`);
  console.log(`✅ Mapped ${mapped} variants`);
  
  // Calculate new coverage
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
    console.log('\n✅ High-priority aliases complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
