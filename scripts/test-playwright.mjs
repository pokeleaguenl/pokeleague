import { chromium } from 'playwright';

const id = 'Iu3dnfnOb7zwvp9fAk5K';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Loading page...');
await page.goto(`https://rk9.gg/pairings/${id}`, { waitUntil: 'networkidle', timeout: 30000 });

// Wait a moment for JS to render
await page.waitForTimeout(3000);

// Dump the rendered HTML structure around standings
const html = await page.content();
const lines = html.split('\n');

console.log('\n=== LINES WITH round/standing/player/table ===');
lines.forEach((line, i) => {
  if (/round|standing|player|<tr|<td|<table|data-/i.test(line)) {
    console.log(i + ': ' + line.trim().substring(0, 150));
  }
});

// Also try to grab any visible text
const bodyText = await page.locator('body').innerText();
console.log('\n=== VISIBLE TEXT (first 2000 chars) ===');
console.log(bodyText.substring(0, 2000));

await browser.close();
