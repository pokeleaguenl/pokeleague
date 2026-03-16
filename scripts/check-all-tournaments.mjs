import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('tournaments')
  .select('id, name, date, rk9_id, location')
  .gte('date', '2025-01-01')
  .order('date', { ascending: true });

console.table(data);
