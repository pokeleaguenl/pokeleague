import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Creating fantasy events for upcoming tournaments ===\n');

// Get upcoming tournaments
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('*')
  .eq('status', 'upcoming')
  .order('id');

console.log(`Found ${tournaments?.length || 0} upcoming tournaments:\n`);

for (const tournament of tournaments || []) {
  console.log(`${tournament.id}. ${tournament.name}`);
  
  // Check if fantasy event already exists
  const { data: existing } = await supabase
    .from('fantasy_events')
    .select('id')
    .eq('tournament_id', tournament.id)
    .single();
  
  if (existing) {
    console.log('  ⏭️  Fantasy event already exists (id: ' + existing.id + ')');
    continue;
  }
  
  // Create fantasy event
  // We need an event_date - let's use a reasonable date for these tournaments
  let eventDate;
  if (tournament.name.includes('Curitiba')) {
    eventDate = '2026-03-14'; // March 14, 2026
  } else if (tournament.name.includes('Houston')) {
    eventDate = '2026-03-21'; // March 21, 2026
  } else {
    eventDate = '2026-04-01'; // Default
  }
  
  const { data: newEvent, error } = await supabase
    .from('fantasy_events')
    .insert({
      tournament_id: tournament.id,
      name: tournament.name,
      event_date: eventDate,
      status: 'upcoming',
    })
    .select()
    .single();
  
  if (error) {
    console.log('  ❌ Error creating event:', error.message);
  } else {
    console.log(`  ✅ Created fantasy event (id: ${newEvent.id}, date: ${eventDate})`);
  }
}

console.log('\n=== Verifying upcoming events ===\n');

const { data: upcomingEvents } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .eq('status', 'upcoming')
  .order('event_date', { ascending: true });

console.log(`Upcoming fantasy events: ${upcomingEvents?.length || 0}\n`);
upcomingEvents?.forEach(e => {
  console.log(`  ${e.name} - ${e.event_date}`);
});

console.log('\n');
process.exit(0);
