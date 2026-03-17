import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking fantasy_archetypes Schema ===\n');

const { data: sample } = await supabase
  .from('fantasy_archetypes')
  .select('*')
  .limit(1);

if (sample && sample.length > 0) {
  console.log('Columns in fantasy_archetypes:');
  console.log(Object.keys(sample[0]));
  console.log('\nSample record:');
  console.log(JSON.stringify(sample[0], null, 2));
}

process.exit(0);
