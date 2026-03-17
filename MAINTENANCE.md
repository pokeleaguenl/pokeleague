# PokéLeague Maintenance Guide

## Weekly Tasks (15 minutes)

### Every Monday Morning

**1. Check Alias Coverage** (5 min)
```bash
cd ~/openclaw-data/workspace/pokeleague
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/automation/check-alias-coverage.mjs
```

**Expected Output:**
- Coverage percentage (target: >60%)
- Top 20 decks needing aliases
- If coverage drops below 55%, add new aliases

**2. Refresh Tournament Data** (5 min)
```bash
node scripts/automation/refresh-rk9-data.mjs
```

**Expected Output:**
- List of tournaments without data
- Summary stats
- Action items (if any)

**3. Quick Mobile Check** (5 min)
- Visit site on phone: https://pokeleague.vercel.app
- Test navigation dropdowns
- Test search bar
- Check one tournament page
- Verify charts display properly

---

## Monthly Tasks (30 minutes)

### First Monday of Month

**1. Add High-Entry Decks**
If coverage checker shows 10+ new decks with 10+ entries:
```bash
# Edit scripts/add-remaining-high-entry-decks.mjs
# Add new decks to the list
node scripts/add-remaining-high-entry-decks.mjs
git add scripts/
git commit -m "Monthly alias update"
git push
```

**2. Review Analytics**
- Check most popular decks (shifted meta?)
- Review player activity
- Check tournament participation

**3. Performance Check**
- Page load times
- Mobile experience
- Any user feedback

---

## Automated Setup Options

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/weekly-maintenance.yml`:
```yaml
name: Weekly Maintenance

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:

jobs:
  check-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - name: Check Alias Coverage
        run: node scripts/automation/check-alias-coverage.mjs
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      - name: Check Tournament Data
        run: node scripts/automation/refresh-rk9-data.mjs
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Setup:**
1. Create `.github/workflows/` directory
2. Add the file above
3. Add secrets to GitHub repo settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Commit and push
5. Check "Actions" tab in GitHub to see runs

### Option 2: Cron Job (Local/Server)
```bash
# Edit crontab
crontab -e

# Add these lines:
# Weekly coverage check (Mondays at 9 AM)
0 9 * * 1 cd /path/to/pokeleague && export $(cat .env.local | grep -v '^#' | xargs) && node scripts/automation/check-alias-coverage.mjs >> logs/coverage.log 2>&1

# Weekly data refresh (Mondays at 9:15 AM)
15 9 * * 1 cd /path/to/pokeleague && export $(cat .env.local | grep -v '^#' | xargs) && node scripts/automation/refresh-rk9-data.mjs >> logs/refresh.log 2>&1
```

**Setup:**
```bash
mkdir -p logs
echo "logs/" >> .gitignore
```

### Option 3: Calendar Reminder

Set a recurring reminder every Monday at 9 AM:
- Subject: "PokéLeague Maintenance"
- Body: See MAINTENANCE.md checklist
- Run scripts manually

---

## Coverage Targets

| Coverage | Status | Action |
|----------|--------|--------|
| < 50% | 🔴 Critical | Add aliases immediately |
| 50-60% | 🟡 Good | Add high-entry decks |
| 60-70% | 🟢 Excellent | Monitor weekly |
| > 70% | 🎉 Outstanding | Maintain |

**Current Coverage:** 59.6%

---

## Common Issues & Fixes

### Coverage Dropping
**Cause:** New tournament data with new deck variants  
**Fix:** Run `check-alias-coverage.mjs` → Add top decks

### Mobile Issues Reported
**Cause:** New component not tested on mobile  
**Fix:** Test in Chrome DevTools mobile view → Fix breakpoints

### Charts Not Loading
**Cause:** Recharts update or data format change  
**Fix:** Check console errors → Verify data structure

---

## Quick Commands Reference
```bash
# Load environment
export $(cat .env.local | grep -v '^#' | xargs)

# Check coverage
node scripts/automation/check-alias-coverage.mjs

# Check tournaments
node scripts/automation/refresh-rk9-data.mjs

# Add new aliases
node scripts/add-remaining-high-entry-decks.mjs

# Type check
./node_modules/.bin/tsc --noEmit 2>&1 | grep -v "node_modules" | grep "error"

# Run locally
npm run dev
```

---

## Contact & Support

- **Issues:** GitHub Issues
- **Questions:** See README.md
- **Updates:** Check for new scripts in `scripts/automation/`

**Last Updated:** March 17, 2026  
**Current Version:** 1.0  
**Maintainer:** Dom
