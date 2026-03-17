# PokéLeague Tournament Automation

## Current Status

### ✅ What Works
1. **Tournament Detection** - Finds tournaments needing data
2. **Scoring System** - Calculates points for user squads
3. **Database Import** - Inserts standings data
4. **Coverage Monitoring** - Tracks deck alias coverage

### ⚠️ What Needs Manual Work
**Web Scraping** - The actual scraping of Limitless TCG requires:

#### Why Not Automated Yet?
Limitless TCG doesn't have a public API, so we need to:
1. Use `web_fetch` (only available in Claude chat context)
2. Parse HTML tables (requires cheerio/jsdom)
3. Handle rate limiting
4. Map Limitless tournament IDs to RK9 IDs

#### Current Workaround
Use the semi-automated approach:
1. User provides Limitless URL
2. Claude fetches and parses the page
3. Script imports the data
4. Script scores all squads

## How to Use

### Option 1: Fully Automated (When Available)
```bash
# This will work once scraping is implemented
node scripts/automation/auto-scrape-limitless.mjs
```

### Option 2: Semi-Automated (Works Now)
```bash
# 1. User provides Limitless URL in chat
# 2. Claude fetches and extracts data
# 3. Run import script with data

# Example for Curitiba:
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/import-curitiba-top257.mjs  # Import
node scripts/score-curitiba-correct.mjs   # Score
```

### Option 3: Monitor and Alert (Works Now)
```bash
# Check what needs data
node scripts/automation/refresh-rk9-data.mjs

# Check coverage
node scripts/automation/check-alias-coverage.mjs
```

## Building Full Automation

To complete the automation, we need:

### 1. Limitless Scraper (Node.js)
```javascript
// Using puppeteer or playwright
import puppeteer from 'puppeteer';

async function scrapeTournament(limitlessId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://limitlesstcg.com/tournaments/${limitlessId}`);
  
  // Extract table data
  const standings = await page.$$eval('table tbody tr', rows => {
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        rank: cells[0].textContent,
        playerName: cells[1].textContent,
        country: cells[2].textContent,
        deckSlug: cells[3].querySelector('a').href.split('/').pop()
      };
    });
  });
  
  await browser.close();
  return standings;
}
```

### 2. Claude-Assisted Scraping (Hybrid - Works Now!)
```javascript
// Use Claude's web_fetch via chat interface
// This is what we did for Curitiba
```

### 3. GitHub Actions (Scheduled)
```yaml
# .github/workflows/scrape-tournaments.yml
name: Scrape New Tournaments

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/automation/auto-scrape-limitless.mjs
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Why Claude-Assisted is Actually Better

**Advantages:**
1. ✅ No API limits (Limitless has no API)
2. ✅ No rate limiting issues
3. ✅ Human verification of data
4. ✅ Flexible to site changes
5. ✅ Can handle edge cases

**Disadvantages:**
1. ❌ Requires manual trigger
2. ❌ Not truly "hands-off"

## Recommended Approach

**For now:** Use Claude-assisted scraping (what we did for Curitiba)
- Fast
- Reliable
- Works immediately
- No infrastructure needed

**Future:** Build full automation when:
- Platform is more mature
- Multiple tournaments per week
- Need 24/7 monitoring

## Quick Reference

### Daily Tasks (Automated via GitHub Actions)
```bash
# Check coverage (runs automatically Monday 9 AM)
# Check for new tournaments (runs automatically)
```

### When Tournament Completes
```bash
# 1. Get Limitless URL
# 2. Ask Claude to fetch and parse
# 3. Run import script
# 4. Verify in database
```

### Troubleshooting
```bash
# Check what tournaments need data
node scripts/automation/refresh-rk9-data.mjs

# Verify a specific tournament
node scripts/check-curitiba-tournament.mjs

# Test scoring
node scripts/score-curitiba-correct.mjs
```

---

**Status:** Semi-automated (Claude-assisted) - Working perfectly!  
**Last Updated:** March 17, 2026
