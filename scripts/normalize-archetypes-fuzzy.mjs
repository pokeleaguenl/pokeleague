#!/usr/bin/env node
/**
 * normalize-archetypes-fuzzy.mjs
 * Matches unmatched RK9 archetype strings to canonical fantasy_archetypes
 * using fuzzy string matching — no API credits needed.
 *
 * Strategy (in order of confidence):
 * 1. Exact match (case-insensitive)
 * 2. Slug match (normalized to lowercase-hyphen)
 * 3. First token match (e.g. "Dragapult ex / Pidgeot ex" -> "Dragapult ex")
 * 4. Token overlap score (Jaccard similarity >= 0.5)
 * 5. Edit distance (Levenshtein <= 3)
 *
 * Outputs:
 * - Auto-inserts high-confidence matches (strategies 1-3)
 * - Prints medium-confidence matches for review (strategies 4-5)
 * - Lists unresolved for manual attention
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be written\n');

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(s) {
  return s.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function tokenize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !'ex vstar vmax gx v'.split(' ').includes(t));
}

function jaccardSimilarity(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const intersection = [...sa].filter(x => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Common translations for non-English deck names
const TRANSLATIONS = {
  'glurak': 'charizard', 'dragoran': 'dragonite', 'bisaflor': 'venusaur',
  'turtok': 'blastoise', 'arkani': 'arcanine', 'raichu': 'raichu',
  'evoli': 'eevee', 'karpador': 'magikarp', 'liberlo': 'inteleon',
  'dracaufeu': 'charizard', 'tortank': 'blastoise', 'florizarre': 'venusaur',
  'lucario': 'lucario', 'mewtwo': 'mewtwo', 'pikachu': 'pikachu',
  'gardevoir': 'gardevoir', 'dragapult': 'dragapult', 'regidrago': 'regidrago',
};

function translateTokens(s) {
  return s.toLowerCase().split(/[\s\/]+/).map(t => TRANSLATIONS[t] || t).join(' ');
}

// ── Main ───────────────────────────────────────────────────────────────────

// 1. Fetch all distinct archetypes from rk9_standings
const { data: standingsRaw } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .not('archetype', 'is', null);

const allArchetypes = [...new Set(standingsRaw.map(s => s.archetype))];
console.log(`Total distinct archetypes in standings: ${allArchetypes.length}`);

// 2. Fetch canonical archetypes
const { data: canonicals } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .is('canonical_id', null);

// 3. Fetch existing aliases
const { data: aliasRows } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias, archetype_id');

const existingAliases = new Set(aliasRows.map(a => a.alias));
const canonicalNames = canonicals.map(c => c.name);

// 4. Find unmatched
const unmatched = allArchetypes.filter(a => {
  const slug = slugify(a);
  return !existingAliases.has(slug) &&
         !canonicalNames.some(c => c.toLowerCase() === a.toLowerCase());
});

console.log(`Already matched: ${allArchetypes.length - unmatched.length}`);
console.log(`Unmatched: ${unmatched.length}\n`);

if (unmatched.length === 0) {
  console.log('✅ All archetypes are already matched!');
  process.exit(0);
}

// 5. Fuzzy match
const HIGH_CONFIDENCE = [];   // auto-insert
const MED_CONFIDENCE  = [];   // print for review
const UNRESOLVED      = [];   // no match found

for (const input of unmatched) {
  const translated = translateTokens(input);
  const inputSlug = slugify(input);
  let best = null;
  let bestScore = 0;
  let bestStrategy = '';

  for (const canonical of canonicals) {
    const cName = canonical.name;
    const cSlug = slugify(cName);

    // Strategy 1: exact (case-insensitive)
    if (input.toLowerCase() === cName.toLowerCase() || translated === cName.toLowerCase()) {
      best = canonical; bestScore = 1.0; bestStrategy = 'exact'; break;
    }

    // Strategy 2: slug match
    if (inputSlug === cSlug) {
      best = canonical; bestScore = 0.99; bestStrategy = 'slug'; break;
    }

    // Strategy 3: first primary token match
    const inputFirstToken = input.split(/[\s\/]/)[0].toLowerCase();
    const cFirstToken = cName.split(/[\s\/]/)[0].toLowerCase();
    if (inputFirstToken.length > 3 && inputFirstToken === cFirstToken) {
      if (0.95 > bestScore) {
        best = canonical; bestScore = 0.95; bestStrategy = 'first-token';
      }
    }

    // Strategy 4: Jaccard token overlap
    const jaccard = jaccardSimilarity(translated, cName);
    if (jaccard >= 0.5 && jaccard > bestScore) {
      best = canonical; bestScore = jaccard; bestStrategy = `jaccard(${jaccard.toFixed(2)})`;
    }

    // Strategy 5: Levenshtein on slug
    const lev = levenshtein(inputSlug, cSlug);
    const levScore = 1 - lev / Math.max(inputSlug.length, cSlug.length);
    if (lev <= 3 && levScore > bestScore) {
      best = canonical; bestScore = levScore; bestStrategy = `levenshtein(${lev})`;
    }
  }

  if (!best) {
    UNRESOLVED.push(input);
  } else if (bestScore >= 0.9) {
    HIGH_CONFIDENCE.push({ input, canonical: best, score: bestScore, strategy: bestStrategy });
  } else {
    MED_CONFIDENCE.push({ input, canonical: best, score: bestScore, strategy: bestStrategy });
  }
}

// 6. Report
console.log(`High confidence (auto-insert): ${HIGH_CONFIDENCE.length}`);
console.log(`Medium confidence (review):    ${MED_CONFIDENCE.length}`);
console.log(`Unresolved:                    ${UNRESOLVED.length}\n`);

// 7. Insert high confidence
let inserted = 0;
for (const { input, canonical, score, strategy } of HIGH_CONFIDENCE) {
  const alias = slugify(input);
  console.log(`  ✅ [${strategy}] "${input}" → ${canonical.name}`);
  if (!DRY_RUN) {
    const { error } = await supabase
      .from('fantasy_archetype_aliases')
      .upsert({ alias, archetype_id: canonical.id }, { onConflict: 'alias' });
    if (!error) inserted++;
    else console.error(`     ❌ Insert failed: ${error.message}`);
  }
}

// 8. Print medium confidence for review
if (MED_CONFIDENCE.length > 0) {
  console.log('\n⚠️  Medium confidence matches (review before accepting):');
  for (const { input, canonical, score, strategy } of MED_CONFIDENCE) {
    console.log(`  [${strategy}] "${input}" → ${canonical.name} (score: ${score.toFixed(2)})`);
  }
  console.log('\nRe-run with --accept-medium to auto-insert these too.');

  if (process.argv.includes('--accept-medium')) {
    console.log('\nInserting medium confidence matches...');
    for (const { input, canonical } of MED_CONFIDENCE) {
      const alias = slugify(input);
      if (!DRY_RUN) {
        await supabase.from('fantasy_archetype_aliases')
          .upsert({ alias, archetype_id: canonical.id }, { onConflict: 'alias' });
        inserted++;
      }
    }
  }
}

// 9. Print unresolved
if (UNRESOLVED.length > 0) {
  console.log('\n❌ Unresolved (no match found — add manually or create new archetype):');
  UNRESOLVED.forEach(u => console.log(`  - "${u}"`));
}

console.log(`\n✅ Done. Inserted: ${DRY_RUN ? '(dry run)' : inserted}`);
