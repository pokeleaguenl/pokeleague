-- Add archetype_id column to decks table
-- This links decks to fantasy_archetypes for scoring

ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS archetype_id INTEGER REFERENCES fantasy_archetypes(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_decks_archetype_id ON decks(archetype_id);

-- Optional: Add a comment explaining the relationship
COMMENT ON COLUMN decks.archetype_id IS 'Links to fantasy_archetypes for tournament scoring and analytics';
