import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Verifying Tournament Breakdown Integration ===\n');

// Test Charizard ex / Pidgeot ex (should have data)
const archetype = { id: 26, slug: 'charizard-ex-pidgeot-ex', name: 'Charizard ex / Pidgeot ex' };

// Simulate what the component does
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', archetype.id);

console.log(`Testing: ${archetype.name}`);
console.log(`Aliases found: ${aliases?.length || 0}`);

if (aliases && aliases.length > 0) {
  const aliasStrings = aliases.map(a => a.alias);
  console.log(`Alias strings:`, aliasStrings);
  
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('tournament_id, rank, player_name, archetype')
    .in('archetype', aliasStrings)
    .not('rank', 'is', null)
    .limit(10);
  
  console.log(`\nStandings found: ${standings?.length || 0}`);
  if (standings && standings.length > 0) {
    console.log('Sample standing:', standings[0]);
    
    // Group by tournament
    const tournamentGroups = standings.reduce((acc, s) => {
      if (!acc[s.tournament_id]) acc[s.tournament_id] = [];
      acc[s.tournament_id].push(s);
      return acc;
    }, {});
    
    console.log(`\nTournaments represented: ${Object.keys(tournamentGroups).length}`);
  }
}

console.log('\n=== Component should be working for this deck ===\n');
console.log('If not showing on live site, issue is likely:');
console.log('1. Component not imported/rendered on page');
console.log('2. CSS/styling issue hiding it');
console.log('3. Client-side rendering issue');

process.exit(0);
