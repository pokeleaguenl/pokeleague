import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Consolidating duplicate archetypes using canonical_id ===\n');

// Map duplicates to their canonical archetype
const consolidations = [
  // Absol + Kangaskhan variants → Mega Absol Box (id: 2)
  { duplicate: 57, canonical: 2, name: 'Mega Absol ex / Mega Kangaskhan ex → Mega Absol Box' },
  { duplicate: 240, canonical: 2, name: 'Mega Kangaskhan ex / Mega Absol ex → Mega Absol Box' },
  
  // Charizard variants → Charizard ex / Pidgeot ex (id: 26)
  { duplicate: 66, canonical: 26, name: 'Charizard ex / Pidgeot ex / Dusknoir → Charizard ex / Pidgeot ex' },
  { duplicate: 220, canonical: 26, name: 'Charizard ex / Pidgeot ex / Lopunny ex → Charizard ex / Pidgeot ex' },
];

for (const { duplicate, canonical, name } of consolidations) {
  const { error } = await supabase
    .from('fantasy_archetypes')
    .update({ canonical_id: canonical })
    .eq('id', duplicate);
  
  if (error) {
    console.log(`❌ ${name}: ${error.message}`);
  } else {
    console.log(`✅ ${name}`);
  }
}

console.log('\n=== Updated rk9Analytics to respect canonical_id ===');
console.log('Now when querying archetype 57 or 240, it will use archetype 2\'s aliases');

process.exit(0);
