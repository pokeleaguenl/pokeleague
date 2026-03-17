/**
 * Alias Coverage Checker
 * 
 * Identifies decks in RK9 standings that don't have aliases yet.
 * Helps maintain comprehensive deck coverage.
 * 
 * Usage: node scripts/automation/check-alias-coverage.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Alias Coverage Report ===');
console.log(`Generated: ${new Date().toISOString()}\n`);

async function analyzeAliasCoverage() {
  // Get all unique deck names from standings
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .not('archetype', 'eq', 'Unknown');
  
  const uniqueDecks = [...new Set(standings?.map(s => s.archetype))];
  
  console.log(`Total unique deck names in standings: ${uniqueDecks.length}`);
  
  // Check which ones have aliases
  const decksWithAliases = [];
  const decksWithoutAliases = [];
  
  for (const deckName of uniqueDecks) {
    const { data: alias } = await supabase
      .from('fantasy_archetype_aliases')
      .select('archetype_id')
      .eq('alias', deckName);
    
    if (alias && alias.length > 0) {
      decksWithAliases.push(deckName);
    } else {
      // Get entry count
      const { count } = await supabase
        .from('rk9_standings')
        .select('*', { count: 'exact', head: true })
        .eq('archetype', deckName);
      
      decksWithoutAliases.push({ name: deckName, count: count || 0 });
    }
  }
  
  const coveragePercent = ((decksWithAliases.length / uniqueDecks.length) * 100).toFixed(1);
  
  console.log(`\n✅ Decks with aliases: ${decksWithAliases.length}`);
  console.log(`⚠️  Decks without aliases: ${decksWithoutAliases.length}`);
  console.log(`📊 Coverage: ${coveragePercent}%`);
  
  // Sort by entry count and show top missing
  decksWithoutAliases.sort((a, b) => b.count - a.count);
  
  console.log('\n=== Top 20 Decks Needing Aliases (by entry count) ===\n');
  decksWithoutAliases.slice(0, 20).forEach((deck, i) => {
    console.log(`${(i + 1).toString().padStart(2, ' ')}. ${deck.count.toString().padStart(4, ' ')} entries: ${deck.name}`);
  });
  
  return {
    total: uniqueDecks.length,
    withAliases: decksWithAliases.length,
    withoutAliases: decksWithoutAliases.length,
    coveragePercent,
    topMissing: decksWithoutAliases.slice(0, 20)
  };
}

async function main() {
  try {
    const report = await analyzeAliasCoverage();
    
    console.log('\n=== Recommendations ===');
    if (report.withoutAliases > 0) {
      console.log('⚠️  Action needed:');
      console.log(`   - ${report.withoutAliases} decks need aliases`);
      console.log('   - Focus on high-entry decks first');
      console.log('   - Group variants under base archetypes');
    } else {
      console.log('✅ Perfect coverage! All decks have aliases.');
    }
    
    console.log('\n💡 To improve coverage:');
    console.log('   - Run this script weekly');
    console.log('   - Add aliases for decks with 10+ entries');
    console.log('   - Create new archetypes for unique builds');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
