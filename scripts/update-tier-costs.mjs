import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getTierAndCost(metaShare) {
  if (metaShare > 10) {
    return { tier: 'S', cost: 50 };
  } else if (metaShare >= 5) {
    // Scale 30-45 within 5-10%
    const cost = Math.round(30 + ((metaShare - 5) / 5) * 15);
    return { tier: 'A', cost };
  } else if (metaShare >= 2) {
    // Scale 20-29 within 2-5%
    const cost = Math.round(20 + ((metaShare - 2) / 3) * 9);
    return { tier: 'B', cost };
  } else if (metaShare >= 1) {
    // Scale 10-19 within 1-2%
    const cost = Math.round(10 + ((metaShare - 1) / 1) * 9);
    return { tier: 'C', cost };
  } else {
    // Scale 5-9 within 0.5-1%
    const cost = Math.round(5 + ((metaShare - 0.5) / 0.5) * 4);
    return { tier: 'D', cost: Math.max(5, cost) };
  }
}

const { data: decks } = await supabase
  .from('decks')
  .select('id, name, tier, cost, meta_share')
  .gte('meta_share', 0.5)
  .order('meta_share', { ascending: false });

console.log('Proposed changes:\n');
const changes = [];
for (const deck of decks) {
  const { tier, cost } = getTierAndCost(deck.meta_share);
  const tierChanged = tier !== deck.tier;
  const costChanged = cost !== deck.cost;
  if (tierChanged || costChanged) {
    console.log(`${deck.name} (${deck.meta_share}%)`);
    if (tierChanged) console.log(`  tier: ${deck.tier} → ${tier}`);
    if (costChanged) console.log(`  cost: ${deck.cost} → ${cost}`);
    changes.push({ id: deck.id, tier, cost });
  }
}

console.log(`\n${changes.length} decks to update.`);

if (process.argv.includes('--apply')) {
  for (const c of changes) {
    const { error } = await supabase
      .from('decks')
      .update({ tier: c.tier, cost: c.cost })
      .eq('id', c.id);
    if (error) console.error(`Error updating ${c.id}:`, error.message);
  }
  console.log('✅ Applied!');
} else {
  console.log('\nRun with --apply to save changes.');
}
