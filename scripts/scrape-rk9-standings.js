#!/usr/bin/env node

/**
 * Scrape standings from RK9 pairings pages
 * Extracts player names, placements, and deck names (when available)
 */

const https = require('https');

async function fetchRK9Standings(rk9Id) {
  return new Promise((resolve, reject) => {
    const url = `https://rk9.gg/pairings/${rk9Id}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        
        // Parse standings section
        const standings = parseStandings(data);
        resolve(standings);
      });
    }).on('error', reject);
  });
}

function parseStandings(html) {
  const standings = [];
  
  // Look for the standings section - it's a numbered list after "Standings" anchor
  // Format: "1. PlayerName [Country]\n2. PlayerName [Country]\n..."
  
  // Find all numbered entries like "123. Name [CC]"
  const standingsRegex = /(\d+)\.\s+([^\[]+)\s+\[([A-Z]{2})\]/g;
  
  let match;
  while ((match = standingsRegex.exec(html)) !== null) {
    const [, placement, playerName, country] = match;
    
    standings.push({
      placement: parseInt(placement, 10),
      player_name: playerName.trim(),
      country: country,
      deck_name: null, // RK9 pairings don't include deck names
    });
  }
  
  return standings;
}

// Test with Seattle tournament
if (require.main === module) {
  const testId = process.argv[2] || 'SE01gUuRn8bJqbH9Wnt1';
  
  console.log(`🔍 Fetching standings for RK9 ID: ${testId}\n`);
  
  fetchRK9Standings(testId)
    .then(standings => {
      console.log(`✅ Found ${standings.length} players in standings\n`);
      
      // Show top 32
      console.log('Top 32:');
      standings.slice(0, 32).forEach(s => {
        console.log(`  ${s.placement}. ${s.player_name} [${s.country}]`);
      });
      
      // Show placement distribution
      const top8 = standings.filter(s => s.placement <= 8).length;
      const top16 = standings.filter(s => s.placement <= 16).length;
      const top32 = standings.filter(s => s.placement <= 32).length;
      const top64 = standings.filter(s => s.placement <= 64).length;
      
      console.log(`\n📊 Distribution:`);
      console.log(`   Top 8: ${top8}`);
      console.log(`   Top 16: ${top16}`);
      console.log(`   Top 32: ${top32}`);
      console.log(`   Top 64: ${top64}`);
      console.log(`   Total: ${standings.length}`);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { fetchRK9Standings };
