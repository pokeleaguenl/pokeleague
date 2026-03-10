import { chromium } from 'playwright';

const id = 'Iu3dnfnOb7zwvp9fAk5K';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`https://rk9.gg/pairings/${id}`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Click R18 first
console.log('=== Clicking R18 ===');
const r18 = page.getByText('R18', { exact: true });
console.log('R18 found:', await r18.count());
if (await r18.count() > 0) { await r18.first().click(); await page.waitForTimeout(2000); }

// Click Standings
console.log('=== Clicking Standings ===');
const stab = page.getByText('Standings', { exact: true });
console.log('Standings found:', await stab.count());
if (await stab.count() > 0) { await stab.first().click(); await page.waitForTimeout(3000); }

// Dump full visible text
const text = await page.locator('body').innerText();
console.log('\n=== FULL PAGE TEXT ===');
console.log(text.substring(0, 5000));

// Also dump roster page
console.log('\n\n=== ROSTER PAGE ===');
await page.goto(`https://rk9.gg/roster/${id}`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const rosterText = await page.locator('body').innerText();
console.log(rosterText.substring(0, 3000));

await browser.close();
