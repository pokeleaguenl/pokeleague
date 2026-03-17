import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Fetching Curitiba Tournament Data from Limitless ===\n');

const tournamentUrl = 'https://limitlesstcg.com/tournaments/543';
console.log(`Fetching: ${tournamentUrl}\n`);

// The RK9 ID is typically in the data-tournament-id attribute or in the API response
// For now, let's check what we know about this tournament

console.log('Checking if this tournament has standings...');

// Let me check the actual Limitless API endpoint
// Typically it's: https://limitlesstcg.com/api/v1/tournaments/{id}

const apiUrl = 'https://limitlesstcg.com/api/v1/tournaments/543';
console.log(`API endpoint: ${apiUrl}\n`);

try {
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  console.log('Tournament Info:');
  console.log(`  Name: ${data.tournament?.name || 'Unknown'}`);
  console.log(`  Date: ${data.tournament?.date || 'Unknown'}`);
  console.log(`  Players: ${data.tournament?.players || 'Unknown'}`);
  
  // The RK9 ID might be in the data
  if (data.tournament?.rk9labs_id) {
    console.log(`  RK9 ID: ${data.tournament.rk9labs_id}`);
    
    // Update the database
    const { error } = await supabase
      .from('tournaments')
      .update({ 
        rk9_id: data.tournament.rk9labs_id,
        status: 'completed'
      })
      .eq('id', 264);
    
    if (error) {
      console.log(`\n❌ Error updating tournament: ${error.message}`);
    } else {
      console.log('\n✅ Updated tournament with RK9 ID!');
      console.log('\nNext: Import standings from RK9');
    }
  } else {
    console.log('\n⚠️  Could not find RK9 ID in API response');
    console.log('Checking for standings data...');
    
    if (data.standings && data.standings.length > 0) {
      console.log(`\nFound ${data.standings.length} standings entries`);
      console.log('We can import these directly!');
    }
  }
} catch (error) {
  console.log(`\n❌ Error fetching from Limitless: ${error.message}`);
  console.log('\nTrying alternative approach...');
}

process.exit(0);
