import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding All Dragapult Variants in RK9 Standings ===\n');

// Get all unique Dragapult deck names from standings
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', '%dragapult%');

const uniqueDecks = [...new Set(standings?.map(s => s.archetype))];

console.log(`Found ${uniqueDecks.length} unique Dragapult variants:\n`);

// Count entries for each
for (const deckName of uniqueDecks.sort()) {
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('archetype', deckName);
  
  console.log(`${count?.toString().padStart(4, ' ')} entries: ${deckName}`);
  
  // Check if this has an alias
  const { data: alias } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', deckName);
  
  if (!alias || alias.length === 0) {
    console.log(`     ⚠️  NO ALIAS - needs to be added!`);
  } else {
    // Get archetype name
    const { data: arch } = await supabase
      .from('fantasy_archetypes')
      .select('name')
      .eq('id', alias[0].archetype_id)
      .single();
    console.log(`     ✓ Mapped to: ${arch?.name}`);
  }
}

console.log('\n=== ACTION NEEDED ===');
console.log('Add missing aliases to appropriate archetypes.');
console.log('Dragapult ex / Dusknoir (ID: 27) should get all Dusknoir variants.');

process.exit(0);
