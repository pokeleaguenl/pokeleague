import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== ALL Mega Absol Box scores (archetype_id 2) ===');
const { data: scores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('*')
  .eq('archetype_id', 2)
  .order('fantasy_event_id');

console.log(`Found ${scores?.length || 0} scores`);

if (scores?.length) {
  for (const score of scores) {
    // Get event and tournament name
    const { data: event } = await supabase
      .from('fantasy_events')
      .select('tournament_id')
      .eq('id', score.fantasy_event_id)
      .single();
    
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', event?.tournament_id)
      .single();
    
    console.log(`  Event ${score.fantasy_event_id} (${tournament?.name}): ${score.points} pts, Placement ${score.placement}`);
  }
  
  const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
  console.log(`\n✅ TOTAL POINTS: ${totalPoints}`);
}

process.exit(0);
