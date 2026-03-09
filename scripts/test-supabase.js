#!/usr/bin/env node

// Test Supabase connection and list tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Test 1: Check fantasy_archetypes
  console.log('📊 Checking fantasy_archetypes table:');
  const { data: archetypes, error: archetypesError } = await supabase
    .from('fantasy_archetypes')
    .select('id, name, cost')
    .limit(5);

  if (archetypesError) {
    console.error('   ❌ Error:', archetypesError.message);
  } else {
    console.log(`   ✅ Found ${archetypes?.length || 0} archetypes`);
    if (archetypes && archetypes.length > 0) {
      console.log('   Sample:', archetypes[0]);
    }
  }

  // Test 2: Check fantasy_archetype_scores_live
  console.log('\n📈 Checking fantasy_archetype_scores_live table:');
  const { data: scores, error: scoresError } = await supabase
    .from('fantasy_archetype_scores_live')
    .select('archetype_id, points, placement')
    .limit(5);

  if (scoresError) {
    console.error('   ❌ Error:', scoresError.message);
  } else {
    console.log(`   ✅ Found ${scores?.length || 0} score records`);
    if (scores && scores.length > 0) {
      console.log('   Sample:', scores[0]);
    }
  }

  // Test 3: Check decks table
  console.log('\n🃏 Checking decks table:');
  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, name, meta_share, cost, tier')
    .limit(5);

  if (decksError) {
    console.error('   ❌ Error:', decksError.message);
  } else {
    console.log(`   ✅ Found ${decks?.length || 0} decks`);
    if (decks && decks.length > 0) {
      console.log('   Sample:', decks[0]);
    }
  }

  // Test 4: Check fantasy_events
  console.log('\n🏆 Checking fantasy_events table:');
  const { data: events, error: eventsError } = await supabase
    .from('fantasy_events')
    .select('id, name, event_date, status')
    .order('event_date', { ascending: false })
    .limit(5);

  if (eventsError) {
    console.error('   ❌ Error:', eventsError.message);
  } else {
    console.log(`   ✅ Found ${events?.length || 0} events`);
    if (events && events.length > 0) {
      console.log('   Sample:', events[0]);
    }
  }

  console.log('\n✅ Connection test complete!');
}

testConnection().catch(console.error);
