#!/usr/bin/env node

// Check what data is available for deck analytics
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalyticsData() {
  console.log('🔍 Checking deck analytics data availability:\n');

  // 1. Get all decks
  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, name, meta_share, cost, tier, slug, archetype_id');

  if (decksError) {
    console.error('❌ Error fetching decks:', decksError.message);
    return;
  }

  console.log(`✅ Found ${decks?.length || 0} decks in database\n`);

  // 2. For each deck, check if it has analytics data
  for (const deck of decks || []) {
    console.log(`\n🃏 Deck: ${deck.name} (ID: ${deck.id}, Archetype: ${deck.archetype_id})`);
    console.log(`   Slug: ${deck.slug}`);
    console.log(`   Meta Share: ${deck.meta_share}% | Cost: ${deck.cost} | Tier: ${deck.tier}`);

    if (!deck.archetype_id) {
      console.log('   ⚠️  No archetype_id - cannot fetch scores');
      continue;
    }

    // Check scores for this archetype
    const { data: scores, error: scoresError } = await supabase
      .from('fantasy_archetype_scores_live')
      .select('archetype_id, points, placement, event_id, computed_at')
      .eq('archetype_id', deck.archetype_id);

    if (scoresError) {
      console.log(`   ❌ Error fetching scores: ${scoresError.message}`);
    } else {
      console.log(`   📊 Scores: ${scores?.length || 0} tournament results`);
      
      if (scores && scores.length > 0) {
        const totalPoints = scores.reduce((sum, s) => sum + (s.points || 0), 0);
        const avgPoints = Math.round(totalPoints / scores.length);
        console.log(`   💰 Total Points: ${totalPoints} | Avg: ${avgPoints} per event`);
        
        const withPlacement = scores.filter(s => s.placement);
        console.log(`   🏆 Placements available: ${withPlacement.length}/${scores.length}`);
      }
    }
  }

  // 3. Check events
  console.log('\n\n🏆 Events in database:');
  const { data: events } = await supabase
    .from('fantasy_events')
    .select('id, name, event_date, status')
    .order('event_date', { ascending: false });

  events?.forEach(event => {
    console.log(`   ${event.id}: ${event.name} (${event.event_date}) - ${event.status}`);
  });

  // 4. Check fantasy_archetypes
  console.log('\n\n🎯 Fantasy Archetypes:');
  const { data: archetypes } = await supabase
    .from('fantasy_archetypes')
    .select('id, name');

  archetypes?.forEach(arch => {
    console.log(`   ${arch.id}: ${arch.name}`);
  });
}

checkAnalyticsData().catch(console.error);
