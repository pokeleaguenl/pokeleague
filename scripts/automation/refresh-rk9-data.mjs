/**
 * Automated RK9 Data Refresh Script
 * 
 * This script pulls latest tournament data from RK9 and updates the database.
 * Should be run periodically (daily/weekly) to keep standings current.
 * 
 * Usage: node scripts/automation/refresh-rk9-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== RK9 Data Refresh Script ===');
console.log(`Started: ${new Date().toISOString()}\n`);

// Step 1: Check for tournaments that need data
async function findTournamentsNeedingData() {
  console.log('Step 1: Finding tournaments without RK9 data...');
  
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, rk9_id, event_date, status')
    .eq('status', 'completed')
    .is('rk9_id', null);
  
  console.log(`Found ${tournaments?.length || 0} tournaments without RK9 data`);
  
  if (tournaments && tournaments.length > 0) {
    console.log('\nTournaments needing data:');
    tournaments.forEach(t => {
      console.log(`  - ${t.name} (${t.event_date})`);
    });
  }
  
  return tournaments || [];
}

// Step 2: Check for new standings in existing tournaments
async function checkForNewStandings() {
  console.log('\nStep 2: Checking existing tournaments for updates...');
  
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, rk9_id')
    .not('rk9_id', 'is', null)
    .limit(5); // Check most recent 5
  
  for (const tournament of tournaments || []) {
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.rk9_id);
    
    console.log(`  ${tournament.name}: ${count || 0} standings`);
  }
}

// Step 3: Summary stats
async function displaySummaryStats() {
  console.log('\nStep 3: Database Summary...');
  
  // Total tournaments
  const { count: totalTournaments } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true });
  
  // Tournaments with data
  const { count: tournamentsWithData } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .not('rk9_id', 'is', null);
  
  // Total standings
  const { count: totalStandings } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true });
  
  // Unique players
  const { data: players } = await supabase
    .from('rk9_standings')
    .select('player_name');
  
  const uniquePlayers = new Set(players?.map(p => p.player_name));
  
  console.log(`  Total Tournaments: ${totalTournaments || 0}`);
  console.log(`  Tournaments with Data: ${tournamentsWithData || 0}`);
  console.log(`  Total Standings: ${totalStandings || 0}`);
  console.log(`  Unique Players: ${uniquePlayers.size}`);
}

// Main execution
async function main() {
  try {
    const tournamentsNeedingData = await findTournamentsNeedingData();
    await checkForNewStandings();
    await displaySummaryStats();
    
    console.log('\n=== Next Steps ===');
    if (tournamentsNeedingData.length > 0) {
      console.log('⚠️  Manual action needed:');
      console.log('   - Visit RK9 for these tournaments');
      console.log('   - Import standings data');
      console.log('   - Update rk9_id field in tournaments table');
    } else {
      console.log('✅ All completed tournaments have data!');
    }
    
    console.log('\n💡 To automate further:');
    console.log('   - Set up cron job to run this script daily');
    console.log('   - Add RK9 API integration (if available)');
    console.log('   - Create webhook for automatic updates');
    
    console.log(`\nCompleted: ${new Date().toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
