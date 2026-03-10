import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { count: withImage } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true })
  .not('image_url', 'is', null);

const { count: withLimitless } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true })
  .not('limitless_id', 'is', null);

const { count: both } = await supabase
  .from('decks')
  .select('*', { count: 'exact', head: true })
  .not('image_url', 'is', null)
  .not('limitless_id', 'is', null);

console.log(`With image_url: ${withImage}`);
console.log(`With limitless_id: ${withLimitless}`);
console.log(`With both: ${both}`);
