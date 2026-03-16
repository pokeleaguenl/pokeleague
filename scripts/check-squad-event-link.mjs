import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking squad schema ===');

const { data: squads } = await supabase
  .from('squads')
  .select('*')
  .limit(3);

if (squads && squads.length > 0) {
  console.log('\nFields in squads table:');
  console.log(Object.keys(squads[0]));
  console.log('\nSample squad:');
  console.log(squads[0]);
}

console.log('\n=== Checking fantasy_squads table ===');

const { data: fantasySquads } = await supabase
  .from('fantasy_squads')
  .select('*')
  .limit(3);

if (fantasySquads && fantasySquads.length > 0) {
  console.log('\nFields in fantasy_squads:');
  console.log(Object.keys(fantasySquads[0]));
  console.log('\nSample fantasy_squad:');
  console.log(fantasySquads[0]);
} else {
  console.log('\nNo fantasy_squads found or table does not exist');
}

console.log('\n=== Checking upcoming events ===');

const { data: upcomingEvents } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .gte('event_date', new Date().toISOString().split('T')[0])
  .order('event_date', { ascending: true })
  .limit(5);

console.log('\nUpcoming events:');
upcomingEvents?.forEach(e => {
  console.log(`  ${e.name} - ${e.event_date} (${e.status})`);
});

process.exit(0);
