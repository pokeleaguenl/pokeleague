#!/usr/bin/env node
/**
 * scrape-ranks.mjs — scrape final standings/ranks from RK9 roster pages
 * Updates rank, wins, losses, ties, record in rk9_standings
 * Usage: node scripts/scrape-ranks.mjs --tournament SE01gUuRn8bJqbH9Wnt1
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const tournamentId = args[args.indexOf('--tournament') + 1];
if (!tournamentId) { console.error('Usage: node scrape-ranks.mjs --tournament <rk9_id>'); process.exit(1); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log(`Scraping roster ranks for ${tournamentId}...`);
await page.goto(`https://rk9.gg/roster/${tournamentId}`, { waitUntil: 'networkidle', timeout: 30000 });
await sleep(2000);

// Set table to show max rows
try {
  await page.selectOption('select[name$="_length"]', '100');
  await sleep(1500);
} catch(e) {}

const allPlayers = [];
let pageNum = 0;

while (true) {
  pageNum++;
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table tbody tr')).map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        firstName: cells[1]?.textContent?.trim() || '',
        lastName:  cells[2]?.textContent?.trim() || '',
        rank:      parseInt(cells[6]?.textContent?.trim()) || null,
        record:    cells[7]?.textContent?.trim() || null,
      };
    }).filter(r => r.firstName);
  });

  allPlayers.push(...rows);
  console.log(`  Page ${pageNum}: +${rows.length} rows (total: ${allPlayers.length})`);

  const hasNext = await page.evaluate(() => {
    const next = document.querySelector('a.paginate_button.next, li.next a');
    return next && !next.classList.contains('disabled') && !next.closest('li')?.classList.contains('disabled');
  });
  if (!hasNext) break;
  await page.evaluate(() => document.querySelector('a.paginate_button.next, li.next a')?.click());
  await sleep(1500);
}

await browser.close();

const ranked = allPlayers.filter(p => p.rank);
console.log(`\nScraped ${allPlayers.length} players, ${ranked.length} with ranks`);

if (ranked.length === 0) {
  console.log('No rank data found — standings may not be published yet');
  process.exit(0);
}

// Parse record "W-L-T"
function parseRecord(record) {
  if (!record) return { wins: null, losses: null, ties: null };
  const m = record.match(/(\d+)-(\d+)(?:-(\d+))?/);
  if (!m) return { wins: null, losses: null, ties: null };
  return { wins: parseInt(m[1]), losses: parseInt(m[2]), ties: parseInt(m[3] ?? 0) };
}

// Update in batches by player name
let updated = 0;
let notFound = 0;
for (const player of ranked) {
  const fullName = `${player.firstName} ${player.lastName}`.trim();
  const { wins, losses, ties } = parseRecord(player.record);
  const { error, count } = await supabase
    .from('rk9_standings')
    .update({ rank: player.rank, record: player.record, wins, losses, ties })
    .eq('tournament_id', tournamentId)
    .ilike('player_name', fullName)
    .select('id', { count: 'exact', head: true });

  if (error) { console.error(`  ❌ ${fullName}: ${error.message}`); }
  else if (count === 0) { notFound++; }
  else { updated++; if (updated <= 10) console.log(`  ✅ ${player.rank}. ${fullName} (${player.record})`); }
}

console.log(`\nUpdated: ${updated}, Not found: ${notFound}`);
