import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FANTASY_EVENT_ID = 8;
const RK9_TOURNAMENT_ID = 'SG0167ss5UCjklsDaPrA';

// 1. Fetch standings
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank')
  .eq('tournament_id', RK9_TOURNAMENT_ID)
  .eq('round', 18)
  .not('archetype', 'is', null)
  .not('rank', 'is', null)
  .order('rank', { ascending: true });

console.log(`Found ${standings.length} standings`);

// 2. Fetch all archetypes and aliases for matching
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, slug, name');

const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias, archetype_id');

console.log(`Archetypes: ${archetypes.length}, Aliases: ${aliases.length}`);

// Build lookup maps
const bySlug = Object.fromEntries(archetypes.map(a => [a.slug, a]));
const byName = Object.fromEntries(archetypes.map(a => [a.name.toLowerCase(), a]));
const byAlias = Object.fromEntries(aliases.map(a => [a.alias, a.archetype_id]));

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resolveArchetype(deckName) {
  const slug = normalize(deckName);
  if (bySlug[slug]) return bySlug[slug];
  if (byName[deckName.toLowerCase()]) return byName[deckName.toLowerCase()];
  if (byAlias[slug]) return archetypes.find(a => a.id === byAlias[slug]);
  return null;
}

// 3. Aggregate by archetype
const archetypeStats = {};
const unmatched = new Set();

for (const s of standings) {
  const arch = resolveArchetype(s.archetype);
  if (!arch) { unmatched.add(s.archetype); continue; }
  
  if (!archetypeStats[arch.slug]) {
    archetypeStats[arch.slug] = { arch, placements: [], top8: 0, top32: 0, won: 0 };
  }
  const stats = archetypeStats[arch.slug];
  stats.placements.push(s.rank);
  if (s.rank <= 8) stats.top8++;
  if (s.rank <= 32) stats.top32++;
  if (s.rank === 1) stats.won++;
}

console.log(`Matched: ${Object.keys(archetypeStats).length} archetypes`);
console.log(`Unmatched (${unmatched.size}): ${[...unmatched].slice(0, 10).join(', ')}`);

// 4. Build and store snapshot payload
const archetypeResults = Object.values(archetypeStats).map(({ arch, placements, top8, top32, won }) => ({
  archetype_slug: arch.slug,
  archetype_name: arch.name,
  placement: Math.min(...placements),
  made_day2: top32 > 0,
  top8: top8 > 0,
  won: won > 0,
  win_rate: 0,
  had_win: won > 0,
}));

const payload = { archetypes: archetypeResults, recorded_at: new Date().toISOString() };

const { data: snapshot, error: snapError } = await supabase
  .from('fantasy_standings_snapshots')
  .insert({ fantasy_event_id: FANTASY_EVENT_ID, payload, source: 'rk9_direct' })
  .select().single();

if (snapError) { console.error('Snapshot error:', snapError.message); process.exit(1); }
console.log(`\nSnapshot stored: id=${snapshot.id}`);

// 5. Upsert archetype scores
const scoreRows = archetypeResults.map(r => {
  let pts = 0;
  if (r.made_day2) pts += 3;
  if (r.top8) pts += 10;
  if (r.won) pts += 25;
  if (r.had_win) pts += 1;
  return {
    fantasy_event_id: FANTASY_EVENT_ID,
    archetype_id: archetypeStats[r.archetype_slug].arch.id,
    points: pts,
    placement: r.placement,
  };
});

const { error: scoreError } = await supabase
  .from('fantasy_archetype_scores_live')
  .upsert(scoreRows, { onConflict: 'fantasy_event_id,archetype_id' });

if (scoreError) console.error('Score error:', scoreError.message);
else console.log(`Upserted ${scoreRows.length} archetype scores`);

// 6. Summary
console.log('\nTop scoring archetypes:');
console.table(scoreRows.sort((a,b) => b.points - a.points).slice(0, 10).map(r => ({
  archetype: archetypeResults.find(a => a.archetype_slug === archetypeStats[Object.keys(archetypeStats).find(k => archetypeStats[k].arch.id === r.archetype_id)]?.arch.slug)?.archetype_name || r.archetype_id,
  points: r.points,
  placement: r.placement,
})));
