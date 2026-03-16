import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking deck data structure ===\n');

const { data: decks } = await supabase.rpc("get_deck_list_with_points");

if (decks && decks.length > 0) {
  console.log('Sample deck object:');
  console.log(JSON.stringify(decks[0], null, 2));
  console.log('\nKeys:', Object.keys(decks[0]));
}

process.exit(0);
