import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Fixing last two winners ===\n');

// Fix Rajveer
const { error: rajveerError } = await supabase
  .from('rk9_standings')
  .update({ archetype: "Marnie's Grimmsnarl ex" })
  .ilike('player_name', 'Rajveer Singh')
  .eq('rank', 1);

if (rajveerError) {
  console.log('❌ Rajveer failed:', rajveerError.message);
} else {
  console.log("✅ Rajveer Singh → Marnie's Grimmsnarl ex");
}

// Fix Lucas
const { error: lucasError } = await supabase
  .from('rk9_standings')
  .update({ archetype: 'Gholdengo ex / Genesect ex' })
  .ilike('player_name', 'Lucas Hamilton-Foster')
  .eq('rank', 1);

if (lucasError) {
  console.log('❌ Lucas failed:', lucasError.message);
} else {
  console.log('✅ Lucas Hamilton-Foster → Gholdengo ex / Genesect ex');
}

// Verify all winners are now classified
const { count } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true })
  .eq('archetype', 'Unknown')
  .eq('rank', 1);

console.log(`\n${count === 0 ? '✅' : '⚠️'} Remaining rank 1 Unknown entries: ${count}`);

process.exit(0);
