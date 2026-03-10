import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// How many archetypes have meaningful Stuttgart data?
const { data } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('archetype_id, points, fantasy_event_id')
  .eq('fantasy_event_id', 8)
  .order('points', { ascending: false });

console.log(`Stuttgart archetypes with scores: ${data?.length}`);

// Cross reference with archetype names
const ids = data?.map(s => s.archetype_id) || [];
const { data: archs } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, canonical_id')
  .in('id', ids)
  .is('canonical_id', null); // Only canonicals

console.log(`\nCanonical archetypes with Stuttgart data: ${archs?.length}`);
console.table(archs?.map(a => ({ id: a.id, name: a.name })));

// How many rk9_standings archetypes exist for Stuttgart?
const { data: rk9 } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .eq('tournament_id', 'SG0167ss5UCjklsDaPrA')
  .not('archetype', 'is', null);

const uniqueArchetypes = [...new Set(rk9?.map(r => r.archetype))];
console.log(`\nUnique archetypes in Stuttgart RK9 standings: ${uniqueArchetypes.length}`);
console.log(uniqueArchetypes.sort().join('\n'));
