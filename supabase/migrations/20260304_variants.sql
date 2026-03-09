-- Deck variants table
CREATE TABLE IF NOT EXISTS deck_variants (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  limitless_value TEXT,
  placement_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deck_id, name)
);

-- Enable RLS
ALTER TABLE deck_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON deck_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated write access" ON deck_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update access" ON deck_variants FOR UPDATE USING (auth.role() = 'authenticated');

-- Add variant fields to squads (text columns storing variant name directly)
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS active_variant TEXT,
  ADD COLUMN IF NOT EXISTS bench_1_variant TEXT,
  ADD COLUMN IF NOT EXISTS bench_2_variant TEXT,
  ADD COLUMN IF NOT EXISTS bench_3_variant TEXT,
  ADD COLUMN IF NOT EXISTS bench_4_variant TEXT,
  ADD COLUMN IF NOT EXISTS bench_5_variant TEXT;
