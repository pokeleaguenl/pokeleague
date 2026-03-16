import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SLUG = 'mega-absol-box';

console.log(`\n=== Simulating deck detail page for: ${SLUG} ===\n`);

// Step 1: Get archetype
console.log('STEP 1: Get archetype from slug');
const { data: archetype } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug, image_url')
  .eq('slug', SLUG)
  .single();

console.log(`  Found: ${archetype.name} (id: ${archetype.id})`);

// Step 2: Get aggregate stats
console.log('\nSTEP 2: Get aggregate stats');
const { data: aggregateStats } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('points')
  .eq('archetype_id', archetype.id);

const totalPoints = aggregateStats?.reduce((sum, s) => sum + s.points, 0) || 0;
console.log(`  Total points: ${totalPoints}`);

// Step 3: Get tournament breakdown (THIS IS WHAT'S FAILING)
console.log('\nSTEP 3: Get tournament breakdown');
const { data: breakdown } = await supabase
  .from('fantasy_archetype_scores_live')
  .select(`
    points,
    placement,
    fantasy_event_id,
    fantasy_events!inner(
      id,
      tournament_id,
      tournaments!inner(
        name,
        rk9_id
      )
    )
  `)
  .eq('archetype_id', archetype.id)
  .order('fantasy_event_id');

console.log(`  Breakdown results: ${breakdown?.length || 0} tournaments`);

if (breakdown?.length) {
  breakdown.forEach(b => {
    console.log(`    ${b.fantasy_events.tournaments.name}: ${b.points} pts (placement: ${b.placement})`);
  });
} else {
  console.log('  ❌ NO BREAKDOWN DATA - This is the bug!');
  console.log('\n  Trying simpler query...');
  
  const { data: simple, error } = await supabase
    .from('fantasy_archetype_scores_live')
    .select('fantasy_event_id, points, placement')
    .eq('archetype_id', archetype.id);
  
  console.log(`  Simple query result: ${simple?.length || 0} rows`);
  console.log(`  Error:`, error);
}

process.exit(0);
