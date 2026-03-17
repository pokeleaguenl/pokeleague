import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding All Priority Decks (5+ and 2-4 entries) ===\n');

const decksToAdd = [
  // HIGH PRIORITY (5+ entries)
  { name: 'Froslass / Munkidori', count: 21 },
  { name: 'Ogerpon ex / Lithomith', count: 9 },
  { name: 'Ceruledge ex / Revavroom', count: 9 },
  { name: 'Noctowl / Teal Mask Ogerpon ex', count: 8 },
  { name: 'Hydreigon ex / Noctowl', count: 8 },
  { name: 'Zoroark-ex', count: 8 },
  { name: 'Blissey ex', count: 8 },
  { name: 'Noctowl ex / Eeveelution', count: 6 },
  { name: 'Blissey ex / Ogerpon ex', count: 6 },
  { name: 'Genesect ex / Gromago ex', count: 6 },
  { name: 'Blissey ex / Munkidori', count: 6 },
  { name: 'Eeveelution ex', count: 6 },
  { name: 'Armarouge / Ethan\'s Ho-Oh ex', count: 6 },
  { name: 'Furienblitz ex / Ogerpon ex', count: 5 },
  { name: 'Monetigo ex', count: 5 },
  { name: 'Miraidon ex / Mew ex', count: 5 },
  { name: 'Gholdengo ex / Katapult ex', count: 5 },
  
  // MEDIUM PRIORITY (2-4 entries)
  { name: 'Miraidon ex / Galvantula', count: 4 },
  { name: 'Miraidon ex / Gromago ex', count: 4 },
  { name: 'Raging Bolt ex / Ogerpon', count: 3 },
  { name: 'Grimmsnarl ex / Marnie\'s', count: 3 },
  { name: 'Meganium ex / Ogerpon ex', count: 3 },
  { name: 'Meistagrif ex', count: 3 },
  { name: 'Sylveon ex / Terapagos ex', count: 3 },
  { name: 'Blissey ex / Centiskorch', count: 3 },
  { name: 'Pidgeot ex / Latias ex', count: 3 },
  { name: 'Palafin ex', count: 3 },
  { name: 'Ho-Oh ex / Magcargo', count: 3 },
  { name: 'Chien-Pao ex / Baxcalibur', count: 3 },
  { name: 'Zoroark ex / Gengar ex', count: 2 },
  { name: 'Noarfang / Ogerpon ex', count: 2 },
  { name: 'Gromago-ex / Miraidon-ex', count: 2 },
  { name: 'Ogerpon ex / Venusaur', count: 2 },
  { name: 'Slowking ex', count: 2 },
  { name: 'Greninja ex / Dusknoir', count: 2 },
  { name: 'Iron Valiant ex / Iron Crown ex', count: 2 },
  { name: 'Ceruledge ex / Ogerpon ex', count: 2 },
  { name: 'Katapult ex / Ursaluna ex', count: 2 },
  { name: 'Gouging Fire ex', count: 2 },
  { name: 'Blissey ex / Farigiraf ex', count: 2 },
  { name: 'Eevee ex / Fezandipiti ex', count: 2 },
  { name: 'Blaziken ex / Zoroark ex', count: 2 },
  { name: 'Ogerpon ex / Farigiraf ex', count: 2 },
  { name: 'Ogerpon ex / Sinistcha ex', count: 2 },
  { name: 'Raging Bolt ex / Furiatonante ex', count: 2 },
  { name: 'Scovillain ex', count: 2 },
  { name: 'Zekrom ex / Iron Hands ex', count: 2 },
  { name: 'Malamar ex / Ogerpon ex', count: 2 },
];

let created = 0;
let skipped = 0;

for (const { name, count } of decksToAdd) {
  // Check if exists
  const { data: existing } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', name);

  if (existing && existing.length > 0) {
    console.log(`⊘ Exists: ${name}`);
    skipped++;
    continue;
  }

  // Create slug
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Create archetype
  const { data: arch, error: archError } = await supabase
    .from('fantasy_archetypes')
    .insert({ name, slug })
    .select('id')
    .single();

  if (archError) {
    // Might be duplicate slug, try with suffix
    const slugWithCount = `${slug}-${count}`;
    const { data: arch2, error: archError2 } = await supabase
      .from('fantasy_archetypes')
      .insert({ name, slug: slugWithCount })
      .select('id')
      .single();
    
    if (archError2) {
      console.log(`❌ Error: ${name} - ${archError2.message}`);
      continue;
    }
    
    // Add alias
    await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: arch2.id, alias: name });
    
    console.log(`✓ Created: ${name} (${count} entries) [slug: ${slugWithCount}]`);
    created++;
  } else {
    // Add alias
    await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: arch.id, alias: name });
    
    console.log(`✓ Created: ${name} (${count} entries)`);
    created++;
  }
}

console.log(`\n✅ Created ${created} new decks`);
console.log(`⊘ Skipped ${skipped} existing`);

// Get final coverage
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

const coverage = ((withAliases / uniqueDecks.length) * 100).toFixed(1);
console.log(`\n📊 Coverage: ${coverage}% (was 59.6%)`);
console.log(`Remaining: ${uniqueDecks.length - withAliases} decks (mostly 1-entry builds)`);

process.exit(0);
