#!/usr/bin/env node
/**
 * classify-archetypes.mjs
 * Rule-based card_list → archetype classifier using canonical archetype names
 * No API credits needed. Uses keyword matching on Pokemon names.
 * 
 * Usage: node scripts/classify-archetypes.mjs --tournament SE01gUuRn8bJqbH9Wnt1
 *        node scripts/classify-archetypes.mjs --all
 *        node scripts/classify-archetypes.mjs --tournament X --dry-run
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL = args.includes('--all');
const tournamentId = args.includes('--tournament') ? args[args.indexOf('--tournament') + 1] : null;

if (!ALL && !tournamentId) {
  console.error('Usage: --tournament <rk9_id> | --all');
  process.exit(1);
}

if (DRY_RUN) console.log('🔍 DRY RUN\n');

// Fetch all canonical archetypes + aliases
const { data: canonicals } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .is('canonical_id', null);

const { data: aliasRows } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias, archetype_id');

const aliasMap = new Map(aliasRows.map(a => [a.alias, a.archetype_id]));

// Build keyword rules from canonical names
// Extract meaningful Pokemon keywords from names like "Dragapult ex / Dusknoir"
function nameToKeywords(name) {
  return name
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+ex$/i, '')
    .replace(/\bex\b/gi, '')
    .replace(/\bvmax\b/gi, '').replace(/\bvstar\b/gi, '').replace(/\bv\b/gi, '')
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 3 && !/^(the|and|with|control|toolbox|seek|inspiration|mysterious|rock|inn|bloodmoon|cornerstone|teal|mask|hearthflame)$/i.test(t));
}

// Score a card_list against each canonical archetype
function classifyDeck(cardList) {
  if (!cardList) return null;
  
  // Extract Pokemon lines: "N Pokemon Name (set-num)"
  const pokemonLines = cardList.split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\s+[A-Z]/.test(l));
  
  const deckText = pokemonLines.join(' ').toLowerCase();
  
  // Also try slug-matching against aliases
  const deckSlug = deckText.replace(/[^a-z0-9]+/g, '-');
  
  let bestMatch = null;
  let bestScore = 0;

  for (const canonical of canonicals) {
    const keywords = nameToKeywords(canonical.name);
    if (keywords.length === 0) continue;
    
    let score = 0;
    let matched = 0;
    for (const kw of keywords) {
      if (deckText.includes(kw.toLowerCase())) {
        matched++;
        // Primary keyword (first in name) worth more
        score += (matched === 1) ? 2 : 1;
      }
    }
    
    // Require at least the primary keyword to match
    if (matched === 0) continue;
    
    // Bonus if all keywords match
    if (matched === keywords.length) score += 2;
    
    // Penalty for very short keyword matches that are too generic
    if (keywords[0].length < 5 && matched === 1) score -= 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = canonical;
    }
  }
  
  return bestScore >= 2 ? bestMatch : null;
}

// Fetch unclassified standings
let query = supabase
  .from('rk9_standings')
  .select('id, player_name, card_list, archetype, rank')
  .eq('archetype', 'Unknown')
  .not('card_list', 'is', null);

if (!ALL) query = query.eq('tournament_id', tournamentId);

const { data: standings } = await query;
console.log(`Classifying ${standings?.length ?? 0} unclassified standings...\n`);

let classified = 0;
let skipped = 0;
const updates = [];

for (const row of (standings ?? [])) {
  const match = classifyDeck(row.card_list);
  if (!match) { skipped++; continue; }
  updates.push({ id: row.id, archetype: match.name });
  classified++;
  if (classified <= 15) {
    console.log(`  ✅ ${row.rank ? '#'+row.rank+' ' : ''}${row.player_name} → ${match.name}`);
  }
}

console.log(`\nClassified: ${classified}, Unresolvable: ${skipped}`);

if (!DRY_RUN && updates.length > 0) {
  console.log('\nWriting to DB...');
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);
    for (const u of batch) {
      await supabase.from('rk9_standings').update({ archetype: u.archetype }).eq('id', u.id);
    }
    process.stdout.write(`\r  ${Math.min(i+100, updates.length)}/${updates.length}`);
  }
  console.log('\nDone!');
}
