import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// What decks does the admin panel show? Probably all decks ordered by meta_share
const { data } = await supabase
  .from('decks')
  .select('id, name, tier, meta_share, cost, archetype_id')
  .order('meta_share', { ascending: false })
  .limit(20);

console.table(data);
