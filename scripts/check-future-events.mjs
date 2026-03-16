import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking for future events ===\n');

const today = new Date().toISOString().split('T')[0];
console.log(`Today: ${today}`);

const { data: futureEvents } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .gte('event_date', today)
  .order('event_date', { ascending: true });

console.log(`\nFuture events: ${futureEvents?.length || 0}`);
futureEvents?.forEach(e => {
  console.log(`  ${e.name} - ${e.event_date} (${e.status})`);
});

// Check tournaments table for upcoming
const { data: upcomingTournaments } = await supabase
  .from('tournaments')
  .select('id, name, status')
  .eq('status', 'upcoming')
  .order('id');

console.log(`\nUpcoming tournaments: ${upcomingTournaments?.length || 0}`);
upcomingTournaments?.forEach(t => {
  console.log(`  ${t.id}. ${t.name} (${t.status})`);
});

console.log('\n=== Recommended lock strategy ===');
console.log('Since you have upcoming tournaments (Curitiba, Houston),');
console.log('the lock should happen:');
console.log('');
console.log('✅ Option B: Lock at midnight (00:00 UTC) on event_date');
console.log('   - Clear deadline for users');
console.log('   - Easy to communicate');
console.log('   - Prevents last-minute changes during event');
console.log('');
console.log('Implementation:');
console.log('  1. Add lock_deadline to fantasy_events (defaults to event_date 00:00 UTC)');
console.log('  2. Check lock_deadline in POST /api/squad');
console.log('  3. Return error if past deadline');
console.log('  4. Show countdown timer on squad page');

process.exit(0);
