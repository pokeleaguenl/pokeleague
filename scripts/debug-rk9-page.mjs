import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://rk9.gg/tournament/SE01gUuRn8bJqbH9Wnt1', { 
  waitUntil: 'networkidle', 
  timeout: 30000 
});
await new Promise(r => setTimeout(r, 3000));

// Dump all links/tabs/buttons to understand navigation
const structure = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a')).map(a => ({
    text: a.textContent.trim(),
    href: a.href,
    classes: a.className
  })).filter(a => a.text);
  
  const tables = Array.from(document.querySelectorAll('table')).map(t => ({
    id: t.id,
    classes: t.className,
    rows: t.querySelectorAll('tbody tr').length,
    headers: Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim())
  }));

  return { links: links.slice(0, 30), tables };
});

console.log('Links:', JSON.stringify(structure.links, null, 2));
console.log('Tables:', JSON.stringify(structure.tables, null, 2));

await browser.close();
