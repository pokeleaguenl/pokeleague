import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { count: total } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true });

const { count: withMeta } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true })
  .gt('meta_share', 0);

const { count: nullMeta } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true })
  .is('meta_share', null);

console.log(`Total decks: ${total}`);
console.log(`meta_share > 0: ${withMeta}`);
console.log(`meta_share IS NULL: ${nullMeta}`);

// Sample some variant decks
const { data } = await supabase
  .from('decks')
  .select('id, name, meta_share, cost, tier')
  .order('id', { ascending: false })
  .limit(10);
console.table(data);
