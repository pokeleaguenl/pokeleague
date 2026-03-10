import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .eq('tournament_id', 'SG0167ss5UCjklsDaPrA')
  .not('archetype', 'is', null);

const unique = [...new Set(standings.map(s => s.archetype))];

const { data: canonicals } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .is('canonical_id', null);

const canonicalNames = canonicals.map(c => c.name);

const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias');
const existingAliases = new Set(aliases.map(a => a.alias));

const unmatched = unique.filter(a => {
  const normalized = a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return !existingAliases.has(normalized) &&
         !canonicalNames.some(c => c.toLowerCase() === a.toLowerCase());
});

console.log(`Unmatched: ${unmatched.length}`);

const BATCH_SIZE = 25;
let inserted = 0;
let skipped = 0;

for (let i = 0; i < unmatched.length; i += BATCH_SIZE) {
  const batch = unmatched.slice(i, i + BATCH_SIZE);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a Pokemon TCG expert. Map each deck name to its canonical English archetype.
Many names are in German, French, or Italian - translate them to English first.

Canonical archetypes:
${canonicalNames.join('\n')}

Respond ONLY with a raw JSON array (no markdown, no backticks):
[{"input": "...", "canonical": "..." or null}, ...]

Deck names:
${batch.map((d, i) => `${i+1}. ${d}`).join('\n')}`
      }]
    })
  });

  const data = await response.json();
  if (!data.content) { console.error('API error:', JSON.stringify(data)); continue; }

  const text = data.content[0].text.replace(/^```json\n?|\n?```$/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch(e) {
    console.error('Parse error on batch', i/BATCH_SIZE, e.message);
    console.error('Raw:', text.slice(0, 300));
    continue;
  }

  for (const result of parsed) {
    if (!result.canonical) { skipped++; continue; }
    const canonical = canonicals.find(c => c.name === result.canonical);
    if (!canonical) { skipped++; continue; }

    const alias = result.input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { error } = await supabase
      .from('fantasy_archetype_aliases')
      .upsert({ alias, archetype_id: canonical.id }, { onConflict: 'alias' });

    if (!error) {
      inserted++;
      console.log(`  ✅ "${result.input}" -> ${result.canonical}`);
    }
  }
  console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} done`);
}

console.log(`\nInserted: ${inserted}, Skipped: ${skipped}`);
