import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://rk9.gg/standings/SE01gUuRn8bJqbH9Wnt1', { 
  waitUntil: 'networkidle', 
  timeout: 30000 
});

// Wait longer for JS to render
await new Promise(r => setTimeout(r, 8000));

const html = await page.content();
console.log('Page length:', html.length);
console.log('Has table:', html.includes('<table'));
console.log('Has standings:', html.includes('standings'));
console.log('Has datatable:', html.includes('datatable'));

// Dump first 3000 chars of body
const bodyText = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
console.log('\nBody snippet:\n', bodyText);

await browser.close();
