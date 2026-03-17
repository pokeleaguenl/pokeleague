import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Adding ALL Remaining Decks (1-entry builds) ===\n');

// Get all missing decks
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .not('archetype', 'eq', 'Unknown');

const uniqueDecks = [...new Set(standings?.map(s => s.archetype))];

const missing = [];
for (const deckName of uniqueDecks) {
  const { data: alias } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', deckName);
  
  if (!alias || alias.length === 0) {
    missing.push(deckName);
  }
}

console.log(`Found ${missing.length} decks without aliases\n`);

let created = 0;
let errors = 0;

for (const name of missing) {
  // Create slug
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Try to create archetype
  const { data: arch, error: archError } = await supabase
    .from('fantasy_archetypes')
    .insert({ name, slug })
    .select('id')
    .single();

  if (archError) {
    // Try with timestamp suffix for duplicate slugs
    const timestamp = Date.now().toString().slice(-6);
    const slugWithSuffix = `${slug}-${timestamp}`;
    
    const { data: arch2, error: archError2 } = await supabase
      .from('fantasy_archetypes')
      .insert({ name, slug: slugWithSuffix })
      .select('id')
      .single();
    
    if (archError2) {
      console.log(`❌ Error: ${name}`);
      errors++;
      continue;
    }
    
    // Add alias
    await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: arch2.id, alias: name });
    
    console.log(`✓ ${name}`);
    created++;
  } else {
    // Add alias
    await supabase
      .from('fantasy_archetype_aliases')
      .insert({ archetype_id: arch.id, alias: name });
    
    console.log(`✓ ${name}`);
    created++;
  }
}

console.log(`\n✅ Created ${created} decks`);
if (errors > 0) console.log(`❌ Errors: ${errors}`);

// Final coverage
const { data: allStandings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .not('archetype', 'eq', 'Unknown');

const allUnique = [...new Set(allStandings?.map(s => s.archetype))];

let withAliases = 0;
for (const deckName of allUnique) {
  const { data: alias } = await supabase
    .from('fantasy_archetype_aliases')
    .select('archetype_id')
    .eq('alias', deckName);
  
  if (alias && alias.length > 0) withAliases++;
}

const coverage = ((withAliases / allUnique.length) * 100).toFixed(1);
console.log(`\n🎯 FINAL COVERAGE: ${coverage}%`);
console.log(`Total decks: ${allUnique.length}`);
console.log(`With aliases: ${withAliases}`);
console.log(`Missing: ${allUnique.length - withAliases}`);

if (coverage === '100.0') {
  console.log('\n🎉🎉🎉 100% COVERAGE ACHIEVED! 🎉🎉🎉');
}

process.exit(0);
