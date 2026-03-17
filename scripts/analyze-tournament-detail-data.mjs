import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Tournament Detail Data ===\n');

// Get a tournament with data
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, event_date, rk9_id')
  .not('rk9_id', 'is', null)
  .order('event_date', { ascending: false })
  .limit(1);

const tournament = tournaments?.[0];

console.log(`Sample Tournament: ${tournament?.name}`);
console.log(`Date: ${tournament?.event_date}`);
console.log(`RK9 ID: ${tournament?.rk9_id}\n`);

// Get standings
const { data: standings, count: totalEntries } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank, country', { count: 'exact' })
  .eq('tournament_id', tournament?.rk9_id)
  .not('archetype', 'eq', 'Unknown')
  .order('rank', { ascending: true });

console.log(`Total entries: ${totalEntries}`);
console.log(`Standings with known decks: ${standings?.length}\n`);

// Meta breakdown
const metaBreakdown = {};
for (const s of standings || []) {
  metaBreakdown[s.archetype] = (metaBreakdown[s.archetype] || 0) + 1;
}

console.log('Meta Breakdown (Top 10):');
Object.entries(metaBreakdown)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([deck, count]) => {
    const pct = ((count / (standings?.length || 1)) * 100).toFixed(1);
    console.log(`  ${deck}: ${count} (${pct}%)`);
  });

// Top finishers
console.log('\nTop 8 Finishers:');
standings?.slice(0, 8).forEach(s => {
  console.log(`  #${s.rank}: ${s.player_name} - ${s.archetype} (${s.country})`);
});

// Top cut stats
const top8 = standings?.filter(s => s.rank <= 8) || [];
const top16 = standings?.filter(s => s.rank <= 16) || [];
const top32 = standings?.filter(s => s.rank <= 32) || [];

console.log('\nTop Cut Distribution:');
console.log(`  Top 8: ${top8.length} players`);
console.log(`  Top 16: ${top16.length} players`);
console.log(`  Top 32: ${top32.length} players`);

console.log('\n=== Tournament Page Features ===');
console.log('1. Tournament header (name, date, location, entries)');
console.log('2. Winner spotlight');
console.log('3. Meta breakdown pie chart');
console.log('4. Top 8/16/32 standings table');
console.log('5. Deck performance stats');
console.log('6. Player links to profiles');

process.exit(0);
