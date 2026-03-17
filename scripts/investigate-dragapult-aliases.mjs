import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Investigating Dragapult Alias Issue ===\n');

// Get Dragapult archetype
const { data: dragapult } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .ilike('name', '%dragapult%');

console.log('Dragapult archetypes:');
dragapult?.forEach(d => {
  console.log(`  ID: ${d.id}, Name: ${d.name}, Slug: ${d.slug}`);
});

// Get Ursaluna archetype
const { data: ursaluna } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .ilike('name', '%ursaluna%');

console.log('\nUrsaluna archetypes:');
ursaluna?.forEach(u => {
  console.log(`  ID: ${u.id}, Name: ${u.name}, Slug: ${u.slug}`);
});

// Check aliases for Dragapult ex / Dusknoir (likely the main one)
const dragapultDusknoir = dragapult?.find(d => d.name.includes('Dusknoir'));
if (dragapultDusknoir) {
  console.log(`\n=== Aliases for "${dragapultDusknoir.name}" (ID: ${dragapultDusknoir.id}) ===`);
  
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', dragapultDusknoir.id);
  
  console.log(`Total aliases: ${aliases?.length || 0}`);
  aliases?.forEach(a => console.log(`  - "${a.alias}"`));
}

// Check if "Ursaluna ex / Dusclops" is assigned to wrong archetype
console.log('\n=== Checking "Ursaluna ex / Dusclops" alias ===');
const { data: wrongAlias } = await supabase
  .from('fantasy_archetype_aliases')
  .select('archetype_id, alias')
  .eq('alias', 'Ursaluna ex / Dusclops');

if (wrongAlias && wrongAlias.length > 0) {
  console.log(`Found alias assigned to archetype_id: ${wrongAlias[0].archetype_id}`);
  
  // Get the archetype name
  const { data: arch } = await supabase
    .from('fantasy_archetypes')
    .select('name')
    .eq('id', wrongAlias[0].archetype_id)
    .single();
  
  console.log(`Archetype name: ${arch?.name}`);
  console.log('❌ PROBLEM: "Ursaluna ex / Dusclops" is assigned to wrong archetype!');
}

// Check RK9 standings for actual deck name
console.log('\n=== Checking RK9 standings for similar names ===');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .or('archetype.ilike.%Dragapult%,archetype.ilike.%Ursaluna%Dusclops%')
  .limit(20);

const unique = [...new Set(standings?.map(s => s.archetype))];
console.log('Unique deck names in standings:');
unique.forEach(name => console.log(`  - "${name}"`));

process.exit(0);
