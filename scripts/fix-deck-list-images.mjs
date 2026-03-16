import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get decks with meta_share but no image (the variant fantasy picks)
const { data: decks } = await supabase
  .from('decks')
  .select('id, name, archetype_id, image_url')
  .is('image_url', null)
  .gt('meta_share', 0);

console.log(`Decks needing images: ${decks?.length}`);

for (const deck of (decks || [])) {
  if (!deck.archetype_id) continue;
  const { data: arch } = await supabase
    .from('fantasy_archetypes')
    .select('image_url, image_url_2')
    .eq('id', deck.archetype_id)
    .single();

  if (arch?.image_url) {
    const { error } = await supabase
      .from('decks')
      .update({ image_url: arch.image_url, image_url_2: arch.image_url_2 })
      .eq('id', deck.id);
    console.log(`${error ? '❌' : '✅'} ${deck.name} -> ${arch.image_url}`);
  } else {
    console.log(`⚠️  ${deck.name} - archetype has no image either`);
  }
}
