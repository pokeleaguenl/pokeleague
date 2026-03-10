import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('decks')
  .select('id, name, image_url, limitless_id')
  .ilike('name', '%charizard%pidgeot%')
  .single();

console.log(data);
