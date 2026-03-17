import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Curitiba Regional ===\n');

// Find the tournament
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('*')
  .ilike('name', '%curitiba%');

if (!tournaments || tournaments.length === 0) {
  console.log('❌ Curitiba tournament not found in database');
  console.log('Need to add it manually to tournaments table');
  process.exit(1);
}

const tournament = tournaments[0];
console.log(`Found: ${tournament.name}`);
console.log(`ID: ${tournament.id}`);
console.log(`Date: ${tournament.event_date}`);
console.log(`Status: ${tournament.status}`);
console.log(`RK9 ID: ${tournament.rk9_id || 'NOT SET'}`);

// Check if we have standings
if (tournament.rk9_id) {
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.rk9_id);
  
  console.log(`\nStandings: ${count || 0} entries`);
  
  if (count && count > 0) {
    console.log('\n✅ Tournament has data! Ready to score.');
    
    // Check if already scored
    const { data: existingScores } = await supabase
      .from('league_scores')
      .select('user_id')
      .eq('tournament_id', tournament.id);
    
    if (existingScores && existingScores.length > 0) {
      console.log(`\n⚠️  Already scored for ${existingScores.length} users`);
      console.log('Do you want to re-score? (will update existing scores)');
    } else {
      console.log('\n🎯 Not yet scored - ready to score all users!');
    }
  } else {
    console.log('\n❌ No standings data yet');
    console.log('Need to import standings from RK9');
  }
} else {
  console.log('\n❌ Tournament has no RK9 ID');
  console.log('Need to set rk9_id in tournaments table');
}

console.log('\n=== Next Steps ===');
if (tournament.rk9_id && count && count > 0) {
  console.log('Run: node scripts/score-curitiba.mjs');
} else {
  console.log('1. Get RK9 tournament ID from limitless');
  console.log('2. Update tournament rk9_id');
  console.log('3. Import standings');
  console.log('4. Then score');
}

process.exit(0);
