import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Finding archetypes with missing or insufficient aliases ===\n');

// Get all archetypes
const { data: archetypes, error } = await supabase
  .from('fantasy_archetypes')
  .select('id, slug, name')
  .order('id');

if (error) {
  console.error('Error fetching archetypes:', error);
  process.exit(1);
}

if (!archetypes || archetypes.length === 0) {
  console.log('No archetypes found in database');
  process.exit(0);
}

console.log(`Checking ${archetypes.length} archetypes...\n`);

const problems = [];

for (const archetype of archetypes) {
  // Count aliases
  const { count: aliasCount } = await supabase
    .from('fantasy_archetype_aliases')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  // Check if this archetype appears in any scores
  const { count: scoreCount } = await supabase
    .from('fantasy_archetype_scores_live')
    .select('*', { count: 'exact', head: true })
    .eq('archetype_id', archetype.id);
  
  if (aliasCount === 0) {
    problems.push({
      id: archetype.id,
      name: archetype.name,
      slug: archetype.slug,
      aliasCount: 0,
      scoreCount: scoreCount || 0,
      issue: 'NO_ALIASES'
    });
  } else if (scoreCount === 0 && aliasCount > 0) {
    problems.push({
      id: archetype.id,
      name: archetype.name,
      slug: archetype.slug,
      aliasCount,
      scoreCount: 0,
      issue: 'HAS_ALIASES_BUT_NO_SCORES'
    });
  }
}

if (problems.length === 0) {
  console.log('✅ All archetypes have aliases and scores!');
} else {
  console.log(`⚠️  Found ${problems.length} archetypes with issues:\n`);
  
  const noAliases = problems.filter(p => p.issue === 'NO_ALIASES');
  const noScores = problems.filter(p => p.issue === 'HAS_ALIASES_BUT_NO_SCORES');
  
  if (noAliases.length > 0) {
    console.log(`\n🚨 ${noAliases.length} archetypes with NO ALIASES (critical):`);
    noAliases.forEach(p => {
      console.log(`  - ${p.name} (id: ${p.id}, slug: ${p.slug})`);
    });
  }
  
  if (noScores.length > 0) {
    console.log(`\n⚠️  ${noScores.length} archetypes with aliases but NO SCORES (may be unused):`);
    noScores.forEach(p => {
      console.log(`  - ${p.name} (id: ${p.id}, ${p.aliasCount} aliases)`);
    });
  }
}

process.exit(0);
