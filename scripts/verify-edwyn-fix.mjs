import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Verifying Edwyn classification ===\n');

const { data: edwyn } = await supabase
  .from('rk9_standings')
  .select('player_name, rank, archetype, tournament_id')
  .ilike('player_name', 'Edwyn Mesman')
  .eq('rank', 1)
  .single();

console.log('Player:', edwyn.player_name);
console.log('Rank:', edwyn.rank);
console.log('Archetype:', edwyn.archetype);

if (edwyn.archetype === 'Unknown') {
  console.log('\n❌ Still classified as Unknown');
} else {
  console.log('\n✅ Successfully classified!');
}

// Check remaining Unknown count
const { count } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true })
  .eq('archetype', 'Unknown');

console.log(`\nRemaining Unknown entries: ${count}`);

process.exit(0);
