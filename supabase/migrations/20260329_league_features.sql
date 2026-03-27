-- ============================================================
-- League Features: Scoring overhaul, effects, leagues,
-- achievements, predictions, dynamic pricing, XP system
-- Apply via: npx supabase db query --linked -f supabase/migrations/20260329_league_features.sql
-- ============================================================

-- === SQUADS: new effect columns ===
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS effect_charges INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS bench_blitz_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_call_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dark_horse_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS captain_swap_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_transfer_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_week TEXT;

-- === TOURNAMENT RESULTS: granular placement ===
ALTER TABLE tournament_results
  ADD COLUMN IF NOT EXISTS top2 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS top4 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS top16 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS best_rank INTEGER,
  ADD COLUMN IF NOT EXISTS tournament_size INTEGER;

-- === LEAGUES: extra metadata ===
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- === LEAGUE MEMBERS ===
CREATE TABLE IF NOT EXISTS league_members (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read league_members" ON league_members FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth join league" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth leave league" ON league_members FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === LEAGUE MATCHUPS ===
CREATE TABLE IF NOT EXISTS league_matchups (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
  user_a UUID NOT NULL REFERENCES auth.users(id),
  user_b UUID NOT NULL REFERENCES auth.users(id),
  score_a NUMERIC DEFAULT 0,
  score_b NUMERIC DEFAULT 0,
  winner UUID REFERENCES auth.users(id),
  computed_at TIMESTAMPTZ,
  UNIQUE(league_id, tournament_id, user_a, user_b)
);

ALTER TABLE league_matchups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read league_matchups" ON league_matchups FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth write league_matchups" ON league_matchups FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === ACHIEVEMENTS ===
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  rarity TEXT DEFAULT 'common'
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth write achievements" ON achievements FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO achievements (id, name, description, emoji, rarity) VALUES
  ('meta_predictor',  'Meta Predictor',   'Had the tournament winner in your Active slot',          '🔮', 'epic'),
  ('ice_cold',        'Ice Cold',         'Scored 0 points in an event',                            '🧊', 'common'),
  ('hot_streak',      'Hot Streak',       'Top 3 in your league 3 events in a row',                 '🔥', 'rare'),
  ('diamond_hands',   'Diamond Hands',    'Never changed your squad all season',                    '💎', 'legendary'),
  ('dark_horse_hunter','Dark Horse Hunter','Had a C/D tier deck make top 16',                       '🐴', 'rare'),
  ('perfect_squad',   'Perfect Squad',    'Filled all 10 slots within budget',                     '✅', 'common'),
  ('budget_master',   'Budget Master',    'Used 195+ of your 200pt budget',                        '💰', 'rare'),
  ('first_points',    'First Blood',      'Earned your first fantasy points',                      '🩸', 'common'),
  ('century',         'Century Club',     'Score 100+ season points',                              '💯', 'rare'),
  ('champion',        'Champion',         'Finish #1 on the season leaderboard',                   '🏆', 'legendary'),
  ('prediction_ace',  'Prediction Ace',   'Correctly predict 3 tournament winners',                '🎯', 'epic'),
  ('all_in',          'All In',           'Use the ×3 Active effect',                              '⚡', 'common'),
  ('underdog',        'Underdog',         'Score points with a Reserve deck via Hand Boost',       '🃏', 'common')
ON CONFLICT (id) DO NOTHING;

-- === PLAYER ACHIEVEMENTS ===
CREATE TABLE IF NOT EXISTS player_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  tournament_id INTEGER REFERENCES tournaments(id),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read player_achievements" ON player_achievements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service write player_achievements" ON player_achievements FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === PROFILES: XP and level ===
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- === TOURNAMENT PREDICTIONS ===
CREATE TABLE IF NOT EXISTS tournament_predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
  predicted_deck_id INTEGER NOT NULL REFERENCES decks(id),
  correct BOOLEAN,
  bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);

ALTER TABLE tournament_predictions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read predictions" ON tournament_predictions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users create predictions" ON tournament_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service update predictions" ON tournament_predictions FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === DECK PRICE HISTORY ===
CREATE TABLE IF NOT EXISTS deck_price_history (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id),
  old_cost INTEGER,
  new_cost INTEGER,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deck_price_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read deck_price_history" ON deck_price_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Auth write deck_price_history" ON deck_price_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
