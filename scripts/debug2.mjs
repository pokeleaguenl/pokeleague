import { chromium } from 'playwright';

const id = 'SG0167ss5UCjklsDaPrA';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('=== ROSTER PAGE (default 50 entries) ===');
await page.goto(`https://rk9.gg/roster/${id}`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Show all selects on the page
const selects = await page.evaluate(() =>
  Array.from(document.querySelectorAll('select')).map(s => ({
    id: s.id, name: s.name, disabled: s.disabled,
    options: Array.from(s.options).map(o => ({ value: o.value, text: o.text }))
  }))
);
console.log('Selects found:', JSON.stringify(selects, null, 2));

// Print roster text as-is
console.log('\n=== ROSTER TEXT ===');
console.log((await page.locator('body').innerText()).substring(0, 3000));

// Find all links
console.log('\n=== ALL LINKS WITH decklist or View ===');
const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a'))
    .filter(a => a.href.includes('decklist') || a.textContent.trim() === 'View')
    .slice(0, 10)
    .map(a => ({ text: a.textContent.trim(), href: a.href }))
);
console.log(links);

// Fetch one decklist if found
if (links.length > 0) {
  console.log('\n=== SAMPLE DECKLIST ===');
  await page.goto(links[0].href, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log((await page.locator('body').innerText()).substring(0, 3000));
}

await browser.close();
