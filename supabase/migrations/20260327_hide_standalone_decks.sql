-- ============================================================
-- Hide standalone deck archetypes that have proper combo variants
-- Charizard ex → use Charizard Pidgeot / Charizard Noctowl / Charizard Dusknoir
-- Dragapult ex → use Dragapult Dusknoir / Dragapult Charizard / Dragapult Blaziken
-- Gardevoir ex → use Gardevoir Jellicent (specific variant)
-- Gholdengo ex → use Gholdengo Lunatone / Gholdengo Genesect
--
-- Archetypes are kept for alias matching; only the deck rows are hidden.
-- Existing squad rows that reference these deck IDs still work for scoring.
-- ============================================================

-- Add hidden column if not already there
ALTER TABLE decks ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Hide the standalone generic decks
UPDATE decks
SET hidden = true
WHERE archetype_id IN (
  SELECT id FROM fantasy_archetypes
  WHERE slug IN (
    'charizard-ex',
    'dragapult-ex',
    'gardevoir-ex',
    'gholdengo-ex'
  )
);

-- ============================================================
-- Recreate RPC to filter out hidden decks
-- ============================================================
CREATE OR REPLACE FUNCTION get_deck_list_with_points()
RETURNS TABLE (
  deck_id       INTEGER,
  deck_name     TEXT,
  archetype_id  INTEGER,
  archetype_slug TEXT,
  image_url     TEXT,
  image_url_2   TEXT,
  meta_share    NUMERIC,
  cost          INTEGER,
  tier          TEXT,
  total_points  BIGINT
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    d.id AS deck_id,
    d.name AS deck_name,
    d.archetype_id,
    a.slug AS archetype_slug,
    COALESCE(a.image_url, d.image_url) AS image_url,
    COALESCE(a.image_url_2, d.image_url_2) AS image_url_2,
    d.meta_share,
    d.cost,
    d.tier,
    COALESCE(SUM(s.points), 0) AS total_points
  FROM decks d
  LEFT JOIN fantasy_archetypes a ON a.id = d.archetype_id
  LEFT JOIN fantasy_archetype_scores_live s ON s.archetype_id = d.archetype_id
  WHERE d.meta_share >= 0.5
    AND (d.hidden IS NULL OR d.hidden = false)
  GROUP BY d.id, d.name, d.archetype_id, a.slug, a.image_url, a.image_url_2,
           d.image_url, d.image_url_2, d.meta_share, d.cost, d.tier
  ORDER BY total_points DESC, d.meta_share DESC;
$$;
