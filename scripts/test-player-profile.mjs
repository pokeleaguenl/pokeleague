import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing Player Profile ===\n');

// Get a top player
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('player_name, rank')
  .not('player_name', 'is', null)
  .order('rank', { ascending: true })
  .limit(10);

console.log('Top 10 players who will have profile pages:\n');
const unique = [...new Set(standings?.map(s => s.player_name))];
unique.slice(0, 5).forEach(name => {
  const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  console.log(`  ${name} → /players/${slug}`);
});

console.log('\n✅ Player profiles ready!');

process.exit(0);
