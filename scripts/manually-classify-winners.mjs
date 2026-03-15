import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Manually classifying tournament winners ===\n');

// Get all rank 1 Unknown entries
const { data: winners } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('archetype', 'Unknown')
  .eq('rank', 1);

console.log(`Found ${winners?.length || 0} winners with Unknown archetype\n`);

let fixed = 0;

for (const winner of winners || []) {
  const cardList = (winner.card_list || '').toLowerCase();
  
  let newArchetype = 'Unknown';
  
  // Basic classification logic for common decks
  if (cardList.includes('mega absol') && cardList.includes('mega kangaskhan')) {
    newArchetype = 'Mega Absol ex / Mega Kangaskhan ex';
  } else if (cardList.includes('dragapult ex') && cardList.includes('dusknoir')) {
    newArchetype = 'Dragapult ex / Dusknoir';
  } else if (cardList.includes('charizard ex') && cardList.includes('pidgeot ex')) {
    newArchetype = 'Charizard ex / Pidgeot ex';
  } else if (cardList.includes('gardevoir ex')) {
    newArchetype = 'Gardevoir ex';
  } else if (cardList.includes('raging bolt ex')) {
    newArchetype = 'Raging Bolt ex';
  } else if (cardList.includes('lugia vstar')) {
    newArchetype = 'Lugia VSTAR';
  } else if (cardList.includes('regidrago vstar')) {
    newArchetype = 'Regidrago VSTAR';
  }
  
  if (newArchetype !== 'Unknown') {
    const { error } = await supabase
      .from('rk9_standings')
      .update({ archetype: newArchetype })
      .eq('id', winner.id);
    
    if (!error) {
      console.log(`✅ ${winner.player_name} (${winner.tournament_id}) → ${newArchetype}`);
      fixed++;
    } else {
      console.log(`❌ Failed to update ${winner.player_name}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  Could not classify ${winner.player_name} (${winner.tournament_id})`);
    console.log(`   Card list preview: ${cardList.substring(0, 200)}`);
  }
}

console.log(`\n✅ Fixed ${fixed} winners`);

process.exit(0);
