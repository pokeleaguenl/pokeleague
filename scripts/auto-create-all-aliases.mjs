import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Auto-creating aliases for all archetypes ===\n');

// Get all archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .order('id');

let totalCreated = 0;
let totalSkipped = 0;

for (const archetype of archetypes || []) {
  // Check if already has aliases
  const { count: existingCount } = await supabase
    .from('fantasy_archetype_aliases')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  if (existingCount > 0) {
    totalSkipped++;
    continue;
  }
  
  // Find all matching standings for this archetype name
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .ilike('archetype', `%${archetype.name}%`);
  
  if (!standings || standings.length === 0) {
    console.log(`⚪ ${archetype.name} - no standings found`);
    continue;
  }
  
  // Get unique archetype strings
  const uniqueArchetypes = [...new Set(standings.map(s => s.archetype))];
  
  // Insert all as aliases
  const aliasInserts = uniqueArchetypes.map(arch => ({
    archetype_id: archetype.id,
    alias: arch
  }));
  
  const { error } = await supabase
    .from('fantasy_archetype_aliases')
    .insert(aliasInserts);
  
  if (error) {
    console.log(`❌ ${archetype.name} - Error: ${error.message}`);
  } else {
    console.log(`✅ ${archetype.name} - ${uniqueArchetypes.length} aliases created`);
    totalCreated += uniqueArchetypes.length;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Archetypes processed: ${archetypes?.length || 0}`);
console.log(`Archetypes skipped (already had aliases): ${totalSkipped}`);
console.log(`Total new aliases created: ${totalCreated}`);
console.log('');

process.exit(0);
