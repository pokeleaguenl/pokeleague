import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Complete Missing Deck Analysis ===\n');

// Get all unique decks from standings
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .not('archetype', 'eq', 'Unknown');

const uniqueDecks = [...new Set(standings?.map(s => s.archetype))];

console.log(`Total unique decks in standings: ${uniqueDecks.length}`);

// Check which ones are missing
const missing = [];

for (const deckName of uniqueDecks) {
  const { data: alias } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', deckName);
  
  if (!alias || alias.length === 0) {
    // Get count
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .eq('archetype', deckName);
    
    missing.push({ name: deckName, count: count || 0 });
  }
}

missing.sort((a, b) => b.count - a.count);

console.log(`\nDecks WITHOUT aliases: ${missing.length}\n`);

// Group by entry count
const groups = {
  high: missing.filter(d => d.count >= 5),
  medium: missing.filter(d => d.count >= 2 && d.count < 5),
  low: missing.filter(d => d.count === 1)
};

console.log('=== HIGH PRIORITY (5+ entries) ===');
console.log(`Count: ${groups.high.length}\n`);
groups.high.forEach(d => {
  console.log(`  ${d.count.toString().padStart(3, ' ')} - ${d.name}`);
});

console.log('\n=== MEDIUM PRIORITY (2-4 entries) ===');
console.log(`Count: ${groups.medium.length}\n`);
groups.medium.forEach(d => {
  console.log(`  ${d.count.toString().padStart(3, ' ')} - ${d.name}`);
});

console.log('\n=== LOW PRIORITY (1 entry) ===');
console.log(`Count: ${groups.low.length}`);
console.log('(Not shown - one-off builds)\n');

console.log('=== PLAN TO 100% ===');
console.log(`Add ${groups.high.length} high-priority decks`);
console.log(`Add ${groups.medium.length} medium-priority decks`);
console.log(`Optionally add ${groups.low.length} low-priority decks`);
console.log(`\nTotal to reach 100%: ${missing.length} decks`);

process.exit(0);
