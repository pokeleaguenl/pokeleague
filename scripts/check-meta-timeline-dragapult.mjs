import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking Meta Timeline Data ===\n');

// Get the deck list used by meta timeline (top 8 by meta share)
const { data: topDecks } = await supabase
  .rpc('get_deck_list_with_points')
  .order('meta_share', { ascending: false })
  .limit(8);

console.log('Top 8 decks shown in meta timeline:');
topDecks?.forEach((d, i) => {
  console.log(`${i + 1}. ${d.deck_name} (${d.meta_share}% meta, archetype_id: ${d.archetype_id})`);
});

// Check if there's a "Dragapult ex" without Dusknoir
const { data: dragapultVariants } = await supabase
  .from('fantasy_archetypes')
  .select('id, name')
  .ilike('name', '%dragapult%');

console.log('\nAll Dragapult variants in fantasy_archetypes:');
dragapultVariants?.forEach(d => {
  console.log(`  ID ${d.id}: ${d.name}`);
});

// Check if Dragapult ex (base) exists
const baseDragapult = dragapultVariants?.find(d => d.name === 'Dragapult ex');
if (baseDragapult) {
  console.log(`\n=== Base "Dragapult ex" found (ID: ${baseDragapult.id}) ===`);
  
  const { data: aliases } = await supabase
    .from('fantasy_archetype_aliases')
    .select('alias')
    .eq('archetype_id', baseDragapult.id);
  
  console.log(`Aliases: ${aliases?.length || 0}`);
  aliases?.forEach(a => console.log(`  - "${a.alias}"`));
  
  // Get standings count
  if (aliases && aliases.length > 0) {
    const { count } = await supabase
      .from('rk9_standings')
      .select('*', { count: 'exact', head: true })
      .in('archetype', aliases.map(a => a.alias));
    
    console.log(`Total standings: ${count || 0}`);
  }
} else {
  console.log('\n❌ No base "Dragapult ex" archetype found!');
}

// Check what "Ursaluna ex / Dusclops" actually has in standings
console.log('\n=== Ursaluna ex / Dusclops standings ===');
const { count: ursalunaCount } = await supabase
  .from('rk9_standings')
  .select('*', { count: 'exact', head: true })
  .eq('archetype', 'Ursaluna ex / Dusclops');

console.log(`Ursaluna ex / Dusclops entries: ${ursalunaCount || 0}`);

// Sample some standings
const { data: ursalunaSample } = await supabase
  .from('rk9_standings')
  .select('player_name, archetype, rank, tournament_id')
  .eq('archetype', 'Ursaluna ex / Dusclops')
  .limit(5);

console.log('Sample Ursaluna ex / Dusclops standings:');
ursalunaSample?.forEach(s => {
  console.log(`  ${s.player_name}: Rank #${s.rank}`);
});

console.log('\n=== CONCLUSION ===');
console.log('If meta timeline shows "Ursaluna ex / Dusclops" with high numbers,');
console.log('it might actually BE Ursaluna, not mislabeled Dragapult.');
console.log('Check which deck is showing the wrong numbers.');

process.exit(0);
