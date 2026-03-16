import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking fantasy_events schema ===');

const { data: events } = await supabase
  .from('fantasy_events')
  .select('*')
  .limit(1);

if (events && events.length > 0) {
  console.log('\nFields in fantasy_events:');
  console.log(Object.keys(events[0]));
  console.log('\nSample event:');
  console.log(events[0]);
}

console.log('\n=== Checking fantasy_squads schema ===');

const { data: squads } = await supabase
  .from('fantasy_squads')
  .select('*')
  .limit(1);

if (squads && squads.length > 0) {
  console.log('\nFields in fantasy_squads:');
  console.log(Object.keys(squads[0]));
  console.log('\nSample squad:');
  console.log(squads[0]);
}

process.exit(0);
