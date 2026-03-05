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

#### `POST /api/fantasy/admin/update-live`
Ingests a standings snapshot and triggers score computation.

**Body:**
```json
{
  "fantasy_event_id": 1,
  "payload": {
    "archetypes": [
      {
        "archetype_slug": "charizard-ex",
        "archetype_name": "Charizard ex",
        "placement": 1,
        "made_day2": true,
        "top8": true,
        "won": true,
        "win_rate": 0.75,
        "had_win": true
      }
    ]
  },
  "source": "rk9" // optional, defaults to "manual"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Snapshot stored. Scored 10 archetypes, 5 teams.",
  "archetypesScored": 10,
  "teamsScored": 5
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

## Troubleshooting

**No archetypes found:**
- Run `/api/admin/seed-fantasy`

**No events found:**
- Check `tournaments` table has entries with `event_date >= 2025-09-01`
- Run `/api/admin/seed-fantasy`

**Snapshot posted but scores are 0:**
- Check `archetype_slug` in payload matches slugs in `fantasy_archetypes`
- Check users have squads configured
- Verify scoring logic in `src/lib/fantasy/bracketScoring.ts`

**TypeScript errors on SnapshotPayload:**
- See `src/lib/fantasy/types.ts` for canonical type definitions
- Payload structure: `{ archetypes: ArchetypeResult[] }`
