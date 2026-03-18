import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const deckMapping = {
  'gholdengo-lunatone': 'Gholdengo ex / Lunatone',
  'n-zoroark': 'N\'s Zoroark ex',
  'gardevoir-jellicent': 'Gardevoir ex / Jellicent',
  'dragapult-dusknoir': 'Dragapult ex / Dusknoir',
  'raging-bolt-ogerpon': 'Raging Bolt ex / Ogerpon ex',
  'froslass-munkidori': 'Froslass Munkidori',
  'crustle-dri': 'Crustle Mysterious Rock Inn',
  'mega-absol-box': 'Mega Absol Box',
  'gardevoir-ex-sv': 'Gardevoir ex',
  'alakazam-dudunsparce': 'Alakazam ex / Dudunsparce',
  'charizard-noctowl': 'Charizard ex / Noctowl',
  'grimmsnarl-froslass': 'Grimmsnarl / Froslass',
  'ceruledge-ex': 'Ceruledge ex',
  'joltik-box': 'Joltik Box',
  'dragapult-ex': 'Dragapult ex',
  'charizard-pidgeot': 'Charizard ex / Pidgeot ex',
  'dragapult-blaziken': 'Dragapult ex / Blaziken ex',
  'ethan-typhlosion': 'Typhlosion',
  'tera-box': 'Tera Box',
  'festival-lead': 'Dipplin / Thwackey',
  'greninja-ex': 'Greninja ex',
  'dragapult-charizard': 'Dragapult ex / Charizard ex',
  'future-box': 'Miraidon ex / Iron Crown ex',
  'kangaskhan-bouffalant': 'Kangaskhan ex / Bouffalant',
  'ogerpon-meganium': 'Ogerpon ex / Meganium',
  'mega-venusaur-ex': 'Mega Venusaur ex'
};

async function scrapeFullStandings(rk9Id) {
  console.log(`\n🚀 Launching headless browser...`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });
  
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);
  
  try {
    console.log(`📥 Navigating to Limitless Labs page for ${rk9Id}...`);
    
    await page.goto(`https://labs.limitlesstcg.com/0057/standings`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log(`⏳ Waiting for table to load...`);
    await page.waitForSelector('table', { timeout: 30000 });
    
    console.log(`✅ Page loaded, attempting to disable top 512 filter...`);
    
    try {
      const filterClicked = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.textContent && el.textContent.includes('top 512 filter ON')) {
            if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick || el.style.cursor === 'pointer') {
              el.click();
              return true;
            }
          }
        }
        return false;
      });
      
      if (filterClicked) {
        console.log(`✅ Filter toggle clicked, waiting for data to reload...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log(`⚠️  Could not find clickable filter toggle`);
        console.log(`   Proceeding with visible data...`);
      }
    } catch (error) {
      console.log(`⚠️  Filter toggle interaction failed: ${error.message}`);
      console.log(`   Proceeding with visible data...`);
    }
    
    console.log(`📊 Extracting standings data...`);
    
    const standings = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 8) return null;
        
        const rankText = cells[0]?.innerText.trim();
        if (rankText.includes('Top Cut')) return null;
        const rank = parseInt(rankText);
        if (isNaN(rank)) return null;
        
        const nameElement = cells[1]?.querySelector('a');
        const name = nameElement ? nameElement.innerText.trim() : cells[1]?.innerText.trim();
        
        const countryImg = cells[2]?.querySelector('img');
        const country = countryImg?.alt || '';
        
        const deckLink = cells[7]?.querySelector('a');
        const deckSlug = deckLink ? deckLink.href.split('/').pop() : '';
        
        return {
          rank: rank,
          player_name: name,
          country: country,
          archetype_slug: deckSlug
        };
      }).filter(Boolean);
    });
    
    console.log(`✅ Extracted ${standings.length} player standings`);
    
    await browser.close();
    
    return standings;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function importStandings(rk9Id, standings) {
  console.log(`\n💾 Importing ${standings.length} standings to database...`);
  
  const mappedStandings = standings.map(s => ({
    tournament_id: rk9Id,
    player_name: s.player_name,
    rank: s.rank,
    country: s.country,
    archetype: deckMapping[s.archetype_slug] || s.archetype_slug || 'Unknown'
  }));
  
  const unknownDecks = new Set();
  mappedStandings.forEach((s, idx) => {
    const slug = standings[idx]?.archetype_slug;
    if (slug && !deckMapping[slug]) {
      unknownDecks.add(slug);
    }
  });
  
  if (unknownDecks.size > 0) {
    console.log(`⚠️  Unknown deck slugs found (will import as-is):`);
    unknownDecks.forEach(deck => console.log(`   - ${deck}`));
  }
  
  console.log(`🗑️  Clearing existing standings for tournament ${rk9Id}...`);
  await supabase
    .from('rk9_standings')
    .delete()
    .eq('tournament_id', rk9Id);
  
  const chunkSize = 500;
  let imported = 0;
  
  for (let i = 0; i < mappedStandings.length; i += chunkSize) {
    const chunk = mappedStandings.slice(i, i + chunkSize);
    
    const { error } = await supabase
      .from('rk9_standings')
      .insert(chunk);
    
    if (error) {
      console.error(`❌ Error importing chunk ${i}-${i + chunk.length}:`, error);
    } else {
      imported += chunk.length;
      console.log(`✅ Imported ${imported}/${mappedStandings.length} standings`);
    }
  }
  
  console.log(`\n🎉 Import complete! ${imported} standings in database.`);
  return imported;
}

async function scoreAllSquads(tournamentId, rk9Id) {
  console.log(`\n🏆 Calculating scores for all squads...`);
  
  const { data: squads } = await supabase.from('squads').select('*');
  console.log(`📋 Found ${squads.length} squads to score`);
  
  const { data: archetypes } = await supabase
    .from('fantasy_archetypes')
    .select('id, name');
  
  const archetypeMap = new Map(archetypes.map(a => [a.id, a.name]));
  
  const { data: standings } = await supabase
    .from('rk9_standings')
    .select('*')
    .eq('tournament_id', rk9Id);
  
  console.log(`📊 Loaded ${standings.length} standings records`);
  
  const getPoints = (rank) => {
    if (rank === 1) return 100;
    if (rank <= 4) return 75;
    if (rank <= 8) return 50;
    if (rank <= 16) return 25;
    if (rank <= 32) return 10;
    return 0;
  };
  
  let updatedCount = 0;
  
  for (const squad of squads) {
    const deckIds = [
      squad.active_deck_id,
      squad.bench_1, squad.bench_2, squad.bench_3, squad.bench_4, squad.bench_5,
      squad.hand_1, squad.hand_2, squad.hand_3, squad.hand_4
    ].filter(Boolean);
    
    const deckNames = deckIds.map(id => archetypeMap.get(id)).filter(Boolean);
    
    let totalPoints = 0;
    const scoredDecks = [];
    
    for (const deckName of deckNames) {
      const placements = standings.filter(s => s.archetype === deckName);
      
      if (placements.length > 0) {
        const bestPlacement = placements.reduce((best, curr) => 
          curr.rank < best.rank ? curr : best
        );
        
        const points = getPoints(bestPlacement.rank);
        if (points > 0) {
          totalPoints += points;
          scoredDecks.push({
            deck: deckName,
            rank: bestPlacement.rank,
            points: points
          });
        }
      }
    }
    
    // Update squad total_points
    const { error: squadError } = await supabase
      .from('squads')
      .update({ total_points: (squad.total_points || 0) + totalPoints })
      .eq('id', squad.id);
    
    if (squadError) {
      console.error(`❌ Error updating squad ${squad.id}:`, squadError);
      continue;
    }
    
    // Log to tournament_scores table with breakdown
    if (totalPoints > 0) {
      const { error: historyError } = await supabase
        .from('tournament_scores')
        .upsert({
          user_id: squad.user_id,
          tournament_id: tournamentId,
          points_earned: totalPoints,
          squad_snapshot: {
            scored_decks: scoredDecks,
            total_decks: deckNames.length
          }
        }, {
          onConflict: 'user_id,tournament_id'
        });
      
      if (historyError) {
        console.error(`⚠️  Error logging history for user ${squad.user_id}:`, historyError);
      }
      
      updatedCount++;
      console.log(`  User ${squad.user_id}: +${totalPoints} points`);
      scoredDecks.forEach(d => 
        console.log(`    - ${d.deck}: Rank ${d.rank} = ${d.points}pts`)
      );
    }
  }
  
  if (updatedCount === 0) {
    console.log(`ℹ️  No squads scored points for this tournament`);
  } else {
    console.log(`\n✅ Updated ${updatedCount} squads with new points`);
  }
  
  return updatedCount;
}

async function syncProfiles() {
  console.log('\n🔄 Syncing total_points from squads to profiles...');
  
  const { data: squads } = await supabase
    .from('squads')
    .select('user_id, total_points');
  
  for (const squad of squads) {
    await supabase
      .from('profiles')
      .update({ total_points: squad.total_points })
      .eq('id', squad.user_id);
  }
  
  console.log(`✅ Synced ${squads.length} profiles`);
}

async function main() {
  const RK9_ID = 'CU01wDygvn34WEPNJ3ou';
  const TOURNAMENT_ID = 264;
  
  console.log('🎯 AUTOMATED TOURNAMENT IMPORT WITH HISTORY');
  console.log('==========================================\n');
  
  try {
    const standings = await scrapeFullStandings(RK9_ID);
    await importStandings(RK9_ID, standings);
    await scoreAllSquads(TOURNAMENT_ID, RK9_ID);
    await syncProfiles();
    
    console.log('\n🎉 ALL DONE! Tournament imported, scored, history logged, and profiles synced.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
