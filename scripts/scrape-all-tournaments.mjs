import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = 'https://rk9.gg';
const PAGE_DELAY = 1500;
const CLAUDE_DELAY = 500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Claude archetype classifier ──────────────────────────────────────────────
async function classifyArchetype(cardList) {
  if (!ANTHROPIC_API_KEY) return 'Unknown';
  const prompt = `You are a Pokemon TCG expert. Given this decklist, return ONLY the archetype name (e.g. "Dragapult ex / Dusknoir", "Gardevoir ex", "Charizard ex / Pidgeot ex", "Raging Bolt ex", "Gholdengo ex"). Be concise - just the archetype name, nothing else.\n\nDecklist:\n${cardList}`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 50, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) return 'Unknown';
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || 'Unknown';
  } catch { return 'Unknown'; }
}

// ── Roster scraper ───────────────────────────────────────────────────────────
async function scrapeFullRoster(page, tournamentId) {
  console.log('  Scraping roster...');
  const players = [];
  let pageNum = 0;
  await page.goto(`${BASE_URL}/roster/${tournamentId}`, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  while (true) {
    pageNum++;
    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll('table tbody tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const link = row.querySelector('a[href*="decklist"]');
        return {
          firstName: cells[1]?.textContent?.trim() || '',
          lastName: cells[2]?.textContent?.trim() || '',
          country: cells[3]?.textContent?.trim() || '',
          division: cells[4]?.textContent?.trim() || '',
          decklistUrl: link?.href || null,
        };
      }).filter(r => r.firstName)
    );
    players.push(...rows);
    const hasNext = await page.evaluate(() => {
      const next = document.querySelector('a.paginate_button.next, li.next a');
      return next && !next.classList.contains('disabled') && !next.closest('li')?.classList.contains('disabled');
    });
    if (!hasNext) break;
    await page.evaluate(() => document.querySelector('a.paginate_button.next, li.next a')?.click());
    await sleep(1000);
  }
  console.log(`  Roster: ${players.length} players`);
  return players;
}

// ── Standings scraper ────────────────────────────────────────────────────────
function parseStandingsText(bodyText, round) {
  const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
  const players = [];
  for (let i = 0; i < lines.length; i++) {
    const recMatch = lines[i].match(/^\((\d+)-(\d+)-(\d+)\)$/);
    if (recMatch) {
      const wins=+recMatch[1], losses=+recMatch[2], ties=+recMatch[3];
      const nameParts = [];
      for (let j = Math.max(0,i-3); j < i; j++) {
        const l = lines[j];
        if (/^\d+$/.test(l) || /^(Table|Round|R\d+|Player|Standings|Show|Masters|Senior|Junior)$/i.test(l)) continue;
        if (l.length > 0 && l.length < 40) nameParts.push(l);
      }
      const name = nameParts.slice(-2).join(' ').trim();
      if (name && !players.find(p => p.name === name))
        players.push({ rank: players.length+1, name, wins, losses, ties, record: `${wins}-${losses}-${ties}`, round });
    }
  }
  return players;
}

async function scrapeStandings(page, tournamentId) {
  console.log('  Scraping standings...');
  await page.goto(`${BASE_URL}/pairings/${tournamentId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  const bodyText = await page.locator('body').innerText();
  const roundMatches = [...bodyText.matchAll(/(\w+)\s+in\s+Round\s+(\d+)/g)];
  const mastersMatch = roundMatches.find(m => /masters/i.test(m[1]));
  const maxRound = mastersMatch ? parseInt(mastersMatch[2], 10) : 9;
  console.log(`  Final round: ${maxRound}`);
  const roundBtn = page.getByText(`R${maxRound}`, { exact: true });
  if (await roundBtn.count() > 0) { await roundBtn.first().click(); await sleep(2000); }
  const standingsTab = page.getByText('Standings', { exact: true });
  if (await standingsTab.count() > 0) { await standingsTab.first().click(); await sleep(3000); }
  const players = parseStandingsText(await page.locator('body').innerText(), maxRound);
  console.log(`  Standings: ${players.length} players`);
  return { players, maxRound };
}

// ── Decklist scraper ─────────────────────────────────────────────────────────
async function scrapeDecklist(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(800);
  return page.locator('body').innerText();
}

// ── Ingest JSON to Supabase ──────────────────────────────────────────────────
async function ingestToSupabase(records, rk9Id) {
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const { error } = await supabase
      .from('rk9_standings')
      .upsert(records.slice(i, i+100), { onConflict: 'tournament_id,round,player_name' });
    if (error) console.error(`  DB error batch ${i/100+1}:`, error.message);
    else inserted += Math.min(100, records.length - i);
  }
  return inserted;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id, name, rk9_id, event_date')
  .gte('event_date', '2025-01-01')
  .order('event_date', { ascending: true });

// Check which are already ingested
const { data: ingested } = await supabase
  .from('rk9_standings')
  .select('tournament_id')
  .limit(5000);
const ingestedIds = new Set(ingested?.map(s => s.tournament_id) || []);

const pending = tournaments.filter(t => !ingestedIds.has(t.rk9_id));
console.log(`\nTournaments to scrape: ${pending.length} of ${tournaments.length}`);
pending.forEach(t => console.log(`  - ${t.name} (${t.event_date})`));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const t of pending) {
  const jsonFile = `scripts/standings_${t.rk9_id}.json`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Tournament: ${t.name} | ${t.event_date} | ${t.rk9_id}`);

  // Skip if JSON already scraped but not ingested
  if (existsSync(jsonFile)) {
    console.log(`  JSON exists, ingesting directly...`);
    const { default: records } = await import(`./${jsonFile}`, { assert: { type: 'json' } });
    const n = await ingestToSupabase(records, t.rk9_id);
    console.log(`  ✅ Ingested ${n} records from existing JSON`);
    continue;
  }

  try {
    // 1. Scrape roster (Masters only)
    let roster = await scrapeFullRoster(page, t.rk9_id);
    roster = roster.filter(p => /masters/i.test(p.division));
    console.log(`  Masters players: ${roster.length}`);

    // 2. Scrape standings
    const { players: standings, maxRound } = await scrapeStandings(page, t.rk9_id);
    const standingsMap = Object.fromEntries(
      standings.map(s => [s.name.toLowerCase(), s])
    );

    // 3. Process each player
    const results = [];
    const withDecklists = roster.filter(p => p.decklistUrl).length;
    console.log(`  Processing ${roster.length} players (${withDecklists} have decklists)...`);

    for (let i = 0; i < roster.length; i++) {
      const player = roster[i];
      const fullName = `${player.firstName} ${player.lastName}`.trim();
      const standing = standingsMap[fullName.toLowerCase()];

      let archetype = null, cardList = null;
      if (player.decklistUrl) {
        try {
          cardList = await scrapeDecklist(page, player.decklistUrl);
          await sleep(PAGE_DELAY);
          if (cardList?.length > 10) {
            archetype = await classifyArchetype(cardList);
            await sleep(CLAUDE_DELAY);
          }
        } catch (e) { console.warn(`  ⚠ Failed ${fullName}: ${e.message}`); }
      }

      results.push({
        tournament_id: t.rk9_id,
        round: maxRound,
        rank: standing?.rank || null,
        player_name: fullName,
        first_name: player.firstName,
        last_name: player.lastName,
        country: player.country,
        division: player.division,
        wins: standing?.wins || null,
        losses: standing?.losses || null,
        ties: standing?.ties || null,
        record: standing?.record || null,
        archetype,
        decklist_url: player.decklistUrl,
        card_list: cardList,
      });

      if ((i+1) % 50 === 0) console.log(`  Progress: ${i+1}/${roster.length}`);
    }

    // 4. Save JSON
    writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`  💾 Saved ${results.length} records to ${jsonFile}`);

    // 5. Ingest to Supabase
    const n = await ingestToSupabase(results, t.rk9_id);
    console.log(`  ✅ Ingested ${n} records`);

  } catch(e) {
    console.error(`  ❌ Error: ${e.message}`);
  }
}

await browser.close();
console.log('\n\nAll done!');
