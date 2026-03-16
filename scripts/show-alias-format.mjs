import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Sample of WORKING aliases (archetype_id 1) ===');
const { data: working } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 1)
  .limit(10);

working?.forEach(a => console.log(`  "${a.alias}"`));

console.log('\n=== Our BROKEN Absol aliases ===');
const { data: broken } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 2)
  .limit(10);

broken?.forEach(a => console.log(`  "${a.alias}"`));

console.log('\n=== How rk9_standings stores archetypes ===');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', '%absol%')
  .limit(5);

standings?.forEach(s => console.log(`  "${s.archetype}"`));

process.exit(0);
