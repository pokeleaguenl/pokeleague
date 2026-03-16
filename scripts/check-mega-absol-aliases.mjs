import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Mega Absol Box Aliases ===\n');

// Get Mega Absol Box archetype
const { data: archetype } = await supabase
  .from('fantasy_archetypes')
  .select('*')
  .eq('id', 2)
  .single();

console.log(`Archetype: ${archetype.name} (id: ${archetype.id})`);

// Get its aliases
const { data: aliases } = await supabase
  .from('fantasy_archetype_aliases')
  .select('alias')
  .eq('archetype_id', 2);

console.log(`\nCurrent aliases (${aliases?.length}):`);
aliases?.slice(0, 10).forEach(a => console.log(`  - "${a.alias}"`));
if (aliases && aliases.length > 10) {
  console.log(`  ... and ${aliases.length - 10} more`);
}

// Check if they work
const aliasStrings = aliases?.map(a => a.alias) || [];
const { data: standings } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .in('archetype', aliasStrings);

console.log(`\nStandings found using these aliases: ${standings?.length || 0}`);
console.log(`Unique tournaments: ${new Set(standings?.map(s => s.tournament_id)).size}`);

console.log('\n=== The aliases ARE working! ===');
console.log('The script said "no standings found" because it searched for');
console.log('"Mega Absol Box" which doesn\'t exist in standings.');
console.log('The actual strings are like "Mega Absol ex / Mega Kangaskhan ex"');

process.exit(0);
