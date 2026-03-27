-- Migration: Add canonical_id to fantasy_archetypes and end_date to fantasy_events
-- canonical_id allows variant archetypes to roll up to a canonical (e.g. "Charizard ex / Pidgeot ex" → "Charizard ex")
-- end_date on fantasy_events enables proper live/upcoming/completed status computation

ALTER TABLE fantasy_archetypes
  ADD COLUMN IF NOT EXISTS canonical_id INTEGER REFERENCES fantasy_archetypes(id) ON DELETE SET NULL;

ALTER TABLE fantasy_events
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Index for canonical rollup queries
CREATE INDEX IF NOT EXISTS idx_fantasy_archetypes_canonical_id
  ON fantasy_archetypes(canonical_id)
  WHERE canonical_id IS NOT NULL;
