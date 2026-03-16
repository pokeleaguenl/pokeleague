import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking existing aliases schema ===');
const { data: sample } = await supabase
  .from('fantasy_archetype_aliases')
  .select('*')
  .limit(3);

console.log('Sample rows:');
console.log(JSON.stringify(sample, null, 2));

process.exit(0);
