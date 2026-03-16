import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Charizard Data ===\n');

// Get the archetype
const { data: archetype } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .eq('slug', 'charizard-ex-pidgeot-ex')
  .single();

console.log(`Archetype: ${archetype?.name} (id: ${archetype?.id})\n`);

// Get aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', archetype.id);

console.log(`Aliases (${aliases?.length}):`);
aliases?.forEach(a => console.log(`  - "${a.alias}"`));

// Get standings
const aliasStrings = aliases?.map(a => a.alias) || [];
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id, archetype, rank')
  .in('archetype', aliasStrings)
  .limit(10);

console.log(`\nStandings found: ${standings?.length || 0}`);
standings?.slice(0, 5).forEach(s => {
  console.log(`  Tournament: ${s.tournament_id}, Deck: ${s.archetype}, Rank: ${s.rank}`);
});

// Count by tournament
const byTournament = {};
for (const s of standings || []) {
  if (!byTournament[s.tournament_id]) byTournament[s.tournament_id] = 0;
  byTournament[s.tournament_id]++;
}

console.log(`\nUnique tournaments: ${Object.keys(byTournament).length}`);

// Get top 5 archetypes instead
console.log('\n=== Top 5 Archetypes for Testing ===\n');

const { data: topDecks } = await supabase
  .rpc('get_deck_list_with_points')
  .limit(5);

topDecks?.forEach(d => {
  console.log(`  ${d.deck_name} (${d.meta_share}% meta, ${d.total_points} pts)`);
});

process.exit(0);
