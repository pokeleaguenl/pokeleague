import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check what columns decks table has
const { data } = await supabase
  .from('decks')
  .select('*')
  .eq('id', 1)
  .single();

console.log('Decks table columns:', Object.keys(data));
console.log('Sample row:', data);
