import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Dragapult Aliases ===\n');

// Check what "Dragapult ex" alias is assigned to
const { data: dragapultAlias } = await supabase
  .from('fantasy_archetype_aliases')
  .select('archetype_id, alias')
  .eq('alias', 'Dragapult ex');

console.log('Who owns the "Dragapult ex" alias?');
if (dragapultAlias && dragapultAlias.length > 0) {
  for (const alias of dragapultAlias) {
    const { data: archetype } = await supabase
      .from('fantasy_archetypes')
      .select('id, name')
      .eq('id', alias.archetype_id)
      .single();
    
    console.log(`  Archetype ${alias.archetype_id}: ${archetype?.name}`);
  }
} else {
  console.log('  No one has this alias!');
}

// Check all Dragapult-related aliases
console.log('\n\nAll Dragapult-related aliases in database:');
const { data: allDragapult } = await supabase
  .from('fantasy_archetype_aliases')
  .select('archetype_id, alias')
  .ilike('alias', '%Dragapult%');

const byArchetype = {};
for (const alias of allDragapult || []) {
  if (!byArchetype[alias.archetype_id]) {
    const { data: arch } = await supabase
      .from('fantasy_archetypes')
      .select('name')
      .eq('id', alias.archetype_id)
      .single();
    byArchetype[alias.archetype_id] = { name: arch?.name, aliases: [] };
  }
  byArchetype[alias.archetype_id].aliases.push(alias.alias);
}

for (const [id, data] of Object.entries(byArchetype)) {
  console.log(`\n${data.name} (id: ${id})`);
  data.aliases.forEach(a => console.log(`  - "${a}"`));
}

// Check what's actually in rk9_standings
console.log('\n\nWhat Dragapult entries exist in rk9_standings:');
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('archetype')
  .ilike('archetype', 'Dragapult ex%')
  .limit(100);

const unique = [...new Set(standings?.map(s => s.archetype))];
console.log(`Found ${unique.length} unique Dragapult archetype strings:\n`);
unique.forEach(a => console.log(`  - "${a}"`));

process.exit(0);
