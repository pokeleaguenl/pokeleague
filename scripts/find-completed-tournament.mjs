import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding Completed Tournament with Data ===\n');

// Get tournaments with status 'completed'
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date, status')
  .eq('status', 'completed')
  .order('event_date', { ascending: false })
  .limit(5);

console.log(`Recent completed tournaments: ${tournaments?.length || 0}\n`);

for (const tournament of tournaments || []) {
  // Count standings
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id);
  
  console.log(`${tournament.name} (${tournament.event_date})`);
  console.log(`  Standings: ${count || 0}`);
  
  if (count && count > 0) {
    // Get sample data
    const { data: sample } = await supabase
      .from('rk9_standings')
      .select('archetype, rank')
      .eq('tournament_id', tournament.id)
      .not('archetype', 'eq', 'Unknown')
      .order('rank', { ascending: true })
      .limit(10);
    
    console.log(`  Top 10 decks:`);
    sample?.forEach(s => console.log(`    #${s.rank}: ${s.archetype}`));
  }
  console.log('');
}

console.log('=== Will use tournament with data for matchup analysis ===');

process.exit(0);
