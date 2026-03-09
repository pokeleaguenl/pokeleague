#!/usr/bin/env node

/**
 * Sync decks and fantasy archetypes from rk9_standings data
 * Calculates meta stats and populates fantasy_archetypes + decks tables
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bmmkjbjnszysxppiekhv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWtqYmpuc3p5c3hwcGlla2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2NzA1MiwiZXhwIjoyMDg4MTQzMDUyfQ.yOuVKvU61xkvexxtNn_KzPisadhoxPa8EClVppylumI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generate URL-friendly slug from archetype name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate fantasy cost based on meta performance
 */
function calculateCost(metaShare, topFinish, playerCount) {
  // Base cost from meta share
  let cost = Math.round(metaShare * 4);
  
  // Bonus for top finishes
  if (topFinish <= 8) cost += 15;
  else if (topFinish <= 16) cost += 10;
  else if (topFinish <= 32) cost += 5;
  
  // Minimum costs based on player count
  if (playerCount >= 100) cost = Math.max(cost, 35);
  else if (playerCount >= 50) cost = Math.max(cost, 25);
  else if (playerCount >= 20) cost = Math.max(cost, 15);
  else if (playerCount >= 10) cost = Math.max(cost, 10);
  else cost = Math.max(cost, 5);
  
  // Cap at reasonable max
  return Math.min(cost, 50);
}

/**
 * Determine tier based on meta share
 */
function calculateTier(metaShare, topFinish) {
  if (metaShare >= 8 && topFinish <= 16) return 'S';
  if (metaShare >= 5 || (metaShare >= 3 && topFinish <= 8)) return 'A';
  if (metaShare >= 2 || topFinish <= 16) return 'B';
  if (metaShare >= 1) return 'C';
  return 'D';
}

/**
 * Get representative decklist for an archetype
 * Returns card_list from the top finisher
 */
function getRepresentativeDecklist(standings) {
  if (!standings || standings.length === 0) return null;
  
  // Sort by rank (lower is better)
  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  
  // Return card_list from top finisher
  return sorted[0].card_list || null;
}

/**
 * Aggregate rk9_standings by archetype
 */
async function aggregateMetaData(tournamentId = 'SG0167ss5UCjklsDaPrA', round = 18) {
  console.log(`📊 Aggregating meta data from tournament ${tournamentId}, round ${round}...\n`);
  
  const { data: standings, error } = await supabase
    .from('rk9_standings')
    .select('archetype, rank, card_list, decklist_url')
    .eq('tournament_id', tournamentId)
    .eq('round', round)
    .not('archetype', 'is', null);
  
  if (error) {
    console.error('❌ Error fetching standings:', error.message);
    return [];
  }
  
  console.log(`✅ Loaded ${standings.length} standings entries\n`);
  
  // Group by archetype
  const meta = {};
  standings.forEach(row => {
    if (!meta[row.archetype]) {
      meta[row.archetype] = {
        archetype: row.archetype,
        players: 0,
        ranks: [],
        standings: []
      };
    }
    meta[row.archetype].players++;
    meta[row.archetype].ranks.push(row.rank);
    meta[row.archetype].standings.push(row);
  });
  
  // Calculate stats for each archetype
  const totalPlayers = standings.length;
  const metaStats = Object.values(meta).map(stats => {
    const avgPlacement = Math.round(
      stats.ranks.reduce((sum, r) => sum + r, 0) / stats.ranks.length
    );
    const topFinish = Math.min(...stats.ranks);
    const metaShare = (stats.players / totalPlayers) * 100;
    const cost = calculateCost(metaShare, topFinish, stats.players);
    const tier = calculateTier(metaShare, topFinish);
    const representativeDecklist = getRepresentativeDecklist(stats.standings);
    
    return {
      name: stats.archetype,
      slug: generateSlug(stats.archetype),
      players: stats.players,
      metaShare: parseFloat(metaShare.toFixed(2)),
      avgPlacement,
      topFinish,
      cost,
      tier,
      representativeDecklist
    };
  });
  
  // Sort by player count descending
  metaStats.sort((a, b) => b.players - a.players);
  
  console.log(`📈 Aggregated ${metaStats.length} unique archetypes\n`);
  
  return metaStats;
}

/**
 * Sync fantasy_archetypes table
 */
async function syncFantasyArchetypes(metaStats) {
  console.log('🔄 Syncing fantasy_archetypes table...\n');
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const deck of metaStats) {
    // Check if archetype exists
    const { data: existing } = await supabase
      .from('fantasy_archetypes')
      .select('id, slug')
      .eq('slug', deck.slug)
      .maybeSingle();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('fantasy_archetypes')
        .update({
          name: deck.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error(`   ❌ Failed to update ${deck.name}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('fantasy_archetypes')
        .insert({
          slug: deck.slug,
          name: deck.name,
          image_url: null // TODO: Add card art URLs later
        });
      
      if (error) {
        console.error(`   ❌ Failed to insert ${deck.name}:`, error.message);
        errors++;
      } else {
        inserted++;
      }
    }
  }
  
  console.log(`✅ Fantasy archetypes sync complete:`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}\n`);
  
  return { inserted, updated, errors };
}

/**
 * Sync decks table
 */
async function syncDecks(metaStats) {
  console.log('🔄 Syncing decks table...\n');
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const deck of metaStats) {
    // Get archetype_id from fantasy_archetypes
    const { data: archetype } = await supabase
      .from('fantasy_archetypes')
      .select('id')
      .eq('slug', deck.slug)
      .maybeSingle();
    
    if (!archetype) {
      console.error(`   ⚠️  No archetype found for ${deck.name}, skipping`);
      continue;
    }
    
    // Check if deck exists
    const { data: existing } = await supabase
      .from('decks')
      .select('id')
      .eq('archetype_id', archetype.id)
      .maybeSingle();
    
    const deckData = {
      name: deck.name,
      archetype_id: archetype.id,
      meta_share: deck.metaShare,
      cost: deck.cost,
      tier: deck.tier,
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('decks')
        .update(deckData)
        .eq('id', existing.id);
      
      if (error) {
        console.error(`   ❌ Failed to update ${deck.name}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('decks')
        .insert(deckData);
      
      if (error) {
        console.error(`   ❌ Failed to insert ${deck.name}:`, error.message);
        errors++;
      } else {
        inserted++;
      }
    }
  }
  
  console.log(`✅ Decks sync complete:`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}\n`);
  
  return { inserted, updated, errors };
}

/**
 * Main sync process
 */
async function syncAll() {
  console.log('🚀 Syncing decks from RK9 standings\n');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Step 1: Aggregate meta data
    const metaStats = await aggregateMetaData();
    
    if (metaStats.length === 0) {
      console.error('❌ No meta data found. Aborting.');
      process.exit(1);
    }
    
    // Show top 10 preview
    console.log('📋 Top 10 Archetypes:\n');
    metaStats.slice(0, 10).forEach((deck, i) => {
      console.log(`${i + 1}. ${deck.name}`);
      console.log(`   Players: ${deck.players} (${deck.metaShare}%)`);
      console.log(`   Top Finish: ${deck.topFinish} | Avg: ${deck.avgPlacement}`);
      console.log(`   Cost: ${deck.cost}pts | Tier: ${deck.tier}\n`);
    });
    
    // Step 2: Sync fantasy_archetypes
    const archetypeResults = await syncFantasyArchetypes(metaStats);
    
    // Step 3: Sync decks
    const deckResults = await syncDecks(metaStats);
    
    // Summary
    console.log('='.repeat(60));
    console.log('✅ Sync complete!\n');
    console.log('Summary:');
    console.log(`  Fantasy Archetypes: ${archetypeResults.inserted} inserted, ${archetypeResults.updated} updated`);
    console.log(`  Decks: ${deckResults.inserted} inserted, ${deckResults.updated} updated`);
    console.log(`  Total Errors: ${archetypeResults.errors + deckResults.errors}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
syncAll();
