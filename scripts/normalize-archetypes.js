#!/usr/bin/env node

/**
 * Normalize archetype names in rk9_standings table
 * Maps German/French/other language variants to English equivalents
 * Uses Claude to intelligently classify archetypes
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const SUPABASE_URL = 'https://bmmkjbjnszysxppiekhv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWtqYmpuc3p5c3hwcGlla2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2NzA1MiwiZXhwIjoyMDg4MTQzMDUyfQ.yOuVKvU61xkvexxtNn_KzPisadhoxPa8EClVppylumI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get Claude API key from environment
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
  console.error('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

/**
 * Use Claude to normalize a batch of archetype names
 * Returns a map of original -> normalized name
 */
async function normalizeArchetypesBatch(archetypes) {
  const prompt = `You are a Pokémon TCG expert. I have a list of deck archetype names from tournament data.
Some are in English, some are in German, French, or other languages. Some use different formatting conventions.

Your task: For each archetype, return the standardized ENGLISH archetype name.

Rules:
1. Translate German/French Pokémon names to English (e.g., "Monetigo-ex" → "Gholdengo ex", "Quajutsu ex" → "Greninja ex")
2. Use consistent formatting: "Pokémon ex" with a space before "ex", no hyphens
3. Keep secondary Pokémon names in the archetype (e.g., "Charizard ex / Pidgeot ex")
4. Preserve slashes "/" for multi-Pokémon archetypes
5. Use the most common English name for the archetype
6. If already in correct English format, return it unchanged

Here are the archetypes to normalize:

${archetypes.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return ONLY a JSON object mapping each original name to its normalized English name.
Format: { "original name": "Normalized English Name", ... }

Do not include any explanation, just the JSON object.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const text = response.content[0].text.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    if (text.startsWith('```')) {
      jsonText = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const mapping = JSON.parse(jsonText);
    return mapping;
    
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    throw error;
  }
}

/**
 * Batch process array into chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Main normalization process
 */
async function normalizeAllArchetypes(dryRun = true) {
  console.log('🔧 RK9 Archetype Normalization\n');
  console.log(`Mode: ${dryRun ? '🧪 DRY RUN (no changes)' : '💾 LIVE UPDATE'}\n`);

  // Fetch all distinct archetypes
  console.log('📥 Fetching distinct archetypes from rk9_standings...');
  
  const { data: rows, error } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .not('archetype', 'is', null);

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  const uniqueArchetypes = [...new Set(rows.map(r => r.archetype))].sort();
  
  console.log(`✅ Found ${uniqueArchetypes.length} unique archetypes\n`);

  // Process in batches of 50 to avoid token limits
  const batches = chunk(uniqueArchetypes, 50);
  const normalizationMap = {};

  console.log(`🤖 Normalizing with Claude (${batches.length} batches)...\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   Batch ${i + 1}/${batches.length} (${batch.length} archetypes)...`);
    
    try {
      const batchMapping = await normalizeArchetypesBatch(batch);
      Object.assign(normalizationMap, batchMapping);
      
      // Rate limit: wait 1 second between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Failed batch ${i + 1}:`, error.message);
      continue;
    }
  }

  console.log(`\n✅ Normalization complete!\n`);

  // Analyze changes
  const changes = Object.entries(normalizationMap)
    .filter(([original, normalized]) => original !== normalized);

  console.log(`📊 Analysis:`);
  console.log(`   Total archetypes: ${uniqueArchetypes.length}`);
  console.log(`   Needs normalization: ${changes.length}`);
  console.log(`   Already correct: ${uniqueArchetypes.length - changes.length}\n`);

  if (changes.length > 0) {
    console.log(`🔄 Changes to apply:\n`);
    
    // Group by normalized name to show consolidation
    const byNormalized = {};
    changes.forEach(([original, normalized]) => {
      if (!byNormalized[normalized]) byNormalized[normalized] = [];
      byNormalized[normalized].push(original);
    });

    // Show top 20 most common normalized names
    const sorted = Object.entries(byNormalized)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);

    sorted.forEach(([normalized, originals]) => {
      console.log(`   ${normalized}:`);
      originals.forEach(orig => {
        console.log(`      ← ${orig}`);
      });
      console.log();
    });

    if (Object.keys(byNormalized).length > 20) {
      console.log(`   ... and ${Object.keys(byNormalized).length - 20} more\n`);
    }
  }

  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes were made');
    console.log('   Run with --apply to apply changes\n');
    
    // Save mapping to file for review
    const fs = require('fs');
    const mappingFile = '/home/node/.openclaw/workspace/pokeleague-main/scripts/archetype-normalization-map.json';
    fs.writeFileSync(mappingFile, JSON.stringify(normalizationMap, null, 2));
    console.log(`💾 Mapping saved to: ${mappingFile}\n`);
    
    return;
  }

  // Apply updates
  console.log('💾 Applying updates to database...\n');

  let updated = 0;
  let errors = 0;

  for (const [original, normalized] of changes) {
    if (original === normalized) continue;

    const { error: updateError } = await supabase
      .from('rk9_standings')
      .update({ archetype: normalized })
      .eq('archetype', original);

    if (updateError) {
      console.error(`   ❌ Failed to update "${original}":`, updateError.message);
      errors++;
    } else {
      updated++;
      console.log(`   ✅ ${original} → ${normalized}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Normalization complete!\n');
  console.log('Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total changes: ${changes.length}`);
  console.log('='.repeat(60));
}

// CLI
const args = process.argv.slice(2);
const applyMode = args.includes('--apply');

normalizeAllArchetypes(!applyMode).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
