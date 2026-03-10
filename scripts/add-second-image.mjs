import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// First check what image URLs look like to understand the pattern
const { data: canonical } = await supabase
  .from('decks')
  .select('name, image_url')
  .not('image_url', 'is', null);

console.log('Image URL patterns:');
canonical.forEach(d => console.log(`  ${d.name} -> ${d.image_url}`));

// Extract the pokemon slug from image URL
// e.g. https://r2.limitlesstcg.net/pokemon/gen9/charizard.png -> charizard
function getSlugFromUrl(url) {
  return url?.split('/').pop()?.replace('.png', '');
}

// Build map: deck first name -> image url
const nameToImage = {};
for (const deck of canonical) {
  const firstName = deck.name.split(' / ')[0].toLowerCase().trim();
  nameToImage[firstName] = deck.image_url;
}
console.log('\nName->image map:', nameToImage);
