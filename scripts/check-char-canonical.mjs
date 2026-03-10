import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, canonical_id')
  .eq('canonical_id', 1);

console.log('Variants of Charizard ex (canonical_id=1):');
console.table(data);

// Also check archetype 26 directly
const { data: arch26 } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, canonical_id')
  .eq('id', 26)
  .single();
console.log('\nArchetype 26:', arch26);

// And check what scores exist for archetype 26
const { data: scores } = await supabase
  .from('fantasy_archetype_scores_live')
  .select('archetype_id, points, fantasy_event_id')
  .eq('archetype_id', 26);
console.log('Scores for archetype 26:', scores);
