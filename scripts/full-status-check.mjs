import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fullCheck() {
  console.log('📊 POKELEAGUE STATUS CHECK\n');
  console.log('='.repeat(80));
  
  // Check tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('event_date', { ascending: false })
    .limit(3);
  
  console.log('\n📅 Recent Tournaments:');
  for (const t of tournaments) {
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', t.rk9_id);
    
    console.log(`\n  ${t.name}`);
    console.log(`    Date: ${t.event_date}`);
    console.log(`    RK9: ${t.rk9_id}`);
    console.log(`    Standings imported: ${count || 0} players`);
  }
  
  // Check tournament scores
  const { data: scores } = await supabase
    .from('tournament_scores')
    .select('tournament_id, points_earned')
    .order('created_at', { ascending: false });
  
  console.log('\n\n🏆 Tournament Score History:');
  const scoresByTournament = {};
  scores.forEach(s => {
    if (!scoresByTournament[s.tournament_id]) {
      scoresByTournament[s.tournament_id] = [];
    }
    scoresByTournament[s.tournament_id].push(s.points_earned);
  });
  
  for (const [tid, points] of Object.entries(scoresByTournament)) {
    const t = tournaments.find(t => t.id === parseInt(tid));
    console.log(`\n  ${t?.name || `Tournament ${tid}`}:`);
    console.log(`    ${points.length} squads scored`);
    console.log(`    Total points awarded: ${points.reduce((a, b) => a + b, 0)}`);
    console.log(`    Points: ${points.join(', ')}`);
  }
  
  // Check squads
  const { data: squads } = await supabase
    .from('squads')
    .select('user_id, total_points');
  
  console.log('\n\n👥 Squad Totals:');
  squads.forEach((s, i) => {
    console.log(`  Squad ${i + 1}: ${s.total_points || 0} points`);
  });
  
  // Check profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('display_name, total_points')
    .order('total_points', { ascending: false });
  
  console.log('\n\n🏅 Leaderboard:');
  profiles.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.display_name || 'Anonymous'}: ${p.total_points || 0} points`);
  });
  
  console.log('\n' + '='.repeat(80));
}

fullCheck();
