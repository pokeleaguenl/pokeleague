-- Add Hand slots to squads
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS hand_1 INTEGER REFERENCES decks(id),
  ADD COLUMN IF NOT EXISTS hand_2 INTEGER REFERENCES decks(id),
  ADD COLUMN IF NOT EXISTS hand_3 INTEGER REFERENCES decks(id),
  ADD COLUMN IF NOT EXISTS hand_4 INTEGER REFERENCES decks(id);

-- Hand slot variants
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS hand_1_variant TEXT,
  ADD COLUMN IF NOT EXISTS hand_2_variant TEXT,
  ADD COLUMN IF NOT EXISTS hand_3_variant TEXT,
  ADD COLUMN IF NOT EXISTS hand_4_variant TEXT;

-- Stadium effects tracking
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS x3_effect_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hand_boost_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_effect TEXT DEFAULT NULL; -- 'x3' | 'hand_boost' | null

-- Transfer points
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS transfer_points INTEGER DEFAULT 0;

-- Transfer history
CREATE TABLE IF NOT EXISTS squad_transfers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES tournaments(id),
  deck_out_id INTEGER REFERENCES decks(id),
  deck_in_id INTEGER REFERENCES decks(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE squad_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transfers" ON squad_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transfers" ON squad_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add win tracking to tournament_results
ALTER TABLE tournament_results
  ADD COLUMN IF NOT EXISTS had_win BOOLEAN DEFAULT false;
