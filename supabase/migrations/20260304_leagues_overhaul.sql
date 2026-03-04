-- Add public/global flags to leagues
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Allow null owner_id (for the global league seeded later)
ALTER TABLE leagues ALTER COLUMN owner_id DROP NOT NULL;

-- Global league (run once; idempotent)
INSERT INTO leagues (name, code, is_public, is_global, owner_id)
VALUES ('Global League', 'GLOBAL', true, true, null)
ON CONFLICT (code) DO NOTHING;

-- Add submission deadline to tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;
