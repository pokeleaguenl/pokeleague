import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Fixing Remaining Archetypes with Duplicate Conflicts ===\n');

// List of archetypes that failed due to duplicates
const failedArchetypes = [
  { id: 1, name: 'Charizard ex' },
  { id: 3, name: "Marnie's Grimmsnarl ex" },
  { id: 4, name: 'Raging Bolt ex' },
  { id: 5, name: "N's Zoroark ex" },
  { id: 6, name: 'Mega Kangaskhan ex' },
  { id: 7, name: 'Flareon ex' },
  { id: 13, name: 'Ceruledge ex' },
  { id: 15, name: 'Greninja ex' },
  { id: 17, name: 'Miraidon ex' },
  { id: 21, name: 'Iron Thorns ex' },
  { id: 23, name: 'Dragapult ex' },
  { id: 24, name: 'Gardevoir ex' },
  { id: 25, name: 'Gholdengo ex' },
  { id: 28, name: 'Alakazam ex' },
  { id: 35, name: 'Terapagos ex' },
  { id: 47, name: 'Bloodmoon Ursaluna ex' },
  { id: 52, name: 'Toolbox' },
  { id: 54, name: 'Ogerpon ex' },
  { id: 61, name: 'Absol ex / Ogerpon ex' },
  { id: 64, name: 'Ogerpon ex / Absol ex' },
  { id: 65, name: 'Noctowl ex' },
  { id: 68, name: 'Noctowl' },
  { id: 69, name: 'Zoroark ex' },
  { id: 72, name: 'Kangaskhan ex / Absol ex' },
  { id: 78, name: 'Toxtricity ex' },
  { id: 83, name: "Ethan's Typhlosion ex" },
  { id: 84, name: 'Azumarill ex' },
  { id: 104, name: 'Alakazam' },
  { id: 109, name: 'Munkidori / Mega Absol ex' },
  { id: 112, name: 'Pecharunt ex / Roaring Moon ex' },
  { id: 135, name: 'Grimmsnarl ex' },
  { id: 139, name: 'Fezandipiti ex' },
  { id: 158, name: 'Team Rocket\'s Mewtwo ex / Mewtwo ex' },
  { id: 168, name: 'Toedscruel ex / Teal Mask Ogerpon ex' },
  { id: 178, name: 'Pidgeot ex' },
  { id: 179, name: 'Absol ex / Mega Absol ex' },
  { id: 181, name: 'Absol ex / Fezandipiti ex' },
  { id: 183, name: 'Slaking ex' },
  { id: 185, name: "Cynthia's Garchomp ex" },
  { id: 189, name: "Ethan's Typhlosion / Dragapult ex" },
  { id: 191, name: 'Metagross ex / Heatran' },
  { id: 212, name: 'Roaring Moon ex / Ursaluna Bloodmoon ex' },
  { id: 228, name: 'Slowking' },
  { id: 235, name: 'Malamar ex' },
  { id: 237, name: 'Conkeldurr / Dudunsparce' },
  { id: 253, name: 'Bloodmoon Ursaluna ex / Mega Absol ex' },
  { id: 259, name: 'Ursaluna ex' },
  { id: 279, name: 'Mewtwo ex / Lost Box' },
];

console.log(`Processing ${failedArchetypes.length} archetypes with duplicate conflicts...\n`);

let fixed = 0;
let stillConflicts = 0;

for (const archetype of failedArchetypes) {
  // For these base archetypes (single card names), we need to be more selective
  // Only add the EXACT match, not variants
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .eq('archetype', archetype.name); // Exact match only

  if (!standings || standings.length === 0) {
    console.log(`⚪ ${archetype.name} - no exact match in standings`);
    continue;
  }

  // Try to insert this exact alias
  const { error } = await supabase
    .from('fantasy_archetype_aliases')
    .insert({
      archetype_id: archetype.id,
      alias: archetype.name
    });

  if (error) {
    console.log(`❌ ${archetype.name} - Still conflicts (already assigned elsewhere)`);
    stillConflicts++;
  } else {
    console.log(`✅ ${archetype.name} - Added exact match alias`);
    fixed++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Fixed: ${fixed}`);
console.log(`Still have conflicts: ${stillConflicts}`);
console.log(`\nFor remaining conflicts, the alias is already assigned to a more`);
console.log(`specific variant archetype (e.g., "Charizard ex" is assigned to`);
console.log(`"Charizard ex / Pidgeot ex" which is more specific).`);

process.exit(0);
