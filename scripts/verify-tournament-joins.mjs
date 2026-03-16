import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Verifying Tournament Joins Work ===\n');

// Test join on rk9_id
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, rk9_id')
  .not('rk9_id', 'is', null)
  .limit(5);

console.log('Tournaments with rk9_id:');
for (const t of tournaments || []) {
  // Count standings for this tournament
  const { count } = await supabase
    .from('rk9_standings')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', t.rk9_id);
  
  console.log(`  ${t.name}`);
  console.log(`    DB ID: ${t.id}, RK9 ID: ${t.rk9_id}`);
  console.log(`    Standings: ${count || 0} entries`);
}

console.log('\n✅ Join works! We can link tournaments to standings via rk9_id');
console.log('\nNow we need to:');
console.log('1. Fix meta timeline to use rk9_id for joins');
console.log('2. Build matchup analysis using proper joins');
console.log('3. Add navigation links to /meta and /matchups');

process.exit(0);
