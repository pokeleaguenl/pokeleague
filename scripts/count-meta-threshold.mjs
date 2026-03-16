import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

for (const threshold of [0.5, 1.0, 1.5, 2.0]) {
  const { count } = await supabase
    .from('decks')
    .select('*', { count: 'exact', head: true })
    .gte('meta_share', threshold);
  console.log(`meta_share >= ${threshold}%: ${count} decks`);
}
