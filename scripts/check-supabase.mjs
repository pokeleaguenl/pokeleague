import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { count } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true });

console.log(`rk9_standings: ${count} rows`);

// Top 10 by rank
const { data } = await supabase
  .from('rk9_standings')
  .select('rank, player_name, archetype, country')
  .eq('tournament_id', 'SG0167ss5UCjklsDaPrA')
  .not('rank', 'is', null)
  .order('rank', { ascending: true })
  .limit(10);

console.log('\nTop 10:');
console.table(data);
