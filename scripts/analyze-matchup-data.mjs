import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Matchup Data ===\n');

// The challenge: We don't have direct match records (Game 1, 2, 3 results)
// But we can infer relative performance by comparing final standings within tournaments

// Get a sample tournament
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name')
  .limit(1);

const tournament = tournaments?.[0];

console.log(`Sample tournament: ${tournament?.name}\n`);

// Get standings for this tournament
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank')
  .eq('tournament_id', tournament?.id)
  .not('archetype', 'eq', 'Unknown')
  .order('rank', { ascending: true })
  .limit(50);

console.log(`Players in top 50: ${standings?.length || 0}`);

// Count decks
const deckCounts = {};
for (const s of standings || []) {
  deckCounts[s.archetype] = (deckCounts[s.archetype] || 0) + 1;
}

console.log(`\nUnique decks in top 50:`);
Object.entries(deckCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([deck, count]) => {
    console.log(`  ${deck}: ${count} players`);
  });

console.log('\n=== Approach for Matchup Analysis ===\n');
console.log('Since we don\'t have game-by-game results, we\'ll use:');
console.log('1. PLACEMENT COMPARISON:');
console.log('   - Within each tournament, compare avg rank of Deck A vs Deck B');
console.log('   - If Deck A consistently places higher, it likely has advantage');
console.log('');
console.log('2. TOP CUT RATE COMPARISON:');
console.log('   - Compare % of Deck A that make top 8/16/32');
console.log('   - Higher cut rate when both present = possible advantage');
console.log('');
console.log('3. SAMPLE SIZE REQUIREMENT:');
console.log('   - Only show matchups where both decks appeared in 3+ tournaments together');
console.log('   - This ensures statistical significance');

console.log('\n=== Implementation Plan ===');
console.log('1. Create /matchups page');
console.log('2. Select two decks to compare');
console.log('3. Show head-to-head stats across all tournaments');
console.log('4. Display confidence based on sample size');

process.exit(0);
