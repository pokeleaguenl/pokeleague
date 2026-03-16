import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing squad lock logic ===\n');

// Simulate the lock check
const now = new Date();
const today = now.toISOString().split('T')[0];

console.log(`Current time: ${now.toISOString()}`);
console.log(`Current date: ${today}\n`);

// Get next upcoming event
const { data: nextEvent } = await supabase
  .from('fantasy_events')
  .select('id, name, event_date, status')
  .gte('event_date', today)
  .order('event_date', { ascending: true })
  .limit(1)
  .single();

if (!nextEvent) {
  console.log('❌ No upcoming events found');
  console.log('Result: Squads are NOT locked (no events to lock for)');
} else {
  console.log(`Next event: ${nextEvent.name}`);
  console.log(`Event date: ${nextEvent.event_date}`);
  console.log(`Event status: ${nextEvent.status}\n`);
  
  const lockTime = new Date(`${nextEvent.event_date}T00:00:00.000Z`);
  console.log(`Lock deadline: ${lockTime.toISOString()}`);
  console.log(`Lock deadline (UTC): ${lockTime.toUTCString()}\n`);
  
  const isLocked = now >= lockTime;
  const timeRemaining = lockTime.getTime() - now.getTime();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (isLocked) {
    console.log('🔒 SQUADS ARE LOCKED');
    console.log(`Reason: Past the ${nextEvent.name} deadline`);
  } else {
    console.log('✅ SQUADS ARE OPEN');
    console.log(`Time until lock: ${daysRemaining} days, ${hoursRemaining} hours`);
  }
}

console.log('\n');
process.exit(0);
