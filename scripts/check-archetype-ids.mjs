import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check what archetype IDs have scores for Stuttgart (fantasy_event_id=8)
const { data: scores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('archetype_id, points, meta_share')
  .eq('fantasy_event_id', 8)
  .order('points', { ascending: false })
  .limit(10);

console.log('Top scores for Stuttgart (event 8):');
console.table(scores);

// Look up those archetype names
const ids = scores.map(s => s.archetype_id);
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, slug')
  .in('id', ids);

console.log('\nArchetype names:');
console.table(archetypes);

// Check what archetype_id "Charizard ex" deck has
const { data: charDeck } = await supabase
  .from('decks')
  .select('id, name, archetype_id')
  .ilike('name', '%charizard%')
  .not('image_url', 'is', null);

console.log('\nCanonical Charizard deck:');
console.table(charDeck);
