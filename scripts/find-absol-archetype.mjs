import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== SEARCHING FOR ABSOL-RELATED CANONICAL ARCHETYPES ===');
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, slug, name, canonical_id')
  .or('name.ilike.%absol%,slug.ilike.%absol%')
  .order('name');

if (archetypes?.length) {
  archetypes.forEach(a => {
    console.log(`ID: ${a.id} | Slug: ${a.slug} | Name: ${a.name}`);
  });
} else {
  console.log('  NO CANONICAL ARCHETYPES FOUND WITH "ABSOL"');
}

console.log('\n=== CHECKING IF MEGA-ABSOL-BOX SLUG EXISTS ===');
const { data: megaAbsol } = await supabase
  .from('fantasy_archetypes')
  .select('*')
  .eq('slug', 'mega-absol-box')
  .single();

if (megaAbsol) {
  console.log('Found:', megaAbsol);
} else {
  console.log('Slug "mega-absol-box" does NOT exist in fantasy_archetypes!');
}

process.exit(0);
