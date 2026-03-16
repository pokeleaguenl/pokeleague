import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('decks')
  .select('id, name, tier, cost, meta_share')
  .gte('meta_share', 0.5)
  .order('meta_share', { ascending: false });

console.table(data?.map(d => ({ id: d.id, name: d.name, tier: d.tier, cost: d.cost, meta: d.meta_share + '%' })));
