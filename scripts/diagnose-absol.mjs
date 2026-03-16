import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== ALIASES FOR MEGA ABSOL BOX ===');
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select(`
    archetype_string,
    fantasy_archetypes!inner(slug, name)
  `)
  .eq('fantasy_archetypes.slug', 'mega-absol-box')
  .order('archetype_string');

if (aliases?.length) {
  aliases.forEach(a => console.log(`  "${a.archetype_string}"`));
} else {
  console.log('  NO ALIASES FOUND!');
}

console.log('\n=== ABSOL DECKS IN RK9_STANDINGS ===');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', '%absol%');

const grouped = standings?.reduce((acc, s) => {
  acc[s.archetype] = (acc[s.archetype] || 0) + 1;
  return acc;
}, {});

Object.entries(grouped || {})
  .sort((a, b) => b[1] - a[1])
  .forEach(([arch, count]) => console.log(`  ${count}x "${arch}"`));

console.log('\n=== ABSOL BY TOURNAMENT ===');
const { data: byTournament } = await supabase
  .from('rk9_standings')
  .select(`
    archetype,
    tournaments!inner(name)
  `)
  .ilike('archetype', '%absol%');

const tournamentGrouped = byTournament?.reduce((acc, s) => {
  const key = `${s.tournaments.name} | ${s.archetype}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

Object.entries(tournamentGrouped || {})
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => console.log(`  ${count}x ${key}`));

process.exit(0);
