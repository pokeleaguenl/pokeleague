import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENTS = [
  { id: 1,  rk9: 'SE01gUuRn8bJqbH9Wnt1', name: 'Seattle' },
  { id: 2,  rk9: 'EU01mU0Z1galE2FATDYs', name: 'EUIC' },
  { id: 3,  rk9: 'ST01bmgM9jIqCvBYdzy3', name: 'Santiago' },
  { id: 4,  rk9: 'SY01X6aiblBgAp8tfhjx', name: 'Sydney' },
  { id: 5,  rk9: 'ME01wMEKNaLIfrdxmnhb', name: 'Merida' },
  { id: 6,  rk9: 'BH01mjIWeSb7vxkM9Aer', name: 'Birmingham' },
  { id: 7,  rk9: 'TO01yAfakDVFFDFAV2AS', name: 'Toronto' },
  { id: 9,  rk9: 'LA0126uWiVw5bRySlkA2', name: 'LAIC' },
  { id: 10, rk9: 'LV01YShqrqjMo62PxZPg', name: 'Las Vegas' },
  { id: 11, rk9: 'GD01yAq3nBdy68dkmxVc', name: 'Gdansk' },
  { id: 12, rk9: 'BR01wWjeoRXmsLVtL56s', name: 'Brisbane' },
  { id: 13, rk9: 'LL01rJ9jmjd0vvZStqEI', name: 'Lille' },
  { id: 14, rk9: 'MK01mzXPKCuqXfZ1ay6j', name: 'Milwaukee' },
  { id: 15, rk9: 'BE01wYmCBW1HzjObcfgo', name: 'Belo Horizonte' },
  { id: 16, rk9: 'PT01klFH0Nj5f17R5myQ', name: 'Pittsburgh' },
  { id: 17, rk9: 'MT01mfOxRw9XtaFtElAm', name: 'Monterrey' },
  { id: 18, rk9: 'FR01mpvNDKVaPxTTkdam', name: 'Frankfurt' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapeStandings(page, rk9Id) {
  const url = `https://rk9.gg/tournament/${rk9Id}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1500);

  // Click standings tab
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'));
    const standings = links.find(l => l.textContent?.trim().toLowerCase() === 'standings');
    if (standings) standings.click();
  });
  await sleep(2000);

  // Get final round number
  const rounds = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[data-round], .round-tab, .nav-link'));
    return tabs.map(t => parseInt(t.textContent)).filter(n => !isNaN(n));
  });
  const finalRound = rounds.length ? Math.max(...rounds) : null;
  console.log(`  Rounds found: ${rounds.join(',')} -> using ${finalRound}`);

  // Click final round
  if (finalRound) {
    await page.evaluate((r) => {
      const tabs = Array.from(document.querySelectorAll('[data-round], .round-tab, .nav-link'));
      const tab = tabs.find(t => parseInt(t.textContent) === r);
      if (tab) tab.click();
    }, finalRound);
    await sleep(1500);
  }

  // Scrape all pages of standings
  const records = [];
  let pageNum = 0;

  while (true) {
    pageNum++;
    const rows = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table tbody tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const imgs = Array.from(row.querySelectorAll('img'));
        const archetype = imgs.map(img => img.alt || img.title).filter(Boolean).join(' / ') || null;
        return {
          rank: parseInt(cells[0]?.textContent?.trim()) || null,
          player_name: `${cells[1]?.textContent?.trim() || ''} ${cells[2]?.textContent?.trim() || ''}`.trim(),
          country: cells[3]?.textContent?.trim() || null,
          archetype,
          record: cells[5]?.textContent?.trim() || null,
        };
      }).filter(r => r.rank);
    });

    records.push(...rows);
    console.log(`  Page ${pageNum}: +${rows.length} rows (total: ${records.length})`);

    // Next page
    const hasNext = await page.evaluate(() => {
      const next = document.querySelector('.paginate_button.next:not(.disabled), li.next:not(.disabled) a');
      if (next) { next.click(); return true; }
      return false;
    });
    if (!hasNext) break;
    await sleep(1000);
  }

  return { records, finalRound };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const t of TOURNAMENTS) {
  console.log(`\n=== ${t.name} (tournament_id=${t.id}, rk9=${t.rk9}) ===`);
  
  try {
    const { records, finalRound } = await scrapeStandings(page, t.rk9);
    
    if (records.length === 0) {
      console.log('  No records found, skipping');
      continue;
    }

    // Insert into rk9_standings
    const rows = records.map(r => ({
      tournament_id: t.rk9,
      round: finalRound,
      rank: r.rank,
      player_name: r.player_name,
      country: r.country,
      archetype: r.archetype,
      record: r.record,
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase
        .from('rk9_standings')
        .upsert(rows.slice(i, i + 200), { onConflict: 'tournament_id,rank,round' });
      if (error) console.error('  DB error:', error.message);
    }
    console.log(`  ✅ Inserted ${rows.length} standings rows`);

  } catch(e) {
    console.error(`  ❌ Error: ${e.message}`);
  }
}

await browser.close();
console.log('\nDone!');
