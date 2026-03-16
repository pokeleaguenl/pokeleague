import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing Tournament Breakdown Data for Different Decks ===\n');

// Get a few different archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .in('id', [1, 2, 26, 27, 31]) // Charizard, Mega Absol, Charizard/Pidgeot, Dragapult, Gholdengo
  .order('id');

for (const archetype of archetypes || []) {
  // Get aliases
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetype.id);
  
  if (!aliases || aliases.length === 0) {
    console.log(`❌ ${archetype.name} (id: ${archetype.id})`);
    console.log(`   No aliases found\n`);
    continue;
  }
  
  // Get standings
  const aliasStrings = aliases.map(a => a.alias);
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('tournament_id')
    .in('archetype', aliasStrings);
  
  const uniqueTournaments = new Set(standings?.map(s => s.tournament_id));
  
  console.log(`${uniqueTournaments.size > 0 ? '✅' : '⚠️'} ${archetype.name} (id: ${archetype.id})`);
  console.log(`   Aliases: ${aliases.length}`);
  console.log(`   Standings entries: ${standings?.length || 0}`);
  console.log(`   Tournaments: ${uniqueTournaments.size}`);
  console.log(`   Slug: /decks/${archetype.slug}\n`);
}

process.exit(0);
