import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date, status')
  .order('event_date', { ascending: false })
  .limit(10);

console.log('Tournaments:');
console.table(tournaments);

const { data: fantasyEvents } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status, tournament_id')
  .order('event_date', { ascending: false })
  .limit(10);

console.log('\nFantasy events:');
console.table(fantasyEvents);
