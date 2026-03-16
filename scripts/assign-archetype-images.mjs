import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE = 'https://r2.limitlesstcg.net/pokemon/gen9';

// Map first pokemon name -> slug
const SLUGS = {
  'ogerpon ex': 'ogerpon', 'ogerpon': 'ogerpon',
  'teal mask ogerpon ex': 'ogerpon', 'cornerstone ogerpon ex': 'ogerpon',
  'cornerstone mask ogerpon ex': 'ogerpon',
  'bloodmoon ursaluna ex': 'ursaluna', 'ursaluna ex': 'ursaluna',
  'zoroark ex': 'zoroark', 'zoroark': 'zoroark',
  'noctowl ex': 'noctowl', 'noctowl': 'noctowl', 'noctuh': 'noctowl',
  'grimmsnarl ex': 'grimmsnarl', 'grimmsnarl': 'grimmsnarl',
  'lopunny ex': 'lopunny', 'dusknoir': 'dusknoir',
  'mega lucario ex': 'lucario-mega', 'lucario ex': 'lucario', 'lucario': 'lucario',
  'sharpedo ex': 'sharpedo', 'mega sharpedo ex': 'sharpedo',
  'mega absol ex': 'absol-mega', 'absol ex': 'absol',
  'kangaskhan ex': 'kangaskhan',
  'terapagos ex': 'terapagos', 'terapagos': 'terapagos',
  'blaziken ex': 'blaziken',
  'pidgeot ex': 'pidgeot', 'pidgeot': 'pidgeot',
  'toxtricity': 'toxtricity', 'toxtricity ex': 'toxtricity',
  'venusaur ex': 'venusaur', 'mega venusaur ex': 'venusaur-mega',
  'alakazam ex': 'alakazam', 'alakazam': 'alakazam',
  'metagross ex': 'metagross', 'metagross': 'metagross',
  'hydrapple ex': 'hydrapple',
  'azumarill ex': 'azumarill', 'azumarill': 'azumarill',
  'conkeldurr ex': 'conkeldurr', 'conkeldurr': 'conkeldurr',
  'roaring moon ex': 'roaring-moon', 'roaring moon': 'roaring-moon',
  'pecharunt ex': 'pecharunt', 'pecharunt': 'pecharunt',
  'malamar ex': 'malamar', 'malamar': 'malamar',
  'eevee ex': 'eevee',
  'ethan\'s typhlosion ex': 'typhlosion', 'typhlosion ex': 'typhlosion',
  'lugia vstar': 'lugia', 'lugia ex': 'lugia',
  'cynthia\'s garchomp ex': 'garchomp', 'garchomp ex': 'garchomp',
  'slaking ex': 'slaking', 'slaking': 'slaking',
  'reshiram ex': 'reshiram', 'reshiram': 'reshiram',
  'ting-lu ex': 'ting-lu',
  'roserade ex': 'roserade', 'roserade': 'roserade',
  'fezandipiti ex': 'fezandipiti', 'fezandipiti': 'fezandipiti',
  'mew ex': 'mew', 'mew': 'mew',
  'mewtwo ex': 'mewtwo', 'mewtwo': 'mewtwo',
  'spiritomb': 'spiritomb',
  'applin': 'applin',
  'slowking': 'slowking',
  'lost box': 'comfey',
  'toolbox': 'noctowl',
  'quaquaval ex': 'quaquaval',
  'iron hands ex': 'iron-hands',
  'iron crown ex': 'iron-crown',
  'mega gengar ex': 'gengar-mega', 'gengar ex': 'gengar',
  'archaludon ex': 'archaludon',
  'tsareena ex': 'tsareena',
};

function getSlug(name) {
  const first = name.split(' / ')[0].toLowerCase().trim();
  return SLUGS[first] || null;
}

// Get all archetypes with no image
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .is('image_url', null);

console.log(`Archetypes without images: ${archetypes?.length}`);

let fixed = 0;
for (const arch of (archetypes || [])) {
  const slug = getSlug(arch.name);
  if (!slug) continue;
  
  const imageUrl = `${BASE}/${slug}.png`;
  const { error } = await supabase
    .from('fantasy_archetypes')
    .update({ image_url: imageUrl })
    .eq('id', arch.id);
  
  if (!error) { fixed++; console.log(`✅ ${arch.name} -> ${slug}.png`); }
}
console.log(`\nFixed ${fixed} archetypes`);
