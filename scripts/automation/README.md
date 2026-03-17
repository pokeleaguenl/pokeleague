# PokéLeague Automation Scripts

These scripts help maintain data quality and coverage automatically.

## Scripts

### 1. refresh-rk9-data.mjs
**Purpose**: Check for tournaments needing data and validate existing data  
**Run**: `node scripts/automation/refresh-rk9-data.mjs`  
**Frequency**: Daily or after major tournaments  

**What it does**:
- Identifies tournaments without RK9 data
- Checks existing tournaments for updates
- Displays summary statistics
- Provides action items

### 2. check-alias-coverage.mjs
**Purpose**: Monitor deck alias coverage  
**Run**: `node scripts/automation/check-alias-coverage.mjs`  
**Frequency**: Weekly or when adding new tournaments  

**What it does**:
- Scans all unique deck names in standings
- Identifies decks without aliases
- Shows coverage percentage
- Lists top 20 decks needing aliases by entry count

## Setup for Automated Runs

### Option 1: Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths as needed)
# Run data refresh daily at 3 AM
0 3 * * * cd /path/to/pokeleague && node scripts/automation/refresh-rk9-data.mjs >> logs/refresh.log 2>&1

# Check alias coverage weekly on Mondays at 4 AM
0 4 * * 1 cd /path/to/pokeleague && node scripts/automation/check-alias-coverage.mjs >> logs/coverage.log 2>&1
```

### Option 2: GitHub Actions (Recommended)
Create `.github/workflows/data-refresh.yml`:
```yaml
name: Daily Data Refresh

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: node scripts/automation/refresh-rk9-data.mjs
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Option 3: Vercel Cron Jobs
Use Vercel's cron feature with API routes (requires Pro plan)

## Logs
Create a `logs/` directory to store output:
```bash
mkdir -p logs
echo "logs/" >> .gitignore
```

## Environment Variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Load from `.env.local`:
```bash
export $(cat .env.local | grep -v '^#' | xargs)
```
