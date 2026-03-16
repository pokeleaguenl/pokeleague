import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Meta Timeline Data ===\n');

// Get all tournaments with dates
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date, status')
  .order('event_date', { ascending: true });

console.log(`Total tournaments: ${tournaments?.length || 0}`);
console.log(`Date range: ${tournaments?.[0]?.event_date} to ${tournaments?.[tournaments.length - 1]?.event_date}\n`);

// Get a sample archetype to test with
const testArchetype = 'Charizard ex / Pidgeot ex';

console.log(`Testing with: ${testArchetype}\n`);

// Get aliases for this archetype
const { data: archetype } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .eq('name', testArchetype)
  .single();

if (archetype) {
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', archetype.id);

  console.log(`Aliases: ${aliases?.length || 0}`);

  if (aliases && aliases.length > 0) {
    // Get standings per tournament
    const aliasStrings = aliases.map(a => a.alias);
    
    const { data: standings } = await supabase
      .from('rk9_standings')
      .select('tournament_id, archetype')
      .in('archetype', aliasStrings);

    // Group by tournament
    const byTournament = {};
    for (const s of standings || []) {
      if (!byTournament[s.tournament_id]) byTournament[s.tournament_id] = 0;
      byTournament[s.tournament_id]++;
    }

    console.log('\nEntries per tournament:');
    
    // Sort tournaments by date and show counts
    const tournamentCounts = tournaments
      ?.map(t => ({
        date: t.event_date,
        name: t.name,
        entries: byTournament[t.id] || 0
      }))
      .filter(t => t.entries > 0)
      .slice(0, 10);

    tournamentCounts?.forEach(t => {
      console.log(`  ${t.date} - ${t.name}: ${t.entries} entries`);
    });

    console.log('\n=== Data Structure for Chart ===');
    console.log('X-axis: Tournament dates');
    console.log('Y-axis: Entry count or meta %');
    console.log('Lines: Different archetypes');
  }
}

console.log('\n=== Implementation Plan ===');
console.log('1. Create meta-timeline page at /meta');
console.log('2. Fetch top N archetypes');
console.log('3. Get entry counts per tournament for each');
console.log('4. Use Chart.js or Recharts for visualization');
console.log('5. Allow toggling archetypes on/off');

process.exit(0);
