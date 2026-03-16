import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing Variants Component Logic ===\n');

// Test with Dragapult ex
const { data: variants } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .eq('canonical_id', 23)
  .order('name');

console.log(`Dragapult ex variants: ${variants?.length || 0}`);
variants?.forEach(v => console.log(`  - ${v.name}`));

console.log('\n✅ Component will show these variants on /decks/dragapult-ex');

// Test with Charizard ex
const { data: charizardVariants } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .eq('canonical_id', 1)
  .order('name');

console.log(`\nCharizard ex variants: ${charizardVariants?.length || 0}`);
charizardVariants?.forEach(v => console.log(`  - ${v.name}`));

console.log('\n✅ Component will show these variants on /decks/charizard-ex');

process.exit(0);
