import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Squad Schema ===\n');

// Check squads table
console.log('1. Squads table:');
const { data: squads } = await supabase
  .from('squads')
  .select('*')
  .limit(1);

if (squads && squads.length > 0) {
  console.log('Columns:', Object.keys(squads[0]));
} else {
  console.log('No squads found, checking structure...');
  const { error } = await supabase.from('squads').select('*').limit(0);
  console.log('Error:', error?.message || 'Table exists but is empty');
}

// Check squad_decks table
console.log('\n2. Squad_decks table:');
const { data: squadDecks } = await supabase
  .from('squad_decks')
  .select('*')
  .limit(1);

if (squadDecks && squadDecks.length > 0) {
  console.log('Columns:', Object.keys(squadDecks[0]));
} else {
  console.log('No squad_decks found');
}

// Try different query approaches
console.log('\n3. Testing different query patterns:');

// Pattern A: Direct join
const { data: testA, error: errorA } = await supabase
  .from('squads')
  .select('*, squad_decks(*)')
  .limit(1);

console.log('Pattern A (squads with squad_decks):', errorA ? `❌ ${errorA.message}` : '✅ Works');

// Pattern B: Get squads then decks separately
const { data: testB } = await supabase
  .from('squads')
  .select('id')
  .limit(1);

if (testB && testB.length > 0) {
  const { data: decks, error: errorB } = await supabase
    .from('squad_decks')
    .select('*')
    .eq('squad_id', testB[0].id);
  
  console.log('Pattern B (separate queries):', errorB ? `❌ ${errorB.message}` : `✅ Works (${decks?.length || 0} decks)`);
}

// Check fantasy_archetypes
console.log('\n4. Fantasy archetypes:');
const { count } = await supabase
  .from('fantasy_archetypes')
  .select('*', { count: 'exact', head: true });

console.log(`Total archetypes: ${count}`);

process.exit(0);
