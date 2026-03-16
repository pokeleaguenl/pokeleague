import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== CHECK 1: Do we have Absol standings with aliases? ===');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id, archetype, rank')
  .eq('archetype', 'Mega Absol ex / Mega Kangaskhan ex')
  .limit(5);

console.log('Sample standings:', standings?.length || 0);
standings?.forEach(s => console.log(`  ${s.tournament_id} | ${s.archetype} | Rank ${s.rank}`));

console.log('\n=== CHECK 2: Fantasy events linked to tournaments ===');
const { data: events } = await supabase
  .from('fantasy_events')
  .select('id, tournament_id, tournaments(name, rk9_id)')
  .order('id');

console.log(`Total fantasy events: ${events?.length || 0}`);
events?.forEach(e => console.log(`  Event ${e.id} → Tournament ${e.tournament_id} (${e.tournaments?.name})`));

console.log('\n=== CHECK 3: Raw archetype scores (any archetype) ===');
const { data: anyScores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('archetype_id, fantasy_event_id, points')
  .limit(10);

console.log(`Sample scores found: ${anyScores?.length || 0}`);
anyScores?.forEach(s => console.log(`  Archetype ${s.archetype_id} → Event ${s.fantasy_event_id} → ${s.points} pts`));

console.log('\n=== CHECK 4: Does archetype_id 2 appear in raw standings? ===');
const { data: rawCheck } = await supabase.rpc('execute_sql', {
  query: `
    SELECT rs.archetype, COUNT(*) as count
    FROM rk9_standings rs
    JOIN fantasy_archetype_aliases faa ON rs.archetype = faa.alias
    WHERE faa.archetype_id = 2
    GROUP BY rs.archetype
    ORDER BY count DESC
    LIMIT 10
  `
});

console.log('Absol variants in standings:', rawCheck);

process.exit(0);
