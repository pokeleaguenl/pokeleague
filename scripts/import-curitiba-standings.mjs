import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Importing Curitiba Tournament ===\n');

const RK9_ID = 'CU01wDygvn34WEPNJ3ou';
const TOURNAMENT_ID = 264;

// Step 1: Update tournament with RK9 ID
console.log('Step 1: Updating tournament...');
const { error: updateError } = await supabase
  .from('tournaments')
  .update({ 
    rk9_id: RK9_ID,
    status: 'completed'
  })
  .eq('id', TOURNAMENT_ID);

if (updateError) {
  console.log(`❌ Error: ${updateError.message}`);
  process.exit(1);
}
console.log('✅ Tournament updated\n');

// Step 2: Map Limitless deck slugs to our archetype names
console.log('Step 2: Preparing deck name mappings...');

const deckNameMap = {
  'gholdengolunatone': 'Gholdengo ex / Lunatone',
  'zoroark': 'Zoroark ex',
  'gardevoirjellicent': 'Gardevoir ex / Jellicent',
  'dragapultdusknoir': 'Dragapult ex / Dusknoir',
  'raging-boltogerpon': 'Raging Bolt ex / Ogerpon ex',
  'froslassmunkidori': 'Froslass / Munkidori',
  'crustle': 'Crustle',
  'absol-megakangaskhan-mega': 'Absol / Mega Kangaskhan ex',
  'gardevoir': 'Gardevoir ex',
  'alakazamdudunsparce': 'Alakazam ex / Dudunsparce',
  'grimmsnarlfroslass': 'Grimmsnarl ex / Froslass',
  'ceruledge': 'Ceruledge ex',
  'joltikpikachu': 'Joltik / Pikachu ex',
  'noctowlogerpon-wellspring': 'Noctowl / Ogerpon ex Wellspring',
  'dipplinthwackey': 'Dipplin / Thwackey',
  'charizardnoctowl': 'Charizard ex / Noctowl',
  'charizardpidgeot': 'Charizard ex / Pidgeot ex',
  'greninja': 'Greninja ex',
  'dragapultcharizard': 'Dragapult ex / Charizard ex',
  'dragapult': 'Dragapult ex',
  'ogerponmeganium': 'Ogerpon ex / Meganium',
  'iron-leavesiron-crown': 'Iron Leaves ex / Iron Crown ex',
  'venusaur-mega': 'Mega Venusaur ex',
  'kangaskhan-megabouffalant': 'Mega Kangaskhan ex / Bouffalant',
  'slowking': 'Slowking ex',
  'ogerponogerpon-wellspring': 'Ogerpon ex / Ogerpon ex Wellspring',
  'garchomp': 'Garchomp ex',
  'typhlosion': 'Typhlosion ex',
  'dragapultblaziken': 'Dragapult ex / Blaziken ex'
};

console.log(`Mapped ${Object.keys(deckNameMap).length} deck archetypes\n`);

// Step 3: Import standings data
// (Limitless only shows top 257, full data at labs.limitlesstcg.com/0057/standings)

console.log('Step 3: For full 1449 player import:');
console.log('  Visit: https://labs.limitlesstcg.com/0057/standings');
console.log('  Copy/export the full standings table');
console.log('');
console.log('For now, we can import the top 257 from the main page.');
console.log('This covers all Day 2 players which is most important for scoring.\n');

console.log('Ready to import? (Y/n)');

process.exit(0);
