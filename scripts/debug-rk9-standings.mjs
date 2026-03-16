import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Try the direct standings URL
await page.goto('https://rk9.gg/standings/SE01gUuRn8bJqbH9Wnt1', { 
  waitUntil: 'networkidle', 
  timeout: 30000 
});
await new Promise(r => setTimeout(r, 3000));

const structure = await page.evaluate(() => {
  const tables = Array.from(document.querySelectorAll('table')).map(t => ({
    id: t.id,
    classes: t.className,
    rows: t.querySelectorAll('tbody tr').length,
    headers: Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim())
  }));
  
  const buttons = Array.from(document.querySelectorAll('button, .btn, [data-round]')).map(b => ({
    text: b.textContent.trim().slice(0, 30),
    classes: b.className,
    dataRound: b.dataset?.round
  })).filter(b => b.text).slice(0, 20);

  // Sample first 3 rows
  const rows = Array.from(document.querySelectorAll('table tbody tr')).slice(0, 3).map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const imgs = Array.from(row.querySelectorAll('img'));
    return {
      cells: cells.map(c => c.textContent.trim()),
      imgs: imgs.map(i => ({ alt: i.alt, src: i.src.slice(0, 80) }))
    };
  });

  return { tables, buttons, rows, url: window.location.href };
});

console.log('URL:', structure.url);
console.log('Tables:', JSON.stringify(structure.tables, null, 2));
console.log('Buttons:', JSON.stringify(structure.buttons, null, 2));
console.log('Sample rows:', JSON.stringify(structure.rows, null, 2));

await browser.close();
