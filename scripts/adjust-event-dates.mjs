import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Current situation ===');
console.log(`Today: ${new Date().toISOString().split('T')[0]}`);

const { data: events } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .in('id', [21, 22]);

console.log('\nCurrent event dates:');
events?.forEach(e => {
  console.log(`  ${e.id}. ${e.name} - ${e.event_date}`);
});

console.log('\n=== Options ===');
console.log('A) Keep Curitiba as past (March 14) - will test "locked" state');
console.log('B) Move Curitiba to future (e.g., March 28) - will test "unlocked" state');
console.log('');
console.log('Recommendation: Keep as-is to demonstrate lock functionality');
console.log('Since Curitiba (March 14) is in the past, squads SHOULD be locked.');
console.log('This is correct behavior!');

process.exit(0);
