import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Leagues Database Schema ===\n');

// Get sample league
const { data: leagues } = await supabase
  .from('leagues')
  .select('*')
  .limit(1);

if (leagues && leagues.length > 0) {
  console.log('League fields:');
  console.log(Object.keys(leagues[0]));
  console.log('\nSample league:');
  console.log(leagues[0]);
}

// Check league_members
const { data: members } = await supabase
  .from('league_members')
  .select('*')
  .limit(1);

if (members && members.length > 0) {
  console.log('\n\nLeague Members fields:');
  console.log(Object.keys(members[0]));
  console.log('\nSample member:');
  console.log(members[0]);
}

// Count total leagues and members
const { count: leagueCount } = await supabase
  .from('leagues')
  .select('*', { count: 'exact', head: true });

const { count: memberCount } = await supabase
  .from('league_members')
  .select('*', { count: 'exact', head: true });

console.log(`\n\nTotal leagues: ${leagueCount}`);
console.log(`Total league members: ${memberCount}`);

process.exit(0);
