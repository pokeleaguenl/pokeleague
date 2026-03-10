import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = JSON.parse(readFileSync('scripts/standings_SG0167ss5UCjklsDaPrA_round18.json', 'utf8'));

console.log(`Importing ${data.length} records...`);

// Insert in batches of 100
for (let i = 0; i < data.length; i += 100) {
  const batch = data.slice(i, i + 100);
  const { error } = await supabase
    .from('rk9_standings')
    .upsert(batch, { onConflict: 'tournament_id,round,player_name' });
  
  if (error) console.error(`Batch ${i/100 + 1} error:`, error.message);
  else console.log(`Batch ${i/100 + 1}: inserted ${batch.length} records`);
}

console.log('Done!');
