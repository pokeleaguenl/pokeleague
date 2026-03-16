import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding and fixing Unknown classifications ===\n');

// Get all Unknown entries
const { data: unknowns } = await supabase
  .from('rk9_standings')
  .select('*')
  .eq('archetype', 'Unknown')
  .order('rank', { ascending: true });

console.log(`Found ${unknowns?.length || 0} Unknown entries\n`);

if (unknowns && unknowns.length > 0) {
  console.log('These need to be re-classified. Run the classifier:');
  console.log('');
  console.log('  node scripts/classify-archetypes.mjs --all');
  console.log('');
  
  console.log('Top 10 Unknown entries:');
  unknowns.slice(0, 10).forEach(u => {
    console.log(`  Rank ${u.rank}: ${u.player_name} (${u.tournament_id})`);
  });
}

process.exit(0);
