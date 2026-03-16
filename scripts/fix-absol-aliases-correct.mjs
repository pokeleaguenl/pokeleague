import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ABSOL_ARCHETYPE_ID = 2;

console.log('\n=== Step 1: Delete ALL existing Absol aliases ===');
const { error: deleteError } = await supabase
  .from('fantasy_archetype_aliases')
  .delete()
  .eq('archetype_id', ABSOL_ARCHETYPE_ID);

if (deleteError) {
  console.error('Delete error:', deleteError);
  process.exit(1);
}
console.log('✅ Deleted all existing aliases');

console.log('\n=== Step 2: Get all unique Absol archetype strings from rk9_standings ===');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', '%absol%');

// Get unique archetype strings
const uniqueArchetypes = [...new Set(standings?.map(s => s.archetype) || [])];
console.log(`Found ${uniqueArchetypes.length} unique Absol variants in standings`);

console.log('\n=== Step 3: Insert all as aliases (exact match format) ===');
let added = 0;
let failed = 0;

for (const archetype of uniqueArchetypes) {
  const { error } = await supabase
    .from('fantasy_archetype_aliases')
    .insert({
      archetype_id: ABSOL_ARCHETYPE_ID,
      alias: archetype
    });
  
  if (error) {
    console.error(`  ❌ Failed: "${archetype}"`, error.message);
    failed++;
  } else {
    console.log(`  ✅ Added: "${archetype}"`);
    added++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`✅ Added: ${added}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total unique: ${uniqueArchetypes.length}`);

process.exit(0);
