import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding Variants - Correct Approach ===\n');

const testArchetype = { id: 23, name: 'Dragapult ex' };

console.log(`Base: ${testArchetype.name}\n`);

// Find all archetypes that contain this name
const { data: allArchetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug, canonical_id')
  .ilike('name', `%Dragapult ex%`);

console.log(`All Dragapult archetypes (${allArchetypes?.length || 0}):`);
allArchetypes?.forEach(a => {
  const isBase = a.id === testArchetype.id;
  const isCanonical = a.canonical_id !== null;
  console.log(`  ${isBase ? '🔵' : '  '} ${a.name} (id: ${a.id}${isCanonical ? `, canonical: ${a.canonical_id}` : ''})`);
});

// Filter to actual variants (not the base, not canonical refs)
const variants = allArchetypes?.filter(a => 
  a.id !== testArchetype.id && // Not the base itself
  a.canonical_id === null && // Not a canonical reference
  a.name.startsWith(testArchetype.name) && // Starts with base name
  a.name !== testArchetype.name // Not exact match
) || [];

console.log(`\nFiltered variants (${variants.length}):`);
variants.forEach(v => console.log(`  - ${v.name}`));

// Get stats for each
console.log('\n=== Variant Stats ===\n');
for (const variant of variants) {
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', variant.id);
  
  let entryCount = 0;
  if (aliases && aliases.length > 0) {
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .in('archetype', aliases.map(a => a.alias));
    entryCount = count || 0;
  }
  
  console.log(`${variant.name}`);
  console.log(`  Entries: ${entryCount}`);
  console.log(`  Slug: ${variant.slug}\n`);
}

process.exit(0);
