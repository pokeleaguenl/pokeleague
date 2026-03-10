import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Build a map of pokemon name -> image url from canonical decks
const { data: canonical } = await supabase
  .from('decks')
  .select('name, image_url')
  .not('image_url', 'is', null);

// Extract first pokemon name from deck name -> image url
const pokemonImages = {};
for (const deck of canonical) {
  // "Charizard ex" -> "charizard ex"
  const firstName = deck.name.split(' / ')[0].toLowerCase().trim();
  pokemonImages[firstName] = deck.image_url;
}
console.log('Pokemon image map:', Object.keys(pokemonImages));

// Get all archetypes with null image_url
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .is('image_url', null);

console.log(`\nFixing ${archetypes.length} archetypes with no image...`);

let fixed = 0;
for (const arch of archetypes) {
  const firstName = arch.name.split(' / ')[0].toLowerCase().trim();
  const imageUrl = pokemonImages[firstName];
  if (imageUrl) {
    const { error } = await supabase
      .from('fantasy_archetypes')
      .update({ image_url: imageUrl })
      .eq('id', arch.id);
    if (!error) { fixed++; console.log(`  ✅ ${arch.name} -> ${imageUrl}`); }
  }
}

console.log(`\nFixed ${fixed} archetypes`);
