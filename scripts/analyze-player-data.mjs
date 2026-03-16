import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Player Data ===\n');

// Get a sample player from standings
const { data: sampleStanding } = await supabase
  .from('rk9_standings')
  .select('player_name, country')
  .not('player_name', 'is', null)
  .limit(1)
  .single();

console.log(`Sample player: ${sampleStanding?.player_name} (${sampleStanding?.country})\n`);

// Check what data we have for players
const { data: playerStandings } = await supabase
  .from('rk9_standings')
  .select('tournament_id, archetype, rank, player_name, country')
  .eq('player_name', sampleStanding?.player_name)
  .order('rank', { ascending: true });

console.log(`Tournament appearances: ${playerStandings?.length || 0}`);

if (playerStandings && playerStandings.length > 0) {
  console.log('\nSample entries:');
  playerStandings.slice(0, 5).forEach(s => {
    console.log(`  - ${s.archetype} (#${s.rank})`);
  });
}

// Get tournament info
const tournamentIds = [...new Set(playerStandings?.map(s => s.tournament_id))];
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date')
  .in('id', tournamentIds);

console.log(`\nTournaments: ${tournaments?.length || 0}`);
tournaments?.slice(0, 3).forEach(t => {
  console.log(`  - ${t.name} (${t.event_date})`);
});

console.log('\n=== Player Profile Data Available ===');
console.log('✅ Player name');
console.log('✅ Country');
console.log('✅ Tournament history (tournaments, placements, decks)');
console.log('✅ Best finish');
console.log('✅ Total entries');
console.log('✅ Favorite decks (most used archetypes)');
console.log('✅ Top 8/16/32 count');

console.log('\n=== URL Structure ===');
console.log('Proposal: /players/[name-slug]');
console.log('Example: /players/rocky-barr');

process.exit(0);
