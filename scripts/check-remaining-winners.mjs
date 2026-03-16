import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check Rajveer Singh
const { data: rajveer } = await supabase
  .from('rk9_standings')
  .select('*')
  .ilike('player_name', 'Rajveer Singh')
  .eq('rank', 1)
  .single();

console.log('\n=== Rajveer Singh ===');
console.log('Decklist URL:', rajveer.decklist_url);
console.log('\nCard list (full):');
console.log(rajveer.card_list?.substring(0, 1000));

// Check Lucas
const { data: lucas } = await supabase
  .from('rk9_standings')
  .select('*')
  .ilike('player_name', 'Lucas Hamilton-Foster')
  .eq('rank', 1)
  .single();

console.log('\n\n=== Lucas Hamilton-Foster ===');
console.log('Decklist URL:', lucas.decklist_url);
console.log('\nCard list (full):');
console.log(lucas.card_list?.substring(0, 1000));

process.exit(0);
