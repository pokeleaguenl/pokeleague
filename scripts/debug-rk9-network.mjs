import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Intercept network requests
const apiCalls = [];
page.on('request', req => {
  const url = req.url();
  if (url.includes('standings') || url.includes('api') || url.includes('json') || url.includes('data')) {
    apiCalls.push({ method: req.method(), url });
  }
});

page.on('response', async res => {
  const url = res.url();
  if (url.includes('standings') || url.includes('api') || (url.includes('rk9') && !url.includes('static'))) {
    const contentType = res.headers()['content-type'] || '';
    if (contentType.includes('json') || contentType.includes('text')) {
      try {
        const text = await res.text();
        if (text.length > 100 && text.length < 50000) {
          console.log('\n=== RESPONSE:', url);
          console.log(text.slice(0, 500));
        }
      } catch(e) {}
    }
  }
});

await page.goto('https://rk9.gg/standings/SE01gUuRn8bJqbH9Wnt1', { 
  waitUntil: 'networkidle', timeout: 30000 
});
await new Promise(r => setTimeout(r, 8000));

console.log('\nAll API calls intercepted:');
apiCalls.forEach(c => console.log(c.method, c.url));

await browser.close();
