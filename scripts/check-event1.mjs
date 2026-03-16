import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: event1 } = await supabase
  .from('fantasy_events')
  .select('*')
  .eq('id', 1)
  .single();
console.log('Event 1:', event1);

const { data: scores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('archetype_id, points, fantasy_event_id')
  .eq('fantasy_event_id', 1)
  .order('points', { ascending: false })
  .limit(5);

const ids = scores.map(s => s.archetype_id);
const { data: archs } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .in('id', ids);

console.log('\nTop scores event 1:');
scores.forEach(s => {
  const arch = archs.find(a => a.id === s.archetype_id);
  console.log(`  ${arch?.name}: ${s.points}pts`);
});
