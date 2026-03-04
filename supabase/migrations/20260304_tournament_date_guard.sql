-- Prevent re-importing pre-season events at the DB level
-- This is a safety net in addition to the code-level filter in the sync route
ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_min_date CHECK (event_date IS NULL OR event_date >= '2025-09-01');
