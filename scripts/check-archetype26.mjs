import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Confirm archetype 26
const { data: arch } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .eq('id', 26)
  .single();
console.log('Archetype 26:', arch);

// What archetype_id does the "Charizard ex" canonical deck point to?
const { data: deck } = await supabase
  .from('decks')
  .select('id, name, archetype_id')
  .eq('id', 4)
  .single();
console.log('Deck id=4 (Charizard ex):', deck);

// What archetype does slug "charizard-ex" resolve to?
const { data: archBySlug } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .eq('slug', 'charizard-ex')
  .single();
console.log('Archetype for slug charizard-ex:', archBySlug);
