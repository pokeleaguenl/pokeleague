import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// canonical archetype_id -> name prefixes that roll up to it
const CANONICAL_ROLLUPS = {
  1:  ['Charizard ex /'],
  4:  ['Raging Bolt ex /'],
  5:  ["N's Zoroark ex /"],
  7:  ['Flareon ex /'],
  13: ['Ceruledge ex /'],
  15: ['Greninja ex /'],
  17: ['Miraidon ex /'],
  19: ['Mega Lopunny ex /'],
  20: ['Mega Venusaur ex /'],
  21: ['Iron Thorns ex /'],
  23: ['Dragapult ex /'],
  24: ['Gardevoir ex /'],
  25: ['Gholdengo ex /'],
  6:  ['Mega Kangaskhan ex /'],
};

const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name');

let updated = 0;
for (const arch of archetypes) {
  for (const [canonicalId, patterns] of Object.entries(CANONICAL_ROLLUPS)) {
    if (arch.id === parseInt(canonicalId)) continue;
    if (patterns.some(p => arch.name.startsWith(p))) {
      const { error } = await supabase
        .from('fantasy_archetypes')
        .update({ canonical_id: parseInt(canonicalId) })
        .eq('id', arch.id);
      if (!error) {
        updated++;
        console.log(`  ✅ ${arch.name} -> canonical ${canonicalId}`);
      } else {
        console.log(`  ❌ ${arch.name}: ${error.message}`);
      }
    }
  }
}
console.log(`\nUpdated ${updated} variants`);
