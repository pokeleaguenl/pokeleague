import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: scores, error } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('*')
  .limit(5);

console.log('Sample rows:', scores);
console.log('Error:', error);

const { count } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('*', { count: 'exact', head: true });
console.log('Total rows:', count);

const { data: events } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('fantasy_event_id')
  .limit(100);
const uniqueEvents = [...new Set(events?.map(e => e.fantasy_event_id))];
console.log('Event IDs present:', uniqueEvents);
