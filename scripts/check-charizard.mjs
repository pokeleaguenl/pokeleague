import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: decks } = await supabase
  .from('decks')
  .select('id, name, image_url, limitless_id')
  .ilike('name', '%charizard%');

console.log('Decks with charizard:');
console.table(decks);

const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug, image_url')
  .ilike('name', '%charizard%');

console.log('\nArchetypes with charizard:');
console.table(archetypes);
