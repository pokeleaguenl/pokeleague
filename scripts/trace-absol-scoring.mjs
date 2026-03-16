import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Manual scoring check for Stuttgart (Event 8, Tournament 8) ===');

// Get Stuttgart fantasy event
const { data: event } = await supabase
  .from('fantasy_events')
  .select('id, tournament_id')
  .eq('id', 8)
  .single();

console.log(`Event ${event.id} → Tournament ${event.tournament_id}`);

// Get tournament rk9_id
const { data: tournament } = await supabase
  .from('tournaments')
  .select('rk9_id, name')
  .eq('id', event.tournament_id)
  .single();

console.log(`Tournament: ${tournament.name}`);
console.log(`RK9 ID: ${tournament.rk9_id}`);

// Get Absol aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 2);

console.log(`\nChecking ${aliases.length} aliases...`);

// Get standings for this tournament matching any alias
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype, rank, player_name')
  .eq('tournament_id', tournament.rk9_id)
  .in('archetype', aliases.map(a => a.alias))
  .order('rank');

console.log(`\nFound ${standings?.length || 0} Absol decks in Stuttgart`);

if (standings?.length) {
  console.log('\nTop 10 placements:');
  standings.slice(0, 10).forEach(s => {
    console.log(`  Rank ${s.rank}: ${s.player_name} - ${s.archetype}`);
  });
  
  // Calculate points manually
  const points = standings.reduce((sum, s) => {
    const rank = s.rank;
    if (rank === 1) return sum + 10;
    if (rank === 2) return sum + 8;
    if (rank <= 4) return sum + 6;
    if (rank <= 8) return sum + 4;
    if (rank <= 16) return sum + 2;
    if (rank <= 32) return sum + 1;
    return sum;
  }, 0);
  
  console.log(`\nManually calculated points: ${points}`);
}

// Check if score exists in DB
const { data: existingScore } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('*')
  .eq('archetype_id', 2)
  .eq('fantasy_event_id', 8)
  .single();

console.log('\nExisting score in DB:', existingScore || 'NOT FOUND');

process.exit(0);
