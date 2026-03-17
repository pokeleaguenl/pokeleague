import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Scoring Curitiba Tournament (Correct Schema) ===\n');

const TOURNAMENT_ID = 264;
const RK9_ID = 'CU01wDygvn34WEPNJ3ou';

// Step 1: Get all squads
console.log('Step 1: Fetching squads...');
const { data: squads, error: squadError } = await supabase
  .from('squads')
  .select('*');

if (squadError) {
  console.log(`❌ Error: ${squadError.message}`);
  process.exit(1);
}

console.log(`Found ${squads?.length || 0} squads\n`);

if (!squads || squads.length === 0) {
  console.log('⚠️  No squads found - users haven\'t created squads yet!');
  process.exit(0);
}

// Step 2: Get tournament standings
console.log('Step 2: Fetching Curitiba standings...');
const { data: standings, error: standingsError } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('tournament_id', RK9_ID);

console.log(`Found ${standings?.length || 0} standings entries\n`);

// Step 3: Get all archetypes
console.log('Step 3: Loading archetypes...');
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name');

const archetypeMap = {};
archetypes?.forEach(a => {
  archetypeMap[a.id] = a.name;
});

console.log(`Loaded ${archetypes?.length || 0} archetypes\n`);

// Step 4: Score each squad
console.log('Step 4: Scoring squads...\n');

let scored = 0;

for (const squad of squads) {
  // Get all deck IDs from squad (active + bench + hand)
  const deckIds = [
    squad.active_deck_id,
    squad.bench_1,
    squad.bench_2,
    squad.bench_3,
    squad.bench_4,
    squad.bench_5,
    squad.hand_1,
    squad.hand_2,
    squad.hand_3,
    squad.hand_4
  ].filter(id => id !== null);
  
  if (deckIds.length === 0) {
    console.log(`⊘ Squad ${squad.id} (User ${squad.user_id}): No decks selected`);
    continue;
  }
  
  // Calculate points
  let totalPoints = 0;
  const deckScores = [];
  
  for (const deckId of deckIds) {
    const deckName = archetypeMap[deckId];
    if (!deckName) continue;
    
    // Find best placement for this deck
    const deckStandings = standings.filter(s => s.archetype === deckName);
    
    if (deckStandings.length > 0) {
      const bestPlacement = Math.min(...deckStandings.map(s => s.rank));
      
      // Points based on placement
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
  
  if (totalPoints > 0) {
    console.log(`✓ Squad ${squad.id} (User ${squad.user_id}): ${totalPoints} points`);
    deckScores.forEach(d => {
      console.log(`  - ${d.deck}: #${d.placement} (${d.points}pts)`);
    });
    scored++;
  } else {
    console.log(`⊘ Squad ${squad.id} (User ${squad.user_id}): 0 points (no decks in top 32)`);
  }
}

console.log(`\n✅ Scored ${scored} squads with points`);
console.log(`📊 Total squads: ${squads.length}`);

console.log('\n📝 Summary:');
console.log(`  - Curitiba tournament: ✅ Ready (ID: ${TOURNAMENT_ID})`);
console.log(`  - Standings imported: ✅ ${standings?.length || 0} entries`);
console.log(`  - Total archetypes: ✅ ${archetypes?.length || 0}`);
console.log(`  - Squads scored: ✅ ${scored}`);

process.exit(0);
