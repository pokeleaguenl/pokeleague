import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('tournaments')
  .select('id, name, event_date, rk9_id, status')
  .gte('event_date', '2025-01-01')
  .order('event_date', { ascending: true });

console.table(data);

// Also check which ones already have rk9_standings ingested
const { data: ingested } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .limit(1000);

const ingestedIds = [...new Set(ingested?.map(s => s.tournament_id))];
console.log('\nAlready ingested RK9 IDs:', ingestedIds);
