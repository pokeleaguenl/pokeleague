import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: decks } = await supabase
  .from('decks')
  .select('id, name, image_url, meta_share, archetype_id')
  .order('name');

// Find likely duplicates — decks whose name contains another deck's name
const noImage = decks.filter(d => !d.image_url);
console.log(`\nDecks WITHOUT images (${noImage.length}):`);
noImage.forEach(d => console.log(`  [${d.id}] ${d.name} (${d.meta_share}% meta)`));

console.log(`\nDecks WITH images (${decks.filter(d=>d.image_url).length}):`);
decks.filter(d=>d.image_url).forEach(d => console.log(`  [${d.id}] ${d.name} (${d.meta_share}% meta)`));
