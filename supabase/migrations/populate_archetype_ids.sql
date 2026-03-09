-- Populate archetype_id by matching deck names to fantasy_archetypes
-- Run this in Supabase SQL Editor

UPDATE decks d
SET archetype_id = fa.id
FROM fantasy_archetypes fa
WHERE LOWER(d.name) = LOWER(fa.name);

-- Verify the results
SELECT d.id, d.name, d.archetype_id, fa.name as archetype_name
FROM decks d
LEFT JOIN fantasy_archetypes fa ON d.archetype_id = fa.id
ORDER BY d.id;
