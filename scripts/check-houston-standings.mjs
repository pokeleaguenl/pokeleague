import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact' })
    .eq('tournament_id', 'HO01w20W3tGb1aAsLzwS');
  
  console.log(`Total Houston standings in DB: ${count}`);
  console.log(`Sample of top 10:`);
  data.slice(0, 10).forEach(s => {
    console.log(`  ${s.rank}. ${s.player_name} - ${s.archetype}`);
  });
}

check();
