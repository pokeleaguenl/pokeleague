-- ============================================================
-- Expand archetypes based on Limitless TCG deck list
-- Source: https://limitlesstcg.com/decks?variants=true
-- All 43 archetypes from pages 1 & 2 (Season 2025-26)
--
-- Strategy:
--   1. Insert fantasy_archetypes (slug + name)
--   2. Insert decks linked to those archetypes (tier + cost)
--   3. Insert aliases (slug variants for matching)
--
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- Tiers: S=top meta, A=strong, B=solid, C=fringe, D=rogue
-- Costs reflect meta power (budget 200pts across 10 slots)
-- ============================================================

-- ============================================================
-- PART 1: fantasy_archetypes
-- ============================================================

INSERT INTO fantasy_archetypes (slug, name) VALUES
  -- Page 1
  ('dragapult-dusknoir',           'Dragapult Dusknoir'),
  ('grimmsnarl-froslass',          'Grimmsnarl Froslass'),
  ('ns-zoroark-ex',                'N''s Zoroark ex'),
  ('gholdengo-lunatone',           'Gholdengo Lunatone'),
  ('gardevoir-ex',                 'Gardevoir ex'),
  ('froslass-munkidori',           'Froslass Munkidori'),
  ('mega-absol-box',               'Mega Absol Box'),
  ('crustle-mysterious-rock-inn',  'Crustle Mysterious Rock Inn'),
  ('raging-bolt-ogerpon',          'Raging Bolt Ogerpon'),
  ('joltik-box',                   'Joltik Box'),
  ('gardevoir-jellicent',          'Gardevoir Jellicent'),
  ('charizard-noctowl',            'Charizard Noctowl'),
  ('dragapult-charizard',          'Dragapult Charizard'),
  ('ceruledge-ex',                 'Ceruledge ex'),
  ('charizard-pidgeot',            'Charizard Pidgeot'),
  ('kangaskhan-bouffalant',        'Kangaskhan Bouffalant'),
  ('tera-box',                     'Tera Box'),
  ('alakazam-dudunsparce',         'Alakazam Dudunsparce'),
  ('festival-lead',                'Festival Lead'),
  ('ogerpon-meganium',             'Ogerpon Meganium'),
  ('flareon-noctowl',              'Flareon Noctowl'),
  ('rockets-honchkrow',            'Rocket''s Honchkrow'),
  ('lucario-hariyama',             'Lucario Hariyama'),
  ('greninja-ex',                  'Greninja ex'),
  ('alakazam-powerful-hand',       'Alakazam Powerful Hand'),
  -- Page 2
  ('slowking-seek-inspiration',    'Slowking Seek Inspiration'),
  ('dragapult-blaziken',           'Dragapult Blaziken'),
  ('dragapult-ex',                 'Dragapult ex'),
  ('okidogi-adrena-power',         'Okidogi Adrena-Power'),
  ('great-tusk-mill',              'Great Tusk Mill'),
  ('iron-hands-magneton',          'Iron Hands Magneton'),
  ('ethans-typhlosion',            'Ethan''s Typhlosion'),
  ('ho-oh-armarouge',              'Ho-Oh Armarouge'),
  ('kangaskhan-yanmega',           'Kangaskhan Yanmega'),
  ('poison-box',                   'Poison Box'),
  ('ethans-magcargo',              'Ethan''s Magcargo'),
  ('ogerpon-box',                  'Ogerpon Box'),
  ('future-box',                   'Future Box'),
  ('cynthias-garchomp-ex',         'Cynthia''s Garchomp ex'),
  ('mega-venusaur-ex',             'Mega Venusaur ex'),
  ('conkeldurr-gutsy-swing',       'Conkeldurr Gutsy Swing'),
  ('ursaluna-lunatone',            'Ursaluna Lunatone'),
  ('rockets-mewtwo-ex',            'Rocket''s Mewtwo ex')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PART 2: decks (linked to archetypes via archetype_id)
-- tier: S/A/B/C/D  |  cost: squad budget allocation (sum to ~200 for full squad)
-- meta_share is approximate % — will be updated by sync jobs
-- ============================================================

INSERT INTO decks (name, tier, cost, meta_share, archetype_id)
SELECT
  fa.name,
  d.tier,
  d.cost,
  d.meta_share,
  fa.id
FROM (VALUES
  -- slug,                          tier, cost, meta_share
  ('dragapult-dusknoir',           'S',  32,   14.0),
  ('grimmsnarl-froslass',          'S',  30,   12.0),
  ('ns-zoroark-ex',                'A',  26,    8.0),
  ('gholdengo-lunatone',           'A',  24,    7.0),
  ('gardevoir-ex',                 'S',  30,   10.0),
  ('froslass-munkidori',           'A',  22,    6.0),
  ('mega-absol-box',               'B',  18,    5.0),
  ('crustle-mysterious-rock-inn',  'C',   8,    2.0),
  ('raging-bolt-ogerpon',          'B',  16,    5.0),
  ('joltik-box',                   'C',   9,    2.5),
  ('gardevoir-jellicent',          'B',  14,    4.0),
  ('charizard-noctowl',            'A',  20,    6.5),
  ('dragapult-charizard',          'B',  14,    3.5),
  ('ceruledge-ex',                 'B',  14,    3.5),
  ('charizard-pidgeot',            'A',  22,    7.0),
  ('kangaskhan-bouffalant',        'B',  12,    3.0),
  ('tera-box',                     'B',  12,    3.0),
  ('alakazam-dudunsparce',         'B',  14,    4.0),
  ('festival-lead',                'B',  12,    3.0),
  ('ogerpon-meganium',             'B',  12,    3.0),
  ('flareon-noctowl',              'C',   9,    2.0),
  ('rockets-honchkrow',            'C',   9,    2.0),
  ('lucario-hariyama',             'C',   9,    2.5),
  ('greninja-ex',                  'C',  10,    2.5),
  ('alakazam-powerful-hand',       'C',   8,    2.0),
  ('slowking-seek-inspiration',    'C',   8,    1.5),
  ('dragapult-blaziken',           'B',  12,    3.0),
  ('dragapult-ex',                 'B',  14,    3.5),
  ('okidogi-adrena-power',         'C',   8,    2.0),
  ('great-tusk-mill',              'C',   8,    1.5),
  ('iron-hands-magneton',          'C',   9,    2.0),
  ('ethans-typhlosion',            'C',   9,    2.0),
  ('ho-oh-armarouge',              'C',   9,    2.0),
  ('kangaskhan-yanmega',           'C',   8,    1.5),
  ('poison-box',                   'D',   5,    1.0),
  ('ethans-magcargo',              'D',   5,    1.0),
  ('ogerpon-box',                  'C',   8,    2.0),
  ('future-box',                   'C',   8,    1.5),
  ('cynthias-garchomp-ex',         'B',  14,    3.5),
  ('mega-venusaur-ex',             'C',   9,    2.0),
  ('conkeldurr-gutsy-swing',       'D',   5,    1.0),
  ('ursaluna-lunatone',            'C',   8,    2.0),
  ('rockets-mewtwo-ex',            'C',   9,    2.0)
) AS d(slug, tier, cost, meta_share)
JOIN fantasy_archetypes fa ON fa.slug = d.slug
WHERE NOT EXISTS (
  SELECT 1 FROM decks WHERE archetype_id = fa.id OR lower(name) = lower(fa.name)
);

-- ============================================================
-- PART 3: Aliases for matching rk9_standings archetype names
-- Covers: Limitless display names, RK9 raw names, slug variants,
--         short-form names, combo card names
-- ============================================================

INSERT INTO fantasy_archetype_aliases (alias, archetype_id)
SELECT alias, archetype_id FROM (
  SELECT fa.id AS archetype_id, unnest(aliases) AS alias
  FROM (VALUES
    -- Dragapult Dusknoir
    ('dragapult-dusknoir', ARRAY[
      'dragapult-dusknoir','dragapult dusknoir','dragapult / dusknoir',
      'dusknoir-dragapult','dusknoir dragapult',
      'dragapult-ex-dusknoir','dragapult ex / dusknoir'
    ]),
    -- Grimmsnarl Froslass
    ('grimmsnarl-froslass', ARRAY[
      'grimmsnarl-froslass','grimmsnarl froslass','grimmsnarl / froslass',
      'froslass-grimmsnarl','grimmsnarl'
    ]),
    -- N's Zoroark ex
    ('ns-zoroark-ex', ARRAY[
      'ns-zoroark-ex','n''s zoroark ex','n-s-zoroark-ex',
      'zoroark-ex','zoroark ex','zoroark','ns-zoroark'
    ]),
    -- Gholdengo Lunatone
    ('gholdengo-lunatone', ARRAY[
      'gholdengo-lunatone','gholdengo lunatone','gholdengo / lunatone',
      'lunatone-gholdengo','gholdengo-ex-lunatone','gholdengo ex / lunatone',
      'gholdengo-ex','gholdengo ex','gholdengo','gholdy'
    ]),
    -- Gardevoir ex
    ('gardevoir-ex', ARRAY[
      'gardevoir-ex','gardevoir ex','gardevoir','gardy','garde',
      'gardevoir-ex-cresselia','gardevoir ex / cresselia'
    ]),
    -- Froslass Munkidori
    ('froslass-munkidori', ARRAY[
      'froslass-munkidori','froslass munkidori','froslass / munkidori',
      'munkidori-froslass','munkidori froslass','froslass'
    ]),
    -- Mega Absol Box
    ('mega-absol-box', ARRAY[
      'mega-absol-box','mega absol box','absol-box','absol box',
      'mega-absol','mega absol'
    ]),
    -- Crustle Mysterious Rock Inn
    ('crustle-mysterious-rock-inn', ARRAY[
      'crustle-mysterious-rock-inn','crustle mysterious rock inn',
      'crustle','crustle-mill','crustle mill','mysterious-rock-inn'
    ]),
    -- Raging Bolt Ogerpon
    ('raging-bolt-ogerpon', ARRAY[
      'raging-bolt-ogerpon','raging bolt ogerpon','raging-bolt / ogerpon',
      'raging-bolt-ex-ogerpon','raging bolt ex / ogerpon',
      'raging-bolt-ex','raging bolt ex','raging-bolt','raging bolt','bolt'
    ]),
    -- Joltik Box
    ('joltik-box', ARRAY[
      'joltik-box','joltik box','joltik'
    ]),
    -- Gardevoir Jellicent
    ('gardevoir-jellicent', ARRAY[
      'gardevoir-jellicent','gardevoir jellicent','gardevoir / jellicent',
      'gardevoir-ex-jellicent','gardevoir ex / jellicent',
      'jellicent-gardevoir','jellicent'
    ]),
    -- Charizard Noctowl
    ('charizard-noctowl', ARRAY[
      'charizard-noctowl','charizard noctowl','charizard / noctowl',
      'charizard-ex-noctowl','charizard ex / noctowl',
      'noctowl-charizard'
    ]),
    -- Dragapult Charizard
    ('dragapult-charizard', ARRAY[
      'dragapult-charizard','dragapult charizard','dragapult / charizard',
      'charizard-dragapult'
    ]),
    -- Ceruledge ex
    ('ceruledge-ex', ARRAY[
      'ceruledge-ex','ceruledge ex','ceruledge'
    ]),
    -- Charizard Pidgeot
    ('charizard-pidgeot', ARRAY[
      'charizard-pidgeot','charizard pidgeot','charizard / pidgeot',
      'charizard-ex-pidgeot','charizard ex / pidgeot ex',
      'charizard-ex-pidgeot-ex','pidgeot-charizard',
      'charizard-ex','charizard ex','charizard','zard'
    ]),
    -- Kangaskhan Bouffalant
    ('kangaskhan-bouffalant', ARRAY[
      'kangaskhan-bouffalant','kangaskhan bouffalant','kangaskhan / bouffalant',
      'kangaskhan-ex-bouffalant','kangaskhan ex / bouffalant'
    ]),
    -- Tera Box
    ('tera-box', ARRAY[
      'tera-box','tera box','tera-toolbox','tera toolbox'
    ]),
    -- Alakazam Dudunsparce
    ('alakazam-dudunsparce', ARRAY[
      'alakazam-dudunsparce','alakazam dudunsparce','alakazam / dudunsparce',
      'alakazam-meg','alakazam-meg-dudunsparce','dudunsparce-alakazam'
    ]),
    -- Festival Lead
    ('festival-lead', ARRAY[
      'festival-lead','festival lead','festival-grounds','festival grounds'
    ]),
    -- Ogerpon Meganium
    ('ogerpon-meganium', ARRAY[
      'ogerpon-meganium','ogerpon meganium','ogerpon / meganium',
      'meganium-ogerpon','wellspring-mask-ogerpon-meganium',
      'teal-mask-ogerpon-meganium'
    ]),
    -- Flareon Noctowl
    ('flareon-noctowl', ARRAY[
      'flareon-noctowl','flareon noctowl','flareon / noctowl',
      'noctowl-flareon','flareon-ex-noctowl','flareon ex / noctowl'
    ]),
    -- Rocket's Honchkrow
    ('rockets-honchkrow', ARRAY[
      'rockets-honchkrow','rocket''s honchkrow','rockets honchkrow',
      'honchkrow','rocket-honchkrow'
    ]),
    -- Lucario Hariyama
    ('lucario-hariyama', ARRAY[
      'lucario-hariyama','lucario hariyama','lucario / hariyama',
      'hariyama-lucario','lucario-ex-hariyama','lucario ex / hariyama'
    ]),
    -- Greninja ex
    ('greninja-ex', ARRAY[
      'greninja-ex','greninja ex','greninja'
    ]),
    -- Alakazam Powerful Hand
    ('alakazam-powerful-hand', ARRAY[
      'alakazam-powerful-hand','alakazam powerful hand',
      'alakazam','alakazam-ex','powerful-hand-alakazam'
    ]),
    -- Slowking Seek Inspiration
    ('slowking-seek-inspiration', ARRAY[
      'slowking-seek-inspiration','slowking seek inspiration',
      'slowking','slowking-scr','slowking ex'
    ]),
    -- Dragapult Blaziken
    ('dragapult-blaziken', ARRAY[
      'dragapult-blaziken','dragapult blaziken','dragapult / blaziken',
      'blaziken-dragapult','blaziken dragapult'
    ]),
    -- Dragapult ex
    ('dragapult-ex', ARRAY[
      'dragapult-ex','dragapult ex','dragapult'
    ]),
    -- Okidogi Adrena-Power
    ('okidogi-adrena-power', ARRAY[
      'okidogi-adrena-power','okidogi adrena-power','okidogi adrena power',
      'okidogi','okidogi-twm','okidogi-ex'
    ]),
    -- Great Tusk Mill
    ('great-tusk-mill', ARRAY[
      'great-tusk-mill','great tusk mill','great-tusk','great tusk',
      'great-tusk-ex'
    ]),
    -- Iron Hands Magneton
    ('iron-hands-magneton', ARRAY[
      'iron-hands-magneton','iron hands magneton','iron hands / magneton',
      'iron-hands','iron hands','iron-hands-ex','iron-hands-magneton-ex',
      'iron-hands-magneton-ex-magneton'
    ]),
    -- Ethan's Typhlosion
    ('ethans-typhlosion', ARRAY[
      'ethans-typhlosion','ethan''s typhlosion','ethans typhlosion',
      'typhlosion','ethan-typhlosion'
    ]),
    -- Ho-Oh Armarouge
    ('ho-oh-armarouge', ARRAY[
      'ho-oh-armarouge','ho-oh armarouge','ho-oh / armarouge',
      'ho-oh','armarouge-ho-oh','ho-oh-ex-armarouge',
      'ho-oh-ex','ho-oh ex'
    ]),
    -- Kangaskhan Yanmega
    ('kangaskhan-yanmega', ARRAY[
      'kangaskhan-yanmega','kangaskhan yanmega','kangaskhan / yanmega',
      'yanmega-kangaskhan'
    ]),
    -- Poison Box
    ('poison-box', ARRAY[
      'poison-box','poison box','poison-toolbox','okidogi-munkidori-fezandipiti'
    ]),
    -- Ethan's Magcargo
    ('ethans-magcargo', ARRAY[
      'ethans-magcargo','ethan''s magcargo','ethans magcargo',
      'magcargo','ethan-magcargo'
    ]),
    -- Ogerpon Box
    ('ogerpon-box', ARRAY[
      'ogerpon-box','ogerpon box','ogerpon-toolbox','ogerpon toolbox',
      'ogerpon','teal-mask-ogerpon','wellspring-mask-ogerpon'
    ]),
    -- Future Box
    ('future-box', ARRAY[
      'future-box','future box','future-toolbox','future toolbox',
      'iron-thorns-future-box','future-deck'
    ]),
    -- Cynthia's Garchomp ex
    ('cynthias-garchomp-ex', ARRAY[
      'cynthias-garchomp-ex','cynthia''s garchomp ex','cynthias garchomp ex',
      'garchomp-ex','garchomp ex','garchomp','cynthias-garchomp',
      'cynthia-garchomp'
    ]),
    -- Mega Venusaur ex
    ('mega-venusaur-ex', ARRAY[
      'mega-venusaur-ex','mega venusaur ex','venusaur-ex','venusaur ex',
      'mega-venusaur','venusaur'
    ]),
    -- Conkeldurr Gutsy Swing
    ('conkeldurr-gutsy-swing', ARRAY[
      'conkeldurr-gutsy-swing','conkeldurr gutsy swing','conkeldurr'
    ]),
    -- Ursaluna Lunatone
    ('ursaluna-lunatone', ARRAY[
      'ursaluna-lunatone','ursaluna lunatone','ursaluna / lunatone',
      'bloodmoon-ursaluna-lunatone','bloodmoon ursaluna / lunatone',
      'ursaluna','bloodmoon-ursaluna-ex','bloodmoon ursaluna ex',
      'bloodmoon-ursaluna','bloodmoon ursaluna','ursaluna-ex'
    ]),
    -- Rocket's Mewtwo ex
    ('rockets-mewtwo-ex', ARRAY[
      'rockets-mewtwo-ex','rocket''s mewtwo ex','rockets mewtwo ex',
      'mewtwo-ex','mewtwo ex','mewtwo','rocket-mewtwo'
    ])
  ) AS t(slug, aliases)
  JOIN fantasy_archetypes fa ON fa.slug = t.slug
  CROSS JOIN LATERAL unnest(t.aliases) AS alias
) AS alias_data
ON CONFLICT (alias) DO NOTHING;
