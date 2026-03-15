import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding archetypes with missing or insufficient aliases ===\n');

// Get all archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, slug, name')
  .order('id');

console.log(`Checking ${archetypes?.length || 0} archetypes...\n`);

const problems = [];

for (const archetype of archetypes || []) {
  // Count aliases
  const { count: aliasCount } = await supabase
    .from('fantasy_archetype_aliases')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  // Check if this archetype appears in any standings
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('archetype')
    .ilike('archetype', `%${archetype.name.split(' ')[0]}%`)
    .limit(5);
  
  if (aliasCount === 0) {
    problems.push({
      id: archetype.id,
      name: archetype.name,
      slug: archetype.slug,
      aliasCount: 0,
      standingsFound: standings?.length || 0,
      issue: 'NO_ALIASES'
    });
  }
}

if (problems.length === 0) {
  console.log('✅ All archetypes have aliases!');
} else {
  console.log(`⚠️  Found ${problems.length} archetypes with NO aliases:\n`);
  
  problems.forEach(p => {
    const status = p.standingsFound > 0 ? '🔴 HAS DATA' : '⚪ No data';
    console.log(`  ${status} ${p.name} (id: ${p.id})`);
  });
  
  const withData = problems.filter(p => p.standingsFound > 0);
  console.log(`\n🔴 ${withData.length} archetypes have standings data but NO aliases`);
  console.log(`⚪ ${problems.length - withData.length} archetypes have no data (may be unused)`);
}

process.exit(0);
