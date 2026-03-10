import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = ['decks', 'fantasy_archetypes', 'fantasy_events', 
  'fantasy_standings_snapshots', 'fantasy_archetype_scores_live', 'fantasy_team_scores_live'];

for (const t of tables) {
  const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
  console.log(`${t}: ${count} rows`);
}

// Show decks with/without images
const { data: decks } = await supabase.from('decks').select('name, image_url, meta_share').order('meta_share', { ascending: false }).limit(10);
console.log('\nTop decks:');
console.table(decks?.map(d => ({ name: d.name, has_image: !!d.image_url, meta_share: d.meta_share })));
