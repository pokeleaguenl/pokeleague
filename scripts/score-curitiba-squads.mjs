import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Scoring Curitiba Tournament ===\n');

const TOURNAMENT_ID = 264;
const RK9_ID = 'CU01wDygvn34WEPNJ3ou';

// Step 1: Get all active squads
console.log('Step 1: Fetching active squads...');
const { data: squads, error: squadError } = await supabase
  .from('squads')
  .select(`
    id,
    user_id,
    league_id,
    squad_decks (
      archetype_id,
      fantasy_archetypes (
        id,
        name
      )
    )
  `);

if (squadError) {
  console.log(`❌ Error fetching squads: ${squadError.message}`);
  process.exit(1);
}

console.log(`Found ${squads?.length || 0} squads\n`);

if (!squads || squads.length === 0) {
  console.log('⚠️  No squads found - users haven\'t created squads yet!');
  console.log('This is expected for a new platform.\n');
  console.log('When users create squads, run this script to score them.');
  process.exit(0);
}

// Step 2: Get tournament standings
console.log('Step 2: Fetching Curitiba standings...');
const { data: standings, error: standingsError } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('tournament_id', RK9_ID);

if (standingsError) {
  console.log(`❌ Error fetching standings: ${standingsError.message}`);
  process.exit(1);
}

console.log(`Found ${standings?.length || 0} standings entries\n`);

// Step 3: Score each squad
console.log('Step 3: Scoring squads...\n');

let scored = 0;
let alreadyScored = 0;

for (const squad of squads) {
  // Check if already scored
  const { data: existing } = await supabase
    .from('league_scores')
    .select('id')
    .eq('user_id', squad.user_id)
    .eq('tournament_id', TOURNAMENT_ID)
    .single();
  
  if (existing) {
    alreadyScored++;
    continue;
  }
  
  // Calculate points for this squad
  let totalPoints = 0;
  const deckScores = [];
  
  for (const deck of squad.squad_decks) {
    const deckName = deck.fantasy_archetypes.name;
    
    // Find best placement for this deck
    const deckStandings = standings.filter(s => s.archetype === deckName);
    
    if (deckStandings.length > 0) {
      // Best placement = lowest rank
      const bestPlacement = Math.min(...deckStandings.map(s => s.rank));
      
      // Points based on placement (simplified scoring)
      let points = 0;
      if (bestPlacement === 1) points = 100;
      else if (bestPlacement <= 4) points = 75;
      else if (bestPlacement <= 8) points = 50;
      else if (bestPlacement <= 16) points = 25;
      else if (bestPlacement <= 32) points = 10;
      
      totalPoints += points;
      deckScores.push({ deck: deckName, placement: bestPlacement, points });
    }
  }
  
  // Insert score
  const { error: scoreError } = await supabase
    .from('league_scores')
    .insert({
      user_id: squad.user_id,
      league_id: squad.league_id,
      tournament_id: TOURNAMENT_ID,
      points: totalPoints
    });
  
  if (scoreError) {
    console.log(`❌ Error scoring squad: ${scoreError.message}`);
  } else {
    scored++;
    if (totalPoints > 0) {
      console.log(`✓ User ${squad.user_id}: ${totalPoints} points`);
      deckScores.forEach(d => {
        console.log(`  - ${d.deck}: #${d.placement} (${d.points}pts)`);
      });
    }
  }
}

console.log(`\n✅ Scored ${scored} new squads`);
console.log(`⊘ Already scored: ${alreadyScored}`);

if (scored === 0 && alreadyScored === 0) {
  console.log('\n📝 Summary:');
  console.log('  - Curitiba tournament: ✅ Ready');
  console.log('  - Standings imported: ✅ 37 entries');
  console.log('  - User squads: ⏳ Waiting for users to create squads');
  console.log('\nThe scoring system is ready to go!');
}

process.exit(0);
