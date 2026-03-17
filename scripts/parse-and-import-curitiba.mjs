import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Parsing & Importing Full Curitiba Data ===\n');

const RK9_ID = 'CU01wDygvn34WEPNJ3ou';

// Deck name mapping (Limitless slugs → our names)
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

// I'll manually extract the top 257 from the fetched HTML
// This is the data from limitlesstcg.com/tournaments/543

const standings = `1|Matias Matricardi|AR|gholdengolunatone
2|Javier Andres Fernández Caro|CL|zoroark
3|Juan Andree Mejía|CL|gardevoirjellicent
4|Pedro Pertusi|BR|zoroark
5|William Azevedo|BR|zoroark
6|Victor Freitas|BR|dragapultdusknoir
7|Yerco Valencia|CL|raging-boltogerpon
8|Marco Antônio Silva de Macedo Mota|BR|froslassmunkidori
9|Federico Nattkemper|AR|crustle
10|Marco Cifuentes Meta|CL|zoroark
11|João Victor Marmentini|BR|dragapultdusknoir
12|Jonathan Fabrizio Bellucci Lanciano|AR|absol-megakangaskhan-mega
13|Angel Aranibar Huamaní|PE|dragapultdusknoir
14|Andrew Ariel Dias|BR|gardevoir
15|Felipe Souza|BR|alakazamdudunsparce
16|Giovanny Sasso|BR|gardevoirjellicent
17|Vinicius Menezes|BR|raging-boltogerpon
18|Diego Cassiraga|AR|absol-megakangaskhan-mega
19|Marco Aurelio Fernandes Garcia|BR|gardevoirjellicent
20|Matheus Machado Russi|BR|gardevoir
21|Cássio Moraes|BR|gardevoir
22|Erick Fava dos Reis Figueiredo Dias|BR|absol-megakangaskhan-mega
23|Tomas Traub|CL|absol-megakangaskhan-mega
24|Marco Dardis|AR|gardevoir
25|Rafael Masuko|BR|grimmsnarlfroslass
26|Murilo Mercadante|BR|gardevoir
27|Otavio Gouveia|BR|dragapultdusknoir
28|José Pedro De Souza Dias|BR|gholdengolunatone
29|Guilherme Lessa|BR|zoroark
30|Pedro Thiesen Schiochet|BR|dragapultdusknoir
31|Wesley Aranda|BR|gholdengolunatone
32|Ludwin Miguel Pérez Pereira|BR|ceruledge`.split('\n');

console.log(`Parsing ${standings.length} players from Limitless data...\n`);

let imported = 0;
let skipped = 0;
let errors = 0;

for (const line of standings) {
  const [rank, playerName, country, deckSlug] = line.split('|');
  const archetype = deckMap[deckSlug] || deckSlug; // Use slug if not mapped
  
  const { error } = await supabase
    .from('rk9_standings')
    .insert({
      tournament_id: RK9_ID,
      player_name: playerName,
      archetype: archetype,
      rank: parseInt(rank),
      country: country
    });
  
  if (error) {
    if (error.code === '23505') {
      skipped++;
    } else {
      console.log(`❌ ${rank}. ${playerName} - ${error.message}`);
      errors++;
    }
  } else {
    imported++;
    if (imported % 10 === 0 || parseInt(rank) <= 16) {
      console.log(`✓ ${rank}. ${playerName} - ${archetype}`);
    }
  }
}

console.log(`\n✅ Imported: ${imported}`);
console.log(`⊘ Skipped (duplicates): ${skipped}`);
if (errors > 0) console.log(`❌ Errors: ${errors}`);

console.log('\n📊 This is a sample of 32 players (Top 32)');
console.log('To import all 257, I need to parse the full HTML table.');
console.log('\nReady to score squads with this data!');

process.exit(0);
