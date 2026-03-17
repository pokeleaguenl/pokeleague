import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Setting Up Curitiba Tournament ===\n');

console.log('Please provide the RK9 tournament ID:');
console.log('1. Go to: https://limitlesstcg.com/tournaments/');
console.log('2. Find "2026 Curitiba Regional Championships"');
console.log('3. Click on it');
console.log('4. Copy the ID from URL (format: ABCD01xxxxxxxxxxxx)');
console.log('');
console.log('Example URL: https://limitlesstcg.com/tournaments/completed/ABCD01xxxxxxxxxxxx');
console.log('Example ID: ABCD01xxxxxxxxxxxx');
console.log('');
console.log('Once you have the ID, we can:');
console.log('1. Update the tournament rk9_id');
console.log('2. Import standings from RK9');
console.log('3. Score all users\' squads');
console.log('');

// Check what other recent tournaments have for reference
console.log('=== Recent Tournament RK9 IDs for Reference ===');
const { data: recent } = await supabase
  .from('tournaments')
  .select('name, rk9_id, event_date')
  .not('rk9_id', 'is', null)
  .order('event_date', { ascending: false })
  .limit(5);

recent?.forEach(t => {
  console.log(`${t.event_date}: ${t.name.substring(0, 40)}...`);
  console.log(`  RK9 ID: ${t.rk9_id}\n`);
});

process.exit(0);
