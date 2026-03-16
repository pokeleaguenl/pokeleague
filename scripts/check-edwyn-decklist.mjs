import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Edwyn Mesman Decklist ===\n');

const { data: edwyn } = await supabase
  .from('rk9_standings')
  .select('*')
  .ilike('player_name', 'Edwyn Mesman')
  .eq('rank', 1)
  .single();

console.log('Player:', edwyn.player_name);
console.log('Rank:', edwyn.rank);
console.log('Archetype:', edwyn.archetype);
console.log('Tournament:', edwyn.tournament_id);
console.log('\nCard List (first 500 chars):');
console.log(edwyn.card_list?.substring(0, 500) || 'No card list');
console.log('\nDecklist URL:', edwyn.decklist_url);

// Check if we can re-classify
console.log('\n=== Re-running classifier on this decklist ===');

if (edwyn.card_list) {
  const cardList = edwyn.card_list.toLowerCase();
  
  // Check for key cards
  const hasMegaAbsol = cardList.includes('mega absol');
  const hasAbsol = cardList.includes('absol');
  const hasMegaKangaskhan = cardList.includes('mega kangaskhan');
  const hasKangaskhan = cardList.includes('kangaskhan');
  
  console.log(`Has Mega Absol: ${hasMegaAbsol}`);
  console.log(`Has Absol: ${hasAbsol}`);
  console.log(`Has Mega Kangaskhan: ${hasMegaKangaskhan}`);
  console.log(`Has Kangaskhan: ${hasKangaskhan}`);
  
  if (hasMegaAbsol && hasMegaKangaskhan) {
    console.log('\n✅ SHOULD BE CLASSIFIED AS: Mega Absol ex / Mega Kangaskhan ex');
  }
}

process.exit(0);
