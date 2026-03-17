import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Importing Curitiba Top 257 ===\n');

const RK9_ID = 'CU01wDygvn34WEPNJ3ou';

// Deck name mapping
const deckMap = {
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
  'dragapultblaziken': 'Dragapult ex / Blaziken ex',
  'miraidoniron-crown': 'Miraidon ex / Iron Crown ex',
};

// Top 257 players (from Limitless page)
// Using compact format: [rank, name, country, deckSlug]
const standings = [
  [1, 'Matias Matricardi', 'AR', 'gholdengolunatone'],
  [2, 'Javier Andres Fernández Caro', 'CL', 'zoroark'],
  [3, 'Juan Andree Mejía', 'CL', 'gardevoirjellicent'],
  [4, 'Pedro Pertusi', 'BR', 'zoroark'],
  [5, 'William Azevedo', 'BR', 'zoroark'],
  // ... (would continue with all 257)
];

console.log(`Preparing to import ${standings.length} players...`);
console.log('Note: Full dataset has 257 players, showing abbreviated version here\n');

// Sample import for first 10
let imported = 0;
let errors = 0;

for (const [rank, playerName, country, deckSlug] of standings.slice(0, 10)) {
  const archetype = deckMap[deckSlug] || 'Unknown';
  
  const { error } = await supabase
    .from('rk9_standings')
    .insert({
      tournament_id: RK9_ID,
      player_name: playerName,
      archetype: archetype,
      rank: rank,
      country: country
    });
  
  if (error) {
    if (error.code === '23505') {
      console.log(`⊘ ${rank}. ${playerName} (duplicate)`);
    } else {
      console.log(`❌ Error: ${playerName} - ${error.message}`);
      errors++;
    }
  } else {
    console.log(`✓ ${rank}. ${playerName} - ${archetype}`);
    imported++;
  }
}

console.log(`\n✅ Imported ${imported} players`);
if (errors > 0) console.log(`❌ Errors: ${errors}`);

console.log('\n⚠️  NOTE: This is a SAMPLE import (first 10 players)');
console.log('Full dataset requires parsing all 257 from the HTML');
console.log('\nWould you like me to:');
console.log('  A) Import all 257 manually (requires typing them out)');
console.log('  B) Build a proper HTML parser');
console.log('  C) Use the sample for testing scoring logic');

process.exit(0);
