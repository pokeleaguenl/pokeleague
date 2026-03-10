import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('decks')
  .select('archetype_id, name')
  .not('image_url', 'is', null)
  .order('archetype_id');

console.table(data);
