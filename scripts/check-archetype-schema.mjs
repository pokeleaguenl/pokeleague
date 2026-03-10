import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check if fantasy_archetypes has any parent/canonical column already
const { data } = await supabase
  .from('fantasy_archetypes')
  .select('*')
  .limit(3);
console.log('fantasy_archetypes columns:', Object.keys(data[0]));

// Check fantasy_archetype_aliases structure
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('*')
  .limit(10);
console.log('\nAlias table sample:', aliases);
console.log('Alias columns:', aliases?.length ? Object.keys(aliases[0]) : 'empty');

// Check decks table columns
const { data: decks } = await supabase
  .from('decks')
  .select('*')
  .limit(2);
console.log('\nDecks columns:', Object.keys(decks[0]));
