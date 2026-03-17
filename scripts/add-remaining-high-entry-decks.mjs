import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding Remaining High-Entry Decks (10+) ===\n');

const decksToAdd = [
  // New archetypes (10+ entries)
  { deckName: 'Froslass / Munkidori', entries: 21 },
  { deckName: 'Miraidon ex / Genesect ex', entries: 14 },
  { deckName: 'Hydrapple ex / Ogerpon ex', entries: 13 },
  { deckName: 'Ogerpon ex / Noctuh', entries: 13 },
  { deckName: 'Farigiraf ex / Ogerpon ex', entries: 13 },
  { deckName: 'Gholdengo ex / Dusknoir', entries: 12 },
  { deckName: 'Ho-Oh ex / Armarouge', entries: 11 },
  { deckName: 'Genesect ex', entries: 10 },
];

let created = 0;

for (const { deckName, entries } of decksToAdd) {
  // Check if already exists
  const { data: existing } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', deckName);

  if (existing && existing.length > 0) {
    console.log(`⊘ Already exists: ${deckName}`);
    continue;
  }

  // Check if archetype exists
  const { data: existingArch } = await supabase
    .from('fantasy_archetypes')
    .select('id')
    .eq('name', deckName);

  if (existingArch && existingArch.length > 0) {
    // Just add alias
    const { error } = await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: existingArch[0].id, alias: deckName });

    if (error) {
      console.log(`❌ Error adding alias: ${error.message}`);
    } else {
      console.log(`✓ Added alias: ${deckName} (${entries} entries)`);
      created++;
    }
    continue;
  }

  // Create slug
  const slug = deckName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Create archetype
  const { data: newArch, error: archError } = await supabase
    .from('fantasy_archetypes')
    .insert({ name: deckName, slug })
    .select('id')
    .single();

  if (archError) {
    console.log(`❌ Error creating archetype: ${archError.message}`);
    continue;
  }

  // Add alias
  const { error: aliasError } = await supabase
    .from('fantasy_archetype_aliases')
    .insert({ archetype_id: newArch.id, alias: deckName });

  if (aliasError) {
    console.log(`❌ Error adding alias: ${aliasError.message}`);
  } else {
    console.log(`✓ Created: ${deckName} (${entries} entries)`);
    created++;
  }
}

console.log(`\n✅ Added ${created} new decks`);

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
console.log(`📊 New coverage: ${newCoverage}% (was 56.7%)`);

process.exit(0);
