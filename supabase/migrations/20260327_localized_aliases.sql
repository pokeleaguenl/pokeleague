-- ============================================================
-- Localized name aliases: German (DE) + French (FR)
-- Source: PokeAPI pokemon-species endpoint
--
-- Confirmed mappings from unmatched rk9_standings data:
--   Stuttgart Regional (DE), Lille / Belo Horizonte / Frankfurt (FR)
--
-- Localization reference:
--   Dragapult:    DE=Katapuldra   FR=Lanssorien
--   Dusknoir:     DE=Zwirrfinst   FR=Noctunoir
--   Dreepy:       DE=Grolldra     FR=Fantyrm
--   Gholdengo:    DE=Monetigo     FR=Gromago
--   Ceruledge:    DE=Azugladis    FR=Malvalame
--   Raging Bolt:  DE=Furienblitz  FR=Ire-Foudre
--   Garchomp:     DE=Knakrack     FR=Carchacrok
--   Solrock:      DE=Sonnfel      FR=Solaroc
--   Noctowl:      DE=Noctuh       FR=Noarfang
--   Zoroark:      DE=Zoroark      FR=Zoroark   (same)
--   Reshiram:     DE=Reshiram     FR=Reshiram  (same)
--   Genesect:     DE=Genesect     FR=Genesect  (same)
--   Roserade:     DE=Roserade     FR=Roserade  (same)
-- ============================================================

-- ============================================================
-- PART 1: New archetypes for localized combos
-- ============================================================

INSERT INTO fantasy_archetypes (slug, name) VALUES
  ('gholdengo-genesect', 'Gholdengo ex / Genesect ex'),
  ('ceruledge-solrock',  'Ceruledge ex / Solrock'),
  ('garchomp-roserade',  'Garchomp ex / Roserade'),
  ('zoroark-reshiram',   'Zoroark ex / Reshiram')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO decks (name, tier, cost, meta_share, archetype_id)
SELECT fa.name, d.tier, d.cost, d.meta_share, fa.id
FROM (VALUES
  ('gholdengo-genesect', 'B', 12, 3.0),
  ('ceruledge-solrock',  'C',  8, 1.5),
  ('garchomp-roserade',  'C',  8, 1.5),
  ('zoroark-reshiram',   'C',  8, 1.5)
) AS d(slug, tier, cost, meta_share)
JOIN fantasy_archetypes fa ON fa.slug = d.slug
WHERE NOT EXISTS (
  SELECT 1 FROM decks WHERE archetype_id = fa.id OR lower(name) = lower(fa.name)
);

-- ============================================================
-- PART 2: Localized aliases
-- ============================================================

INSERT INTO fantasy_archetype_aliases (alias, archetype_id)
SELECT alias, archetype_id FROM (

  -- ── Ceruledge ex (DE: Azugladis, FR: Malvalame) ──────────
  SELECT fa.id, unnest(ARRAY[
    'azugladis-ex', 'azugladis ex', 'azugladis',
    'malvalame-ex', 'malvalame ex', 'malvalame'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'ceruledge-ex'

  UNION ALL

  -- ── Ceruledge ex / Squawkabilly ex ───────────────────────
  SELECT fa.id, unnest(ARRAY[
    'azugladis-ex / squawkabilly ex',
    'azugladis-ex-squawkabilly-ex',
    'malvalame-ex / squawkabilly ex',
    'malvalame-ex-squawkabilly-ex'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'ceruledge-squawkabilly'

  UNION ALL

  -- ── Gholdengo ex / Genesect ex (DE: Monetigo, FR: Gromago) ─
  SELECT fa.id, unnest(ARRAY[
    'monetigo-ex-genesect-ex', 'monetigo ex / genesect ex',
    'monetigo ex / genesect-ex', 'monetigo-genesect',
    'gromago-ex-genesect-ex', 'gromago-ex / genesect-ex',
    'gromago ex / genesect ex', 'gromago-genesect',
    'gholdengo ex / genesect ex', 'gholdengo-ex-genesect-ex',
    'gholdengo-genesect'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'gholdengo-genesect'

  UNION ALL

  -- ── Gholdengo ex / Lunatone ──────────────────────────────
  SELECT fa.id, unnest(ARRAY[
    'monetigo-ex', 'monetigo ex', 'monetigo',
    'gromago-ex', 'gromago ex', 'gromago',
    'monetigo ex / lunatone', 'gromago ex / lunatone'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'gholdengo-lunatone'

  UNION ALL

  -- ── Dragapult Dusknoir (DE: Katapuldra/Zwirrfinst, FR: Lanssorien/Noctunoir) ─
  SELECT fa.id, unnest(ARRAY[
    -- French combo
    'lanssorien-ex-noctunoir', 'lanssorien ex / noctunoir',
    'lanssorien ex / noctunoir ex', 'lanssorien-noctunoir',
    -- German combo (Katapuldra + Dreepy setup)
    'katapuldra-ex-grolldra', 'katapuldra ex / grolldra',
    'katapuldra-ex / grolldra',
    -- Dusknoir localized standalone aliases
    'zwirrfinst', 'zwirrfinst-ex', 'noctunoir', 'noctunoir-ex'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'dragapult-dusknoir'

  UNION ALL

  -- ── Dragapult ex (German standalone) ─────────────────────
  SELECT fa.id, unnest(ARRAY[
    'lanssorien-ex', 'lanssorien ex', 'lanssorien',
    'katapuldra-ex-dragapult', 'katapuldra dragapult'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'dragapult-ex'

  UNION ALL

  -- ── Raging Bolt ex / Ogerpon (DE: Furienblitz) ───────────
  SELECT fa.id, unnest(ARRAY[
    'ogerpon-ex-furienblitz-ex', 'ogerpon ex / furienblitz ex',
    'furienblitz-ex-ogerpon-ex', 'furienblitz ex / ogerpon ex',
    'furienblitz-ogerpon', 'furienblitz-ex',
    'furienblitz ex', 'furienblitz',
    'ire-foudre-ex', 'ire-foudre ex', 'ire-foudre',
    'ire-foudre-ogerpon', 'ogerpon ex / ire-foudre ex'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'raging-bolt-ogerpon'

  UNION ALL

  -- ── Garchomp ex / Roserade (FR: Carchacrok) ──────────────
  SELECT fa.id, unnest(ARRAY[
    'carchacrock-ex-roserade', 'carchacrock-ex / roserade',
    'carchacrok-ex / roserade', 'carchacrok-roserade',
    'knakrack-ex-roserade', 'knakrack ex / roserade',
    'garchomp ex / roserade', 'garchomp-ex-roserade'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'garchomp-roserade'

  UNION ALL

  -- ── Cynthia's Garchomp ex (DE: Knakrack) ─────────────────
  SELECT fa.id, unnest(ARRAY[
    'knakrack-ex', 'knakrack ex', 'knakrack',
    'cynthia-s-knakrack-ex', 'cynthia''s knakrack ex',
    'carchacrock-ex', 'carchacrok-ex', 'carchacrok'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'cynthias-garchomp-ex'

  UNION ALL

  -- ── Ceruledge ex / Solrock (FR: Malvalame / Solaroc) ─────
  SELECT fa.id, unnest(ARRAY[
    'malvalame-ex-solaroc', 'malvalame-ex / solaroc',
    'malvalame ex / solaroc', 'malvalame-solaroc',
    'azugladis-ex-sonnfel', 'azugladis ex / sonnfel',
    'ceruledge ex / solrock', 'ceruledge-solrock',
    'ceruledge-ex-solrock'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'ceruledge-solrock'

  UNION ALL

  -- ── Teal Mask Ogerpon ex / Noctowl (DE: Noctuh, FR: Noarfang) ─
  SELECT fa.id, unnest(ARRAY[
    'noctuh-ogerpon-ex', 'noctuh / ogerpon ex', 'noctuh-ogerpon',
    'noarfang-ogerpon-ex', 'noarfang / ogerpon ex', 'noarfang-ogerpon',
    'noarfang', 'noctuh'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'ogerpon-noctowl'

  UNION ALL

  -- ── Charizard Noctowl (FR combos with Noarfang) ──────────
  SELECT fa.id, unnest(ARRAY[
    'noarfang / charizard ex', 'charizard-ex-noarfang',
    'noctuh / charizard ex', 'charizard-ex-noctuh'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'charizard-noctowl'

  UNION ALL

  -- ── Zoroark ex / Reshiram ────────────────────────────────
  SELECT fa.id, unnest(ARRAY[
    'zoroark-ex-reshiram', 'zoroark-ex / reshiram',
    'zoroark ex / reshiram', 'reshiram-zoroark',
    'zoroark-reshiram'
  ]) FROM fantasy_archetypes fa WHERE fa.slug = 'zoroark-reshiram'

) AS alias_rows(archetype_id, alias)
ON CONFLICT (alias) DO NOTHING;
