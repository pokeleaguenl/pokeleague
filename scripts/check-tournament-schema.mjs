import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('tournaments')
  .select('*')
  .limit(3);

console.log('Columns:', data?.length ? Object.keys(data[0]) : 'no data');
console.table(data);
