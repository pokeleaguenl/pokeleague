#!/usr/bin/env node
/**
 * score-all-tournaments.mjs — scores all completed tournaments directly via Supabase
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const onlyId = args.includes('--tournament') ? parseInt(args[args.indexOf('--tournament')+1]) : null;

// ── Scoring rules ──────────────────────────────────────────────────────────
function calcPoints(archetype) {
  let pts = 0;
  if (archetype.won)        pts += 25;
  if (archetype.top8)       pts += 15;
  if (archetype.made_day2)  pts += 8;
  if (archetype.had_win)    pts += 3;
  return pts;
}

// ── Resolve deck name to archetype via aliases ─────────────────────────────
async function buildAliasMap() {
  const { data } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias, archetype_id, fantasy_archetypes(id, slug, name)');
  const map = new Map();
  for (const row of data ?? []) {
    const arch = Array.isArray(row.fantasy_archetypes) ? row.fantasy_archetypes[0] : row.fantasy_archetypes;
    if (arch) map.set(row.alias, arch);
  }
  return map;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Main ───────────────────────────────────────────────────────────────────
const { data: tournaments } = onlyId
  ? await supabase.from('tournaments').select('id, name, rk9_id, event_date').eq('id', onlyId)
  : await supabase.from('tournaments').select('id, name, rk9_id, event_date')
      .eq('status', 'completed').not('rk9_id', 'is', null).order('event_date');

const { data: canonicals } = await supabase
  .from('fantasy_archetypes').select('id, slug, name').is('canonical_id', null);
const canonicalBySlug = new Map(canonicals.map(c => [c.slug, c]));
const canonicalByName = new Map(canonicals.map(c => [c.name.toLowerCase(), c]));
const aliasMap = await buildAliasMap();

function resolveArchetype(deckName) {
  const slug = slugify(deckName);
  if (canonicalBySlug.has(slug)) return canonicalBySlug.get(slug);
  if (canonicalByName.has(deckName.toLowerCase())) return canonicalByName.get(deckName.toLowerCase());
  if (aliasMap.has(slug)) return aliasMap.get(slug);
  return null;
}

// Fetch all squads + their decks upfront
const { data: squads } = await supabase.from('squads').select('*');
const allDeckIds = new Set();
const BENCH = ['bench_1','bench_2','bench_3','bench_4','bench_5'];
const HAND  = ['hand_1','hand_2','hand_3','hand_4'];
for (const s of squads ?? []) {
  if (s.active_deck_id) allDeckIds.add(s.active_deck_id);
  for (const k of [...BENCH,...HAND]) if (s[k]) allDeckIds.add(s[k]);
}
const { data: allDecks } = await supabase.from('decks').select('id, name').in('id', [...allDeckIds]);
const deckMap = new Map((allDecks ?? []).map(d => [d.id, d.name]));

console.log(`Scoring ${tournaments.length} tournaments, ${squads?.length ?? 0} squads\n`);

for (const tournament of tournaments) {
  console.log(`=== ${tournament.name} ===`);

  const { data: rows } = await supabase
    .from('rk9_standings')
    .select('player_name, archetype, rank')
    .eq('tournament_id', tournament.rk9_id)
    .not('archetype', 'eq', 'Unknown')
    .not('rank', 'is', null)
    .limit(10000);

  if (!rows?.length) { console.log('  ⚠️  No ranked classified data — skipping\n'); continue; }

  // Build archetype stats
  const stats = {};
  for (const row of rows) {
    const arch = resolveArchetype(row.archetype);
    if (!arch) continue;
    if (!stats[arch.slug]) stats[arch.slug] = { arch, placements: [], won: false, top8: false, made_day2: false, had_win: false };
    const s = stats[arch.slug];
    s.placements.push(row.rank);
    if (row.rank === 1)  s.won = true;
    if (row.rank <= 8)   s.top8 = true;
    if (row.rank <= 32)  s.made_day2 = true;
    s.had_win = true;
  }

  const archetypeResults = Object.values(stats).map(({ arch, placements, won, top8, made_day2, had_win }) => ({
    archetype_slug: arch.slug,
    archetype_name: arch.name,
    placement: Math.min(...placements),
    won, top8, made_day2, had_win,
    win_rate: 0,
  }));

  // Ensure fantasy_event
  let { data: fe } = await supabase.from('fantasy_events').select('id').eq('tournament_id', tournament.id).maybeSingle();
  if (!fe) {
    const now = new Date().toISOString().split('T')[0];
    const { data: created } = await supabase.from('fantasy_events')
      .insert({ tournament_id: tournament.id, name: tournament.name, event_date: tournament.event_date, status: tournament.event_date < now ? 'completed' : 'upcoming' })
      .select().single();
    fe = created;
  }

  // Store snapshot
  const payload = { archetypes: archetypeResults, recorded_at: new Date().toISOString() };
  await supabase.from('fantasy_standings_snapshots').insert({ fantasy_event_id: fe.id, payload, source: 'score_all_cli' });

  // Score archetypes
  const archetypeScores = [];
  for (const result of archetypeResults) {
    const arch = canonicalBySlug.get(result.archetype_slug);
    if (!arch) continue;
    archetypeScores.push({ fantasy_event_id: fe.id, archetype_id: arch.id, points: calcPoints(result), placement: result.placement });
  }
  if (archetypeScores.length) {
    await supabase.from('fantasy_archetype_scores_live').upsert(archetypeScores, { onConflict: 'fantasy_event_id,archetype_id' });
  }

  // Score teams
  const archetypePointsBySlug = new Map(archetypeResults.map(r => [r.archetype_slug, calcPoints(r)]));
  const teamScores = [];
  for (const squad of squads ?? []) {
    const effect = squad.event_effect;
    let total = 0;
    const slots = [];
    const scoreSlot = (deckId, slotName, zone) => {
      if (!deckId) return;
      const deckName = deckMap.get(deckId);
      if (!deckName) return;
      const slug = slugify(deckName);
      const base = archetypePointsBySlug.get(slug) ?? 0;
      const mult = zone === 'active' ? (effect === 'x3' ? 3 : 2) : zone === 'bench' ? 1 : (effect === 'hand_boost' ? 1 : 0);
      const final = base * mult;
      total += final;
      slots.push({ slot: slotName, archetype_slug: slug, base_points: base, multiplier: mult, final_points: final });
    };
    scoreSlot(squad.active_deck_id, 'active', 'active');
    for (const k of BENCH) scoreSlot(squad[k], k, 'bench');
    for (const k of HAND)  scoreSlot(squad[k], k, 'hand');
    teamScores.push({ fantasy_event_id: fe.id, user_id: squad.user_id, points: total, breakdown: { slots, total } });
  }
  if (teamScores.length) {
    await supabase.from('fantasy_team_scores_live').upsert(teamScores, { onConflict: 'fantasy_event_id,user_id' });
  }

  console.log(`  ✅ ${archetypeScores.length} archetypes, ${teamScores.length} teams scored\n`);
}
console.log('All done!');
