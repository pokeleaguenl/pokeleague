#!/usr/bin/env node

// Test the deck analytics calculation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the analytics function (simplified version for testing)
async function testDeckAnalytics(deckName) {
  console.log(`\n🔍 Testing analytics for: ${deckName}\n`);

  // 1. Get the deck
  const { data: deck } = await supabase
    .from('decks')
    .select('id, name, meta_share, cost, tier, archetype_id')
    .eq('name', deckName)
    .single();

  if (!deck) {
    console.log('❌ Deck not found');
    return;
  }

  console.log('✅ Deck found:', {
    id: deck.id,
    name: deck.name,
    archetype_id: deck.archetype_id,
    meta_share: deck.meta_share,
    cost: deck.cost,
    tier: deck.tier,
  });

  if (!deck.archetype_id) {
    console.log('⚠️  No archetype_id - cannot fetch scores');
    return;
  }

  // 2. Get scores for this archetype
  const { data: scores } = await supabase
    .from('fantasy_archetype_scores_live')
    .select('*, event:fantasy_events(id, name, event_date, status)')
    .eq('archetype_id', deck.archetype_id)
    .order('computed_at', { ascending: false });

  console.log(`\n📊 Scores: ${scores?.length || 0} tournament results`);

  if (!scores || scores.length === 0) {
    console.log('⚠️  No scores available for this deck yet');
    return;
  }

  // 3. Calculate analytics
  const totalPoints = scores.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgPoints = Math.round(totalPoints / scores.length);
  const recentForm = scores.slice(0, 3).reduce((sum, s) => sum + (s.points || 0), 0);

  console.log('\n💰 Fantasy Points:');
  console.log(`   Total: ${totalPoints}`);
  console.log(`   Avg per event: ${avgPoints}`);
  console.log(`   Recent form (last 3): ${recentForm}`);

  // 4. Placement breakdown
  const placements = {
    top64: 0,
    top32: 0,
    top16: 0,
    top8: 0,
    finals: 0,
    wins: 0,
  };

  scores.forEach(s => {
    const placement = s.placement;
    if (!placement || placement === 0) return;
    
    if (placement <= 64) placements.top64++;
    if (placement <= 32) placements.top32++;
    if (placement <= 16) placements.top16++;
    if (placement <= 8) placements.top8++;
    if (placement <= 4) placements.finals++;
    if (placement === 1) placements.wins++;
  });

  console.log('\n🏆 Placement Breakdown:');
  console.log(`   Top 64: ${placements.top64}`);
  console.log(`   Top 32: ${placements.top32}`);
  console.log(`   Top 16: ${placements.top16}`);
  console.log(`   Top 8: ${placements.top8}`);
  console.log(`   Finals: ${placements.finals}`);
  console.log(`   Wins: ${placements.wins}`);

  // 5. Conversion rates
  const top32Conversion = scores.length > 0 
    ? Math.round((placements.top32 / scores.length) * 100) 
    : null;

  console.log('\n📈 Conversion Rates:');
  console.log(`   Top 32 Conversion: ${top32Conversion}%`);

  // 6. Tournament results
  console.log('\n🎯 Tournament Results:');
  scores.forEach(s => {
    const event = Array.isArray(s.event) ? s.event[0] : s.event;
    console.log(`   • ${event?.name || 'Unknown'} - ${s.points} pts ${s.placement ? `(#${s.placement})` : ''}`);
  });
}

async function runTests() {
  // Test a few decks
  await testDeckAnalytics('Charizard ex');
  await testDeckAnalytics('Raging Bolt ex');
  await testDeckAnalytics('Miraidon ex');
}

runTests().catch(console.error);
