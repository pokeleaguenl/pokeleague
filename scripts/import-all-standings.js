#!/usr/bin/env node

/**
 * Import standings from RK9 for all tournaments
 * Rate limited: 1 request every 20 seconds
 */

const { createClient } = require('@supabase/supabase-js');
const { fetchRK9Standings } = require('./scrape-rk9-standings');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RATE_LIMIT_MS = 20000; // 20 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importStandingsForTournament(tournament) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏆 ${tournament.name}`);
  console.log(`   ID: ${tournament.id} | RK9: ${tournament.rk9_id}`);
  console.log(`   Date: ${tournament.event_date} | Status: ${tournament.status}`);
  
  if (!tournament.rk9_id) {
    console.log('   ⚠️  No RK9 ID - skipping');
    return { skipped: true, reason: 'no_rk9_id' };
  }

  // Check if standings already exist
  const { data: existingSnapshot } = await supabase
    .from('fantasy_standings_snapshots')
    .select('id')
    .eq('fantasy_event_id', tournament.id)
    .maybeSingle();

  if (existingSnapshot) {
    console.log('   ⏭️  Standings already imported - skipping');
    return { skipped: true, reason: 'already_imported' };
  }

  try {
    console.log('   📥 Fetching standings from RK9...');
    const standings = await fetchRK9Standings(tournament.rk9_id);
    
    console.log(`   ✅ Found ${standings.length} players`);

    if (standings.length === 0) {
      console.log('   ⚠️  No standings data found');
      return { skipped: true, reason: 'no_data' };
    }

    // Ensure fantasy_event exists
    let { data: fantasyEvent } = await supabase
      .from('fantasy_events')
      .select('id')
      .eq('tournament_id', tournament.id)
      .maybeSingle();

    if (!fantasyEvent) {
      console.log('   🔧 Creating fantasy_event...');
      const { data: created, error: createError } = await supabase
        .from('fantasy_events')
        .insert({
          tournament_id: tournament.id,
          name: tournament.name,
          event_date: tournament.event_date,
          status: tournament.status,
        })
        .select()
        .single();

      if (createError) {
        console.error('   ❌ Failed to create fantasy_event:', createError.message);
        return { error: createError.message };
      }
      
      fantasyEvent = created;
      console.log(`   ✅ Created fantasy_event ID: ${fantasyEvent.id}`);
    }

    // Create standings snapshot
    console.log('   💾 Saving snapshot...');
    const { data: snapshot, error: snapshotError } = await supabase
      .from('fantasy_standings_snapshots')
      .insert({
        fantasy_event_id: fantasyEvent.id,
        standings: standings,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error('   ❌ Failed to save snapshot:', snapshotError.message);
      return { error: snapshotError.message };
    }

    console.log(`   ✅ Snapshot created: ${snapshot.id}`);
    
    // Stats
    const top8 = standings.filter(s => s.placement <= 8).length;
    const top32 = standings.filter(s => s.placement <= 32).length;
    console.log(`   📊 Top 8: ${top8} | Top 32: ${top32} | Total: ${standings.length}`);

    return { 
      success: true, 
      snapshot_id: snapshot.id,
      player_count: standings.length 
    };

  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return { error: error.message };
  }
}

async function importAllStandings() {
  console.log('🚀 Starting RK9 standings import\n');
  console.log('⏱️  Rate limit: 1 request every 20 seconds\n');

  // Get all tournaments with RK9 IDs
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .not('rk9_id', 'is', null)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch tournaments:', error.message);
    process.exit(1);
  }

  console.log(`📋 Found ${tournaments.length} tournaments with RK9 IDs\n`);

  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    
    const result = await importStandingsForTournament(tournament);

    if (result.success) {
      results.imported++;
    } else if (result.skipped) {
      results.skipped++;
    } else if (result.error) {
      results.errors++;
    }

    // Rate limit: wait 20 seconds before next request (except for last one)
    if (i < tournaments.length - 1) {
      console.log(`\n⏳ Waiting 20 seconds before next request...`);
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Import complete!\n');
  console.log('Summary:');
  console.log(`  Imported: ${results.imported}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Errors: ${results.errors}`);
  console.log(`  Total: ${tournaments.length}`);
  console.log('='.repeat(60));
}

importAllStandings().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
