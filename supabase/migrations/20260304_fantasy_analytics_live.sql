-- ============================================================
-- Fantasy Analytics + Live Event Subsystem
-- Scoring logic confirmed:
--   Active Deck = x2 | x3 stadium override
--   Hand = 0 unless Hand Boost (then x1)
--   +1 win bonus applied before multiplier
--   Stadium effects mutually exclusive
-- ALL TABLES ARE ADDITIVE - existing squad tables untouched
-- ============================================================

-- Ingestion watermark tracking
CREATE TABLE IF NOT EXISTS ingest_runs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  ran_at TIMESTAMPTZ DEFAULT NOW(),
  min_date DATE,
  max_date DATE,
  event_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ok',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS ingest_events_seen (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_event_id)
);

-- Canonical archetype registry
CREATE TABLE IF NOT EXISTS fantasy_archetypes (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alias mapping for name normalisation
CREATE TABLE IF NOT EXISTS fantasy_archetype_aliases (
  id SERIAL PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL,
  archetype_id INTEGER NOT NULL REFERENCES fantasy_archetypes(id) ON DELETE CASCADE
);

-- Fantasy event catalogue (one per tournament)
CREATE TABLE IF NOT EXISTS fantasy_events (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE,
  status TEXT DEFAULT 'upcoming', -- upcoming | live | completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player entry per fantasy event
CREATE TABLE IF NOT EXISTS fantasy_event_entries (
  id SERIAL PRIMARY KEY,
  fantasy_event_id INTEGER NOT NULL REFERENCES fantasy_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fantasy_event_id, user_id)
);

-- Append-only raw standings snapshots (source of truth)
CREATE TABLE IF NOT EXISTS fantasy_standings_snapshots (
  id SERIAL PRIMARY KEY,
  fantasy_event_id INTEGER NOT NULL REFERENCES fantasy_events(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL, -- raw standings data
  source TEXT DEFAULT 'manual'
);

-- Pre-computed archetype scores per event (refreshed on snapshot arrival)
CREATE TABLE IF NOT EXISTS fantasy_archetype_scores_live (
  id SERIAL PRIMARY KEY,
  fantasy_event_id INTEGER NOT NULL REFERENCES fantasy_events(id) ON DELETE CASCADE,
  archetype_id INTEGER NOT NULL REFERENCES fantasy_archetypes(id) ON DELETE CASCADE,
  points NUMERIC DEFAULT 0,
  placement INTEGER,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fantasy_event_id, archetype_id)
);

-- Locked final scores after event concludes
CREATE TABLE IF NOT EXISTS fantasy_archetype_scores_final (
  id SERIAL PRIMARY KEY,
  fantasy_event_id INTEGER NOT NULL REFERENCES fantasy_events(id) ON DELETE CASCADE,
  archetype_id INTEGER NOT NULL REFERENCES fantasy_archetypes(id) ON DELETE CASCADE,
  points NUMERIC DEFAULT 0,
  placement INTEGER,
  finalised_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fantasy_event_id, archetype_id)
);

-- Pre-computed team scores per user per event (refreshed on snapshot arrival)
CREATE TABLE IF NOT EXISTS fantasy_team_scores_live (
  id SERIAL PRIMARY KEY,
  fantasy_event_id INTEGER NOT NULL REFERENCES fantasy_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points NUMERIC DEFAULT 0,
  breakdown JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fantasy_event_id, user_id)
);

-- RLS: all analytics tables public read, authenticated write
ALTER TABLE ingest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_events_seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_archetype_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_event_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_standings_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_archetype_scores_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_archetype_scores_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_team_scores_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_ingest_runs" ON ingest_runs FOR SELECT USING (true);
CREATE POLICY "public_read_ingest_events_seen" ON ingest_events_seen FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_archetypes" ON fantasy_archetypes FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_archetype_aliases" ON fantasy_archetype_aliases FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_events" ON fantasy_events FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_event_entries" ON fantasy_event_entries FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_standings_snapshots" ON fantasy_standings_snapshots FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_archetype_scores_live" ON fantasy_archetype_scores_live FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_archetype_scores_final" ON fantasy_archetype_scores_final FOR SELECT USING (true);
CREATE POLICY "public_read_fantasy_team_scores_live" ON fantasy_team_scores_live FOR SELECT USING (true);

CREATE POLICY "auth_write_ingest_runs" ON ingest_runs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write_ingest_events_seen" ON ingest_events_seen FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_upsert_ingest_events_seen" ON ingest_events_seen FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_fantasy_archetypes" ON fantasy_archetypes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write_fantasy_events" ON fantasy_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_fantasy_events" ON fantasy_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_fantasy_event_entries" ON fantasy_event_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_fantasy_standings_snapshots" ON fantasy_standings_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_upsert_fantasy_archetype_scores_live" ON fantasy_archetype_scores_live FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_upsert_fantasy_archetype_scores_final" ON fantasy_archetype_scores_final FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_upsert_fantasy_team_scores_live" ON fantasy_team_scores_live FOR ALL USING (auth.role() = 'authenticated');
