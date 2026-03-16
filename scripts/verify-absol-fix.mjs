import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== MEGA ABSOL BOX - ALIASES COUNT ===');
const { data: aliases, count } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias', { count: 'exact' })
  .eq('archetype_id', 2);

console.log(`Total aliases: ${count}`);

console.log('\n=== MEGA ABSOL BOX - TOURNAMENT BREAKDOWN ===');
const { data: scores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select(`
    points,
    fantasy_events!inner(
      tournaments!inner(name)
    )
  `)
  .eq('archetype_id', 2)
  .order('fantasy_events(tournaments(name))');

if (scores?.length) {
  scores.forEach(s => {
    console.log(`  ${s.fantasy_events.tournaments.name}: ${s.points} pts`);
  });
} else {
  console.log('  No scores found yet - scoring may still be running');
}

process.exit(0);
