import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding Variants for Each Archetype ===\n');

// Test with Dragapult
const testArchetype = { id: 23, name: 'Dragapult ex' };

console.log(`Testing with: ${testArchetype.name}\n`);

// Strategy: Find all archetypes that start with this name + " / "
const { data: variants } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .ilike('name', `${testArchetype.name} / %`)
  .neq('canonical_id', testArchetype.id); // Exclude if it's a canonical reference

console.log(`Found ${variants?.length || 0} variants:`);
variants?.forEach(v => console.log(`  - ${v.name} (slug: ${v.slug})`));

// Get entry counts for each variant
if (variants && variants.length > 0) {
  console.log('\nEntry counts:');
  for (const variant of variants) {
    const { data: aliases } = await supabase
      .from('fantasy_archetype_aliases')
      .select('alias')
      .eq('archetype_id', variant.id);
    
    if (aliases && aliases.length > 0) {
      const { count } = await supabase
        .from('rk9_standings')
        .select('*', { count: 'exact', head: true })
        .in('archetype', aliases.map(a => a.alias));
      
      console.log(`  ${variant.name}: ${count || 0} entries`);
    }
  }
}

console.log('\n=== Implementation Plan ===');
console.log('1. Create a function to find variants: findVariants(archetypeName)');
console.log('2. Get entry counts for each variant');
console.log('3. Sort by entry count descending');
console.log('4. Display in a new section on deck page');

process.exit(0);
