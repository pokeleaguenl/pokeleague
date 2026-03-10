import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update deck id=4 to point to archetype 26 (Charizard ex / Pidgeot ex)
const { error } = await supabase
  .from('decks')
  .update({ 
    archetype_id: 26,
    name: 'Charizard ex / Pidgeot ex'
  })
  .eq('id', 4);

console.log(error ? `❌ ${error.message}` : '✅ Updated deck id=4 -> archetype_id=26, name=Charizard ex / Pidgeot ex');

// Verify
const { data } = await supabase.from('decks').select('id, name, archetype_id, image_url').eq('id', 4).single();
console.log('Result:', data);
