import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const { data, error } = await supabase.rpc('get_deck_list_with_points');
console.log('Error:', error);
console.log('Row count:', data?.length);
console.table(data?.slice(0,8).map(d => ({ name: d.deck_name, pts: d.total_points, tier: d.tier })));
