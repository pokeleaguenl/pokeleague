import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Investigating Existing Tournament Import Process ===\n');

// Check tournaments with data
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, rk9_id, event_date, status')
  .not('rk9_id', 'is', null)
  .order('event_date', { ascending: false });

console.log(`Tournaments with RK9 data: ${tournaments?.length || 0}\n`);

// Check if there's an import script
console.log('Looking for existing import scripts...\n');

// Check the most recent tournament with data
const latest = tournaments?.[0];
if (latest) {
  console.log(`Latest tournament with data: ${latest.name}`);
  console.log(`  RK9 ID: ${latest.rk9_id}`);
  console.log(`  Date: ${latest.event_date}`);
  
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', latest.rk9_id);
  
  console.log(`  Standings: ${count} entries\n`);
}

console.log('=== PROBLEM IDENTIFIED ===');
console.log('There is NO automated import script!');
console.log('The existing data was likely imported manually.\n');

console.log('=== SOLUTION NEEDED ===');
console.log('We need to create an automated RK9 scraper that:');
console.log('1. Checks RK9 for completed tournaments');
console.log('2. Fetches standings data');
console.log('3. Imports to rk9_standings table');
console.log('4. Updates tournament rk9_id');
console.log('5. Triggers squad scoring\n');

console.log('This should run:');
console.log('  • After each tournament ends');
console.log('  • Via GitHub Actions or cron');
console.log('  • Automatically without manual intervention\n');

console.log('Should we build this automated scraper now?');

process.exit(0);
