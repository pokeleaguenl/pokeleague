import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Understanding lock timing ===\n');

// Get next few events
const { data: events } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .order('event_date', { ascending: true })
  .limit(10);

console.log('Recent/Upcoming events:');
events?.forEach(e => {
  const eventDate = new Date(e.event_date);
  const now = new Date();
  const daysUntil = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
  
  console.log(`  ${e.name}`);
  console.log(`    Date: ${e.event_date} (${daysUntil} days from now)`);
  console.log(`    Status: ${e.status}`);
  console.log('');
});

console.log('Question: When should squads lock?');
console.log('Options:');
console.log('  A) 24 hours before event_date');
console.log('  B) At midnight (00:00) on event_date');
console.log('  C) When event status changes to "live"');
console.log('  D) Manual lock by admin');

process.exit(0);
