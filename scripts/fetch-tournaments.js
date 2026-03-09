#!/usr/bin/env node

// Fetch available tournaments from RK9 and check what's in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournaments() {
  console.log('🏆 Checking tournaments in database:\n');

  // 1. Check tournaments table
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, event_date, status, rk9_id')
    .order('event_date', { ascending: false })
    .limit(10);

  console.log(`Found ${tournaments?.length || 0} tournaments:\n`);
  
  tournaments?.forEach(t => {
    console.log(`  ${t.id}: ${t.name}`);
    console.log(`     Date: ${t.event_date} | Status: ${t.status}`);
    console.log(`     RK9 ID: ${t.rk9_id || 'N/A'}\n`);
  });

  // 2. Check fantasy_events
  const { data: fantasyEvents } = await supabase
    .from('fantasy_events')
    .select('id, name, event_date, status, tournament_id')
    .order('event_date', { ascending: false });

  console.log(`\n📊 Fantasy Events: ${fantasyEvents?.length || 0}`);
  
  fantasyEvents?.forEach(fe => {
    console.log(`  ${fe.id}: ${fe.name} (tournament_id: ${fe.tournament_id})`);
  });

  // 3. Check standings snapshots
  const { data: snapshots } = await supabase
    .from('fantasy_standings_snapshots')
    .select('id, fantasy_event_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`\n📸 Standings Snapshots: ${snapshots?.length || 0}`);
  
  snapshots?.forEach(s => {
    console.log(`  Snapshot ${s.id}: Event ${s.fantasy_event_id} at ${s.created_at}`);
  });

  // 4. Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Tournaments: ${tournaments?.length || 0}`);
  console.log(`  Fantasy Events: ${fantasyEvents?.length || 0}`);
  console.log(`  Standings Snapshots: ${snapshots?.length || 0}`);
  console.log('='.repeat(60));
}

checkTournaments().catch(console.error);
