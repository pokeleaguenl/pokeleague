import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding Missing Dragapult Variant Aliases ===\n');

// Dragapult ex / Dusknoir (ID: 27) should get small Dusknoir variants
const dusknoirVariants = [
  'Dragapult ex / Azumarill',
  'Dragapult ex / Chandelure',
  'Dragapult ex / Gholdengo ex',
  'Dragapult ex / Glaceon ex',
  'Dragapult ex / Iron Thorns ex',
  'Dragapult ex / Leafeon ex',
  'Dragapult ex / Meowscarada ex',
  'Dragapult ex / Munkidori',
  'Dragapult ex / Pidgeot ex',
  'Dragapult ex / Roaring Moon ex',
  'Dragapult ex / Typhlosion',
  'Dragapult ex / Wugtrio',
  'Dragapult ex / Xatu',
  'Dragapult ex / Zoroark',
  'Dragapult ex / Zoroark ex',
  'Gholdengo ex / Dragapult ex',
  'Wugtrio / Dragapult ex',
];

const archetypeId = 27; // Dragapult ex / Dusknoir

let added = 0;
for (const alias of dusknoirVariants) {
  // Check if already exists
  const { data: existing } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('alias', alias);
  
  if (!existing || existing.length === 0) {
    const { error } = await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: archetypeId, alias });
    
    if (error) {
      console.log(`❌ Error adding "${alias}": ${error.message}`);
    } else {
      console.log(`✓ Added: ${alias}`);
      added++;
    }
  } else {
    console.log(`⊘ Already exists: ${alias}`);
  }
}

console.log(`\n✅ Added ${added} new aliases to Dragapult ex / Dusknoir`);

// Check total count now
const { data: allAliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', archetypeId);

console.log(`Total aliases for Dragapult ex / Dusknoir: ${allAliases?.length || 0}`);

process.exit(0);
