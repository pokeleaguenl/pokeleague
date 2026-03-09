# Fantasy Analytics Data Pipeline

## Overview

The fantasy analytics system tracks archetype performance across tournaments and computes team scores based on user squads.

## Data Flow

```
Decks (from Limitless)
  ↓
fantasy_archetypes (canonical deck registry)
  ↓
fantasy_events (one per tournament)
  ↓
fantasy_standings_snapshots (append-only standings data)
  ↓
fantasy_archetype_scores_live (computed scores per archetype per event)
  ↓
fantasy_team_scores_live (computed scores per user per event)
```

## Setup Steps

### 1. Sync Base Data

From `/admin`:
- Click **"🔄 Sync decks from Limitless"** (populates `decks` table)
- Click **"🔄 Sync variants"** (optional, adds variant data)

### 2. Seed Fantasy Tables

From `/admin`:
- Click **"🌱 Seed Fantasy Data"**

This creates:
- `fantasy_archetypes` from `decks` table
- `fantasy_archetype_aliases` for common deck name variants
- `fantasy_events` from `tournaments` table (one per tournament_id)

### 3. Test Snapshot Ingestion

Go to `/admin/fantasy-test`:

**Step 1:** Run seed (if not done above)

**Step 2:** Post test snapshot
- Uses sample standings data for fantasy_event_id = 1
- Writes to:
  - `fantasy_standings_snapshots` (raw data)
  - `fantasy_archetype_scores_live` (computed archetype scores)
  - `fantasy_team_scores_live` (computed team scores based on user squads)

**Step 3:** Verify data
- Run the SQL query shown on the page to check table counts
- All tables should have > 0 rows

## API Endpoints

### Admin Endpoints (Authenticated Only)

#### `POST /api/admin/seed-fantasy`
Seeds fantasy_archetypes, aliases, and events from existing data.
Idempotent - safe to run multiple times.

#### `POST /api/fantasy/admin/ingest-event` (Recommended)
**Automated pipeline** for ingesting tournament results.

**Body:**
```json
{
  "tournament_id": 123,
  "standings": [
    { "player_name": "Player A", "deck_name": "Charizard ex", "placement": 1, "wins": 9, "losses": 0 },
    { "player_name": "Player B", "deck_name": "Pikachu ex", "placement": 2, "wins": 8, "losses": 1 }
  ],
  "force": false  // optional, set true to create new snapshot version
}
```

**What it does:**
1. Creates/updates fantasy_events row for tournament_id
2. Converts standings to SnapshotPayload (resolves deck names via aliases)
3. Stores snapshot in fantasy_standings_snapshots
4. Computes analytics (archetype + team scores)
5. Tracks ingestion in audit tables

**Idempotent:** Skips if snapshot already exists unless `force: true`

**Response:**
```json
{
  "ok": true,
  "message": "Ingested tournament Name (5 standings → 5 archetypes)",
  "fantasy_event_id": 1,
  "snapshot_id": 42,
  "archetypes_scored": 5,
  "teams_scored": 10,
  "unmatched_decks": [],
  "log": ["...", "..."]
}
```

#### `POST /api/fantasy/admin/update-live` (Manual)
Directly ingests a standings snapshot (for manual workflows).

**Body:**
```json
{
  "fantasy_event_id": 1,
  "standings": [
    { "player_name": "Player A", "deck_name": "Charizard ex", "placement": 1 }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Snapshot stored: 5 archetypes. Scored 5 archetypes, 10 teams.",
  "archetypesScored": 5,
  "teamsScored": 10,
  "unmatchedDecks": []
}
```

#### `GET /api/fantasy/admin/debug-pipeline`
Returns table counts for debugging.

**Response:**
```json
{
  "ok": true,
  "counts": {
    "fantasy_archetypes": 25,
    "fantasy_archetype_aliases": 45,
    "fantasy_events": 18,
    "fantasy_standings_snapshots": 3,
    "fantasy_archetype_scores_live": 75,
    "fantasy_team_scores_live": 12
  },
  "timestamp": "2026-03-05T13:00:00Z"
}
```

### Public Endpoints

#### `GET /api/fantasy/events`
Lists all fantasy events.

#### `GET /api/fantasy/events/[id]/live`
Returns live scores for a specific event (archetype + team scores).

#### `GET /api/fantasy/archetypes`
Lists all registered archetypes.

## Scoring Logic

See `src/lib/fantasy/bracketScoring.ts` for details.

**Base Points:**
- Win: +1 bonus before multipliers
- Placement multipliers (Top 8, Day 2, etc.)

**Squad Multipliers:**
- Active deck: ×2 (or ×3 with stadium effect)
- Bench: ×1
- Hand: ×0 (unless Hand Boost effect, then ×1)

## Tables

### Core Tables
- `fantasy_archetypes` - Canonical deck registry
- `fantasy_archetype_aliases` - Name variants for fuzzy matching
- `fantasy_events` - One per tournament (upcoming/live/completed)
- `fantasy_event_entries` - User entries per event

### Snapshot & Scoring Tables
- `fantasy_standings_snapshots` - Append-only raw standings (source of truth)
- `fantasy_archetype_scores_live` - Pre-computed archetype scores (refreshed on snapshot)
- `fantasy_archetype_scores_final` - Locked final scores after event concludes
- `fantasy_team_scores_live` - Pre-computed team scores (refreshed on snapshot)

### Tracking Tables
- `ingest_runs` - Watermark for sync operations
- `ingest_events_seen` - Tracks first/last seen timestamps per external event

## Maintenance

### Adding New Archetypes
1. Sync latest decks from Limitless: `/api/decks/sync`
2. Re-run seed: `/api/admin/seed-fantasy`

### Updating Event Status
Events auto-set status based on `event_date`:
- Past → `completed`
- Today → `live`
- Future → `upcoming`

Re-run seed to update statuses.

### Clearing Test Data
```sql
-- Clear live scores (will be recomputed on next snapshot)
DELETE FROM fantasy_archetype_scores_live;
DELETE FROM fantasy_team_scores_live;

-- Clear snapshots (use with caution - this is the source of truth)
DELETE FROM fantasy_standings_snapshots WHERE source = 'manual_test';
```

## How to Test

### Quick Test (Automated Pipeline)

1. **Go to `/admin/fantasy-test`**
2. **Step 1:** Click "🌱 Run Seed" (populates archetypes, aliases, events)
3. **Step 2A:** Enter a tournament_id (e.g., 1) and click "🚀 Ingest Tournament"
   - Uses sample standings data
   - Creates fantasy_event, snapshot, and scores
4. **Step 3:** Click "🔍 Check Counts" to verify all tables populated

### Expected Results

After ingestion:
- `fantasy_archetypes`: > 0 (from seed)
- `fantasy_archetype_aliases`: > 0 (from seed)
- `fantasy_events`: > 0 (from seed + ingest)
- `fantasy_standings_snapshots`: > 0 (from ingest)
- `fantasy_archetype_scores_live`: > 0 (from analytics)
- `fantasy_team_scores_live`: > 0 (if users have squads)

### Using Real Tournament Data

To ingest a real tournament:

```bash
curl -X POST http://localhost:3000/api/fantasy/admin/ingest-event \
  -H "Content-Type: application/json" \
  -d '{
    "tournament_id": 123,
    "standings": [
      { "player_name": "John Doe", "deck_name": "Charizard ex", "placement": 1, "wins": 9, "losses": 0 }
    ]
  }'
```

## Troubleshooting

**Alias insert fails with RLS error:**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that seed endpoint uses admin client for writes

**No archetypes found:**
- Run `/api/admin/seed-fantasy`

**No events found:**
- Check `tournaments` table has entries with `event_date >= 2025-09-01`
- Run `/api/admin/seed-fantasy`

**Snapshot posted but scores are 0:**
- Check deck names in standings match archetype names or aliases
- Check users have squads configured
- Verify scoring logic in `src/lib/fantasy/bracketScoring.ts`
- Use debug endpoint to see unmatched decks

**"Snapshot already exists" error:**
- This is expected behavior (idempotent ingestion)
- Use `force: true` in request body to create new snapshot version

**TypeScript errors on SnapshotPayload:**
- See `src/lib/fantasy/types.ts` for canonical type definitions
- Payload structure: `{ archetypes: ArchetypeResult[] }`
