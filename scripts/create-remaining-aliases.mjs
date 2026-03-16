import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Creating aliases for remaining 44 archetypes ===\n');

// List of archetypes still missing aliases
const missingAliases = [
  { id: 6, name: 'Mega Kangaskhan ex' },
  { id: 12, name: 'Tera Box' },
  { id: 52, name: 'Toolbox' },
  { id: 57, name: 'Mega Absol ex / Mega Kangaskhan ex' },
  { id: 58, name: 'Gholdengo ex / Greedent' },
  { id: 61, name: 'Absol ex / Ogerpon ex' },
  { id: 64, name: 'Ogerpon ex / Absol ex' },
  { id: 65, name: 'Noctowl ex' },
  { id: 66, name: 'Charizard ex / Pidgeot ex / Dusknoir' },
  { id: 68, name: 'Noctowl' },
  { id: 77, name: 'Pidgeot ex / Noctowl' },
  { id: 85, name: 'Gardevoir ex / Fezandipiti' },
  { id: 104, name: 'Alakazam' },
  { id: 121, name: 'Miraidon ex / Dusclops' },
  { id: 135, name: 'Grimmsnarl ex' },
  { id: 138, name: 'Clodsire ex / Corviknight' },
  { id: 139, name: 'Fezandipiti ex' },
  { id: 143, name: 'Ogerpon ex / Serperior' },
  { id: 153, name: 'Miraidon ex / Roaring Moon ex' },
  { id: 160, name: 'Raging Bolt ex / Blaziken ex' },
  { id: 163, name: 'Conkeldurr ex' },
  { id: 179, name: 'Absol ex / Mega Absol ex' },
  { id: 181, name: 'Absol ex / Fezandipiti ex' },
  { id: 184, name: 'Ogerpon ex / Mismagius' },
  { id: 188, name: 'Mega Lopunny ex / Dusknoir' },
  { id: 189, name: "Ethan's Typhlosion / Dragapult ex" },
  { id: 198, name: 'Turtonator ex / Solrock' },
  { id: 200, name: 'Mega Lopunny ex / Pecharunt' },
  { id: 201, name: 'Miraidon ex / Orthworm ex' },
  { id: 207, name: 'Gholdengo ex / Gholdengo ex' },
  { id: 208, name: 'Toedscruel ex / Gholdengo ex' },
  { id: 212, name: 'Roaring Moon ex / Ursaluna Bloodmoon ex' },
  { id: 216, name: 'Mega Venusaur ex / Teal Mask Ogerpon ex' },
  { id: 217, name: 'Mewtwo ex' },
  { id: 220, name: 'Charizard ex / Pidgeot ex / Lopunny ex' },
  { id: 221, name: 'Raging Bolt ex / Roaring Moon ex' },
  { id: 223, name: 'Gholdengo ex / Medicham ex' },
  { id: 227, name: 'Cornerstone Ogerpon ex / Munkidori' },
  { id: 235, name: 'Malamar ex' },
  { id: 240, name: 'Mega Kangaskhan ex / Mega Absol ex' },
  { id: 242, name: 'Greninja ex / Pidgeot ex / Dusknoir' },
  { id: 253, name: 'Bloodmoon Ursaluna ex / Mega Absol ex' },
  { id: 265, name: 'Pidgeot ex / Lopunny ex' },
  { id: 279, name: 'Mewtwo ex / Lost Box' },
];

let created = 0;

for (const archetype of missingAliases) {
  // Try multiple search strategies
  const searchTerms = [];
  
  // Strategy 1: Split on " / " and search for each part
  const parts = archetype.name.split(' / ');
  for (const part of parts) {
    searchTerms.push(part);
  }
  
  // Strategy 2: Search for first token
  const firstToken = archetype.name.split(' ')[0];
  searchTerms.push(firstToken);
  
  // Search standings with each term
  const foundArchetypes = new Set();
  
  for (const term of searchTerms) {
    const { data } = await supabase
      .from('rk9_standings')
      .select('archetype')
      .ilike('archetype', `%${term}%`);
    
    data?.forEach(s => foundArchetypes.add(s.archetype));
  }
  
  // Filter to only relevant matches (containing key parts of the name)
  const relevantArchetypes = Array.from(foundArchetypes).filter(arch => {
    const lowerArch = arch.toLowerCase();
    const lowerName = archetype.name.toLowerCase();
    
    // Must contain at least the first major token
    const firstMajorToken = lowerName.split(' ')[0];
    return lowerArch.includes(firstMajorToken);
  });
  
  if (relevantArchetypes.length === 0) {
    console.log(`⚪ ${archetype.name} - no matches found`);
    continue;
  }
  
  // Insert aliases
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
    created += relevantArchetypes.length;
  }
}

console.log(`\n✅ Created ${created} new aliases`);
process.exit(0);
