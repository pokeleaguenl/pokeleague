import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ABSOL_ARCHETYPE_ID = 2;

// All the variants we found in the diagnostic
const aliases = [
  'Mega Absol ex / Mega Kangaskhan ex',
  'Munkidori / Mega Absol ex',
  'Absol ex / Kangaskhan ex',
  'Kangaskhan ex / Absol ex',
  'Absol ex / Mega Absol ex',
  'Mega Absol ex / Kangaskhan ex',
  'Absol ex / Ogerpon ex',
  'Ogerpon ex / Absol ex',
  'Mega Kangaskhan ex / Mega Absol ex',
  'Ogerpon ex / Mega Absol ex',
  'Absol ex / Munkidori',
  'Absol-ex / Kangaskhan-ex',
  'Cornerstone Ogerpon ex / Mega Absol ex',
  'Absol ex / Yveltal',
  'Mega Absol ex / Yveltal',
  'Absol ex / Fezandipiti ex',
  'Bloodmoon Ursaluna ex / Mega Absol ex',
  'Mega Absol-ex / Kangaskhan-ex',
  'Cornerstone Mask Ogerpon ex / Mega Absol ex',
  'Mega Absol ex / Kangama ex',
  'Mega-Absol ex / Mega-Kangaskhan ex',
  'Mega Absol-ex / Kangama-ex',
  'Crustle / Mega Absol ex',
  'Toolbox / Mega Absol ex',
  'Bouffalant / Mega Absol ex',
  'Absol ex / Kangourex ex',
  'Mega Kangama ex / Mega Absol ex',
  'Mega Absol-ex / Mega Kangourex-ex',
  'Mega Absol ex / Munkidori',
  'Mega Kangaskhan ex / Absol ex',
  'Marnie ex / Absol ex',
  'Mega Absol ex / Cornerstone Mask Ogerpon ex',
  'Pecharunt ex / Mega Absol ex',
  'Yveltal ex / Mega Absol ex',
  'Mega Absol ex / Pecharunt ex',
  'Mega Absol ex / Crustle',
  'Pecharunt ex / Absol ex',
  'Absol ex / Zoroark ex',
  'Absol ex / Mega-Absol ex',
  'Mega-Absol-ex',
  'Mega Gardevoir ex / Mega Absol ex',
  'Absol ex / Crustle',
  'Mega Absol ex / Cinderace',
  'Mega Absol ex / Kangourex ex'
];

console.log(`\n=== Adding ${aliases.length} aliases for Mega Absol Box (id: ${ABSOL_ARCHETYPE_ID}) ===\n`);

let added = 0;
let skipped = 0;

for (const alias of aliases) {
  const { error } = await supabase
    .from('fantasy_archetype_aliases')
    .insert({
      archetype_id: ABSOL_ARCHETYPE_ID,
      alias: alias
    });
  
  if (error) {
    if (error.code === '23505') { // duplicate key
      console.log(`  ⏭️  Skipped (already exists): "${alias}"`);
      skipped++;
    } else {
      console.error(`  ❌ Error adding "${alias}":`, error.message);
    }
  } else {
    console.log(`  ✅ Added: "${alias}"`);
    added++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`✅ Added: ${added}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`Total: ${aliases.length}`);

process.exit(0);
