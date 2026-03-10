import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Manual map of pokemon name -> limitless slug
// Based on the URL pattern: r2.limitlesstcg.net/pokemon/gen9/{slug}.png
const POKEMON_SLUGS = {
  'pidgeot ex': 'pidgeot',
  'pidgeot': 'pidgeot',
  'dusknoir': 'dusknoir',
  'jellicent ex': 'jellicent',
  'iron hands ex': 'iron-hands',
  'ogerpon ex': 'ogerpon',
  'teal mask ogerpon ex': 'ogerpon',
  'munkidori': 'munkidori',
  'genesect ex': 'genesect',
  'greedent': 'greedent',
  'raging bolt ex': 'raging-bolt',
  'blaziken ex': 'blaziken',
  'fezandipiti ex': 'fezandipiti',
  'fezandipiti': 'fezandipiti',
  'dusclops': 'dusclops',
  'noctowl': 'noctowl',
  'mew ex': 'mew',
  'pecharunt ex': 'pecharunt',
  'pecharunt': 'pecharunt',
  'absol ex': 'absol',
  'kangaskhan ex': 'kangaskhan',
  'mega kangaskhan ex': 'kangaskhan-mega',
  'mega absol ex': 'absol-mega',
  'mega lopunny ex': 'lopunny-mega',
  'mega gardevoir ex': 'gardevoir-mega',
  'mega venusaur ex': 'venusaur-mega',
  'iron valiant ex': 'iron-valiant',
  'roaring moon ex': 'roaring-moon',
  'tyranitar': 'tyranitar',
  'charizard ex': 'charizard',
  'dragapult ex': 'dragapult',
  'gardevoir ex': 'gardevoir',
  'gholdengo ex': 'gholdengo',
  'miraidon ex': 'miraidon',
  'greninja ex': 'greninja',
  'ceruledge ex': 'ceruledge',
  'alakazam': 'alakazam',
  'lucario': 'lucario',
  'medicham ex': 'medicham',
  'galvantula ex': 'galvantula',
  'orthworm ex': 'orthworm',
  'zekrom ex': 'zekrom',
  'pikachu ex': 'pikachu',
  'iron thorns ex': 'iron-thorns',
  'cornerstone mask ogerpon ex': 'ogerpon',
  'cornerstone ogerpon ex': 'ogerpon',
  'diancie ex': 'diancie',
  "lillie's clefairy ex": 'clefairy',
  'crobat ex': 'crobat',
  'lopunny ex': 'lopunny',
  'noctowl ex': 'noctowl',
  'toxtricity': 'toxtricity',
  'gengar ex': 'gengar',
  'lunatone': 'lunatone',
  'reshiram': 'reshiram',
  'ursaluna ex': 'ursaluna',
  'zoroark ex': 'zoroark',
  'typhlosion ex': 'typhlosion',
  'genesect': 'genesect',
  'gholdengo': 'gholdengo',
  'froslass': 'froslass',
};

const BASE = 'https://r2.limitlesstcg.net/pokemon/gen9';

function getImageUrl(pokemonName) {
  const slug = POKEMON_SLUGS[pokemonName.toLowerCase().trim()];
  return slug ? `${BASE}/${slug}.png` : null;
}

// Get all archetypes with a slash in name (combo decks)
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, image_url')
  .like('name', '% / %');

console.log(`Found ${archetypes.length} combo archetypes`);

let fixed = 0;
let missing = [];

for (const arch of archetypes) {
  const parts = arch.name.split(' / ');
  const secondName = parts[1]?.trim();
  if (!secondName) continue;

  const image2 = getImageUrl(secondName);
  if (image2) {
    const { error } = await supabase
      .from('fantasy_archetypes')
      .update({ image_url_2: image2 })
      .eq('id', arch.id);
    if (!error) { fixed++; }
    else console.error(`  ❌ ${arch.name}: ${error.message}`);
  } else {
    missing.push(`${arch.name} (second: "${secondName}")`);
  }
}

console.log(`\nFixed: ${fixed}`);
console.log(`Missing slugs (${missing.length}):`);
missing.slice(0, 20).forEach(m => console.log(`  ${m}`));
