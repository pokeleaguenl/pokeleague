# Alias Seeding Debug Guide

## Problem

`fantasy_archetype_aliases` table has 0 rows despite seed endpoint running.
Errors like: "Failed to create alias: charizard → charizard-ex"

## Root Cause Investigation

### Changes Made

1. **Enhanced Error Logging** (`src/app/api/admin/seed-fantasy/route.ts`)
   - Added console.log for each archetype lookup
   - Added detailed error logging with code, details, and hint
   - Added environment variable validation
   - Logs archetype ID resolution
   - Logs alias records being upserted

2. **Created Debug Endpoint** (`src/app/api/admin/test-alias-insert/route.ts`)
   - Tests alias insertion in isolation
   - Validates environment variables (SUPABASE_SERVICE_ROLE_KEY)
   - Tests archetype lookup
   - Tests both INSERT and UPSERT operations
   - Returns detailed error information
   - Includes cleanup endpoint (DELETE)

3. **Added Debug UI** (`src/app/admin/fantasy-test/page.tsx`)
   - New "Step 0: Debug Alias Insert" section
   - Button to run isolated test
   - Shows detailed results

## Testing Steps

### Step 1: Verify Environment Variables

Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel:
1. Go to Vercel dashboard → pokeleague project
2. Settings → Environment Variables
3. Verify `SUPABASE_SERVICE_ROLE_KEY` exists
4. If missing, add it (get from Supabase dashboard → Settings → API)

### Step 2: Run Debug Test

1. Deploy this branch to Vercel
2. Go to `/admin/fantasy-test`
3. Click **"🔍 Test Alias Insert"** (Step 0)
4. Check the result JSON

**Expected output if working:**
```json
{
  "ok": true,
  "results": {
    "env": {
      "hasUrl": true,
      "hasServiceKey": true,
      "keyLength": 300+
    },
    "archetype": {
      "found": true,
      "data": { "id": 1, "slug": "charizard-ex", "name": "Charizard ex" }
    },
    "insert": {
      "success": true,
      "data": [{ "id": 1, "alias": "test-charizard-debug", ... }]
    },
    "upsert": {
      "success": true,
      "data": [{ "id": 2, "alias": "test-charizard-upsert", ... }]
    }
  }
}
```

**If errors appear:**
- Check `results.env` - are both `hasUrl` and `hasServiceKey` true?
- Check `results.insert.error` - what's the exact Postgres error?
- Check `results.upsert.error` - same error or different?

### Step 3: Check Server Logs

In Vercel:
1. Go to project → Deployments → [latest] → Functions
2. Check logs for `[seed-fantasy]` and `[test-alias]` prefixes
3. Look for the detailed error output

### Step 4: Run Full Seed

Once test passes:
1. Go to `/admin/fantasy-test`
2. Click **"🌱 Run Seed"** (Step 1)
3. Check result log for alias creation confirmations

### Step 5: Verify Database

Run in Supabase SQL editor:
```sql
SELECT COUNT(*) FROM fantasy_archetype_aliases;
-- Should be > 0

SELECT * FROM fantasy_archetype_aliases LIMIT 10;
-- Should show aliases like charizard, zard, miraidon, etc.
```

## Common Issues & Solutions

### Issue 1: Service Role Key Not Set
**Symptom:** `hasServiceKey: false` in test results
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Issue 2: Wrong Service Key
**Symptom:** RLS error or "JWT expired" error
**Solution:** Verify key from Supabase → Settings → API → service_role (not anon key)

### Issue 3: Archetype Not Found
**Symptom:** `archetype.found: false`
**Solution:** Run decks sync first: `/admin` → "🔄 Sync decks from Limitless"

### Issue 4: Unique Constraint Violation
**Symptom:** Error code `23505`, hint about unique constraint
**Solution:** This is expected on re-runs. Upsert should handle it. Check onConflict parameter.

### Issue 5: RLS Policy Missing
**Symptom:** Error about row-level security
**Solution:** Verify service role key is being used (admin client bypasses RLS)

## Debugging Checklist

- [ ] Environment variable `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] Debug test endpoint returns `ok: true`
- [ ] No errors in `results.insert` or `results.upsert`
- [ ] Archetype lookup succeeds (`archetype.found: true`)
- [ ] Full seed endpoint completes without alias errors
- [ ] Database count `SELECT COUNT(*) FROM fantasy_archetype_aliases` > 0

## Next Steps After Fix

Once aliases are seeding correctly:

1. **Test Tournament Ingestion**
   - Go to `/admin/fantasy-test`
   - Enter a tournament ID (e.g., 1)
   - Click "🚀 Ingest Tournament"

2. **Verify Pipeline Tables**
   - Click "🔍 Check Counts"
   - Verify all counts > 0:
     - `fantasy_standings_snapshots`
     - `fantasy_archetype_scores_live`
     - `fantasy_team_scores_live`

3. **Check Deck Analytics**
   - Go to `/decks/[slug]` (e.g., `/decks/charizard-ex`)
   - Verify "Event History" section shows data

## Files Changed

- `src/app/api/admin/seed-fantasy/route.ts` - Enhanced logging
- `src/app/api/admin/test-alias-insert/route.ts` - New debug endpoint
- `src/app/admin/fantasy-test/page.tsx` - Added test UI
- `ALIAS_DEBUG_GUIDE.md` - This file

## Branch

`bot/20260305-1100-fantasy-data-pipeline`

Commits:
- `5f84e97` - Add detailed debug logging
- `62f65db` - Add debug endpoint and UI
