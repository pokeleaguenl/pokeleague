import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// For each canonical deck, show its meta_share vs sum of variant meta_shares
const { data: canonicals } = await supabase
  .from('decks')
  .select('id, name, meta_share, archetype_id')
  .not('image_url', 'is', null)
  .gte('meta_share', 0.5)
  .order('meta_share', { ascending: false });

for (const deck of canonicals) {
  // Find variant decks with same canonical archetype
  const { data: variants } = await supabase
    .from('decks')
    .select('name, meta_share')
    .eq('archetype_id', deck.archetype_id)
    .neq('id', deck.id)
    .gte('meta_share', 0.5);
  
  if (variants?.length > 0) {
    console.log(`\n${deck.name} (${deck.meta_share}%)`);
    variants.forEach(v => console.log(`  └─ ${v.name} (${v.meta_share}%)`));
  }
}
