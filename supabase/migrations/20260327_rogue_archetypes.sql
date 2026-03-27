-- ============================================================
-- Rogue archetypes: Option C — add real rogue decks as proper
-- archetypes so they score correctly during ingest.
-- Source: top unmatched rk9_standings names (8+ occurrences)
-- ============================================================

-- ============================================================
-- PART 1: New fantasy_archetypes
-- ============================================================

INSERT INTO fantasy_archetypes (slug, name) VALUES
  ('toedscruel-ogerpon',        'Toedscruel ex / Ogerpon ex'),
  ('dipplin-thwackey',          'Dipplin / Thwackey'),
  ('roaring-moon-pecharunt',    'Roaring Moon ex / Pecharunt ex'),
  ('ceruledge-squawkabilly',    'Ceruledge ex / Squawkabilly ex'),
  ('charizard-dusknoir',        'Charizard ex / Dusknoir'),
  ('hydreigon-ogerpon',         'Hydreigon ex / Ogerpon ex'),
  ('typhlosion-pidgeot',        'Typhlosion ex / Pidgeot ex'),
  ('dragonite-eelektrik',       'Dragonite ex / Eelektrik'),
  ('hydrapple-ogerpon',         'Hydrapple / Ogerpon ex'),
  ('lopunny-dusknoir',          'Lopunny ex / Dusknoir'),
  ('zoroark-fezandipiti',       'Zoroark ex / Fezandipiti ex'),
  ('pidgeot-toolbox',           'Pidgeot ex / Toolbox'),
  ('grimmsnarl-fezandipiti',    'Grimmsnarl ex / Fezandipiti ex'),
  ('farigiraf-milotic',         'Farigiraf ex / Milotic ex'),
  ('ogerpon-noctowl',           'Teal Mask Ogerpon ex / Noctowl'),
  ('zoroark-ogerpon',           'Zoroark ex / Ogerpon ex'),
  ('pecharunt-fezandipiti',     'Pecharunt ex / Fezandipiti ex'),
  ('typhlosion-dragapult',      'Typhlosion ex / Dragapult ex'),
  ('ethans-ho-oh',              'Ethan''s Ho-Oh ex'),
  ('crustle-ogerpon',           'Crustle ex / Ogerpon ex'),
  ('mega-dragonite-ex',         'Mega Dragonite ex')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PART 2: Decks linked to new archetypes
-- ============================================================

INSERT INTO decks (name, tier, cost, meta_share, archetype_id)
SELECT fa.name, d.tier, d.cost, d.meta_share, fa.id
FROM (VALUES
  ('toedscruel-ogerpon',        'C',  8,  2.0),
  ('dipplin-thwackey',          'C',  8,  2.5),
  ('roaring-moon-pecharunt',    'B', 12,  3.0),
  ('ceruledge-squawkabilly',    'C',  8,  2.0),
  ('charizard-dusknoir',        'B', 12,  3.0),
  ('hydreigon-ogerpon',         'C',  8,  2.0),
  ('typhlosion-pidgeot',        'B', 10,  2.5),
  ('dragonite-eelektrik',       'C',  8,  2.0),
  ('hydrapple-ogerpon',         'C',  7,  1.5),
  ('lopunny-dusknoir',          'C',  7,  1.5),
  ('zoroark-fezandipiti',       'C',  8,  2.0),
  ('pidgeot-toolbox',           'C',  8,  2.0),
  ('grimmsnarl-fezandipiti',    'C',  8,  2.0),
  ('farigiraf-milotic',         'C',  7,  1.5),
  ('ogerpon-noctowl',           'C',  8,  2.0),
  ('zoroark-ogerpon',           'C',  7,  1.5),
  ('pecharunt-fezandipiti',     'C',  7,  1.5),
  ('typhlosion-dragapult',      'C',  8,  2.0),
  ('ethans-ho-oh',              'C',  7,  1.5),
  ('crustle-ogerpon',           'C',  7,  1.5),
  ('mega-dragonite-ex',         'C',  8,  2.0)
) AS d(slug, tier, cost, meta_share)
JOIN fantasy_archetypes fa ON fa.slug = d.slug
WHERE NOT EXISTS (
  SELECT 1 FROM decks WHERE archetype_id = fa.id OR lower(name) = lower(fa.name)
);

-- ============================================================
-- PART 3: Aliases
-- ============================================================

INSERT INTO fantasy_archetype_aliases (alias, archetype_id)
SELECT alias, archetype_id FROM (
  SELECT fa.id AS archetype_id, unnest(aliases) AS alias
  FROM (VALUES
    -- Toedscruel ex / Ogerpon ex
    ('toedscruel-ogerpon', ARRAY[
      'toedscruel-ogerpon','toedscruel ex / ogerpon ex',
      'toedscruel / ogerpon ex','toedscruel','toedscruel-ex-ogerpon-ex'
    ]),
    -- Dipplin / Thwackey
    ('dipplin-thwackey', ARRAY[
      'dipplin-thwackey','dipplin / thwackey','dipplin thwackey',
      'dipplin / rillaboom','dipplin-rillaboom','dipplin rillaboom','dipplin'
    ]),
    -- Roaring Moon ex / Pecharunt ex
    ('roaring-moon-pecharunt', ARRAY[
      'roaring-moon-pecharunt','roaring moon ex / pecharunt ex',
      'roaring moon / pecharunt ex','roaring-moon-ex-pecharunt-ex',
      'roaring moon ex / pecharunt','roaring-moon','roaring moon ex'
    ]),
    -- Ceruledge ex / Squawkabilly ex
    ('ceruledge-squawkabilly', ARRAY[
      'ceruledge-squawkabilly','ceruledge ex / squawkabilly ex',
      'ceruledge / squawkabilly ex','ceruledge-ex-squawkabilly-ex',
      'squawkabilly-ceruledge'
    ]),
    -- Charizard ex / Dusknoir
    ('charizard-dusknoir', ARRAY[
      'charizard-dusknoir','charizard ex / dusknoir',
      'charizard / dusknoir','dusknoir-charizard',
      'charizard-ex-dusknoir','dragapult ex / ursaluna'
    ]),
    -- Hydreigon ex / Ogerpon ex
    ('hydreigon-ogerpon', ARRAY[
      'hydreigon-ogerpon','hydreigon ex / ogerpon ex',
      'hydreigon / ogerpon ex','hydreigon-ex-ogerpon-ex','hydreigon'
    ]),
    -- Typhlosion ex / Pidgeot ex
    ('typhlosion-pidgeot', ARRAY[
      'typhlosion-pidgeot','typhlosion ex / pidgeot ex',
      'typhlosion / pidgeot ex','typhlosion-ex-pidgeot-ex',
      'ethan''s typhlosion / pidgeot ex','ethans-typhlosion-pidgeot',
      'ethan-typhlosion-pidgeot','typhlosion-pidgeot-ex',
      'typhlosion ex / dragapult ex'
    ]),
    -- Dragonite ex / Eelektrik
    ('dragonite-eelektrik', ARRAY[
      'dragonite-eelektrik','dragonite ex / eelektrik',
      'dragonite / eelektrik','dragonite-ex-eelektrik',
      'mega-dragonite-eelektrik'
    ]),
    -- Hydrapple / Ogerpon ex
    ('hydrapple-ogerpon', ARRAY[
      'hydrapple-ogerpon','hydrapple / ogerpon ex',
      'hydrapple-ogerpon-ex','hydrapple ogerpon',
      'meganium / ogerpon ex','meganium-ogerpon'
    ]),
    -- Lopunny ex / Dusknoir
    ('lopunny-dusknoir', ARRAY[
      'lopunny-dusknoir','lopunny ex / dusknoir',
      'lopunny / dusknoir','dusknoir-lopunny','lopunny-ex-dusknoir'
    ]),
    -- Zoroark ex / Fezandipiti ex
    ('zoroark-fezandipiti', ARRAY[
      'zoroark-fezandipiti','zoroark ex / fezandipiti ex',
      'zoroark / fezandipiti ex','zoroark-ex-fezandipiti-ex',
      'fezandipiti-zoroark'
    ]),
    -- Pidgeot ex / Toolbox
    ('pidgeot-toolbox', ARRAY[
      'pidgeot-toolbox','pidgeot ex / toolbox','pidgeot / toolbox',
      'pidgeot-ex-toolbox','pidgeot ex toolbox',
      'kangaskhan ex / pidgeot ex','kangaskhan-pidgeot',
      'pidgeot ex / ogerpon ex','pidgeot-ogerpon',
      'pidgeot ex / fezandipiti ex','pidgeot-fezandipiti',
      'pidgeot ex / mew ex','sylveon ex / pidgeot ex',
      'pidgeot ex / quaquaval ex'
    ]),
    -- Grimmsnarl ex / Fezandipiti ex
    ('grimmsnarl-fezandipiti', ARRAY[
      'grimmsnarl-fezandipiti','grimmsnarl ex / fezandipiti ex',
      'grimmsnarl / fezandipiti ex','grimmsnarl-ex-fezandipiti-ex',
      'fezandipiti-grimmsnarl','marnie''s grimmsnarl ex / froslass',
      'marnie-grimmsnarl-froslass'
    ]),
    -- Farigiraf ex / Milotic ex
    ('farigiraf-milotic', ARRAY[
      'farigiraf-milotic','farigiraf ex / milotic ex',
      'farigiraf / milotic ex','milotic ex / farigiraf ex',
      'milotic-farigiraf'
    ]),
    -- Teal Mask Ogerpon ex / Noctowl
    ('ogerpon-noctowl', ARRAY[
      'ogerpon-noctowl','teal mask ogerpon ex / noctowl',
      'ogerpon ex / noctowl','teal-mask-ogerpon-noctowl',
      'noctowl-ogerpon','noctuh / ogerpon ex','noctuh-ogerpon-ex',
      'noctowl / ogerpon','noctowl / ogerpon ex','ogerpon-noctowl-ex',
      'wellspring mask ogerpon ex / noctowl','cornerstone mask ogerpon ex / noctowl'
    ]),
    -- Zoroark ex / Ogerpon ex
    ('zoroark-ogerpon', ARRAY[
      'zoroark-ogerpon','zoroark ex / ogerpon ex',
      'zoroark / ogerpon ex','zoroark-ex-ogerpon-ex'
    ]),
    -- Pecharunt ex / Fezandipiti ex
    ('pecharunt-fezandipiti', ARRAY[
      'pecharunt-fezandipiti','pecharunt ex / fezandipiti ex',
      'pecharunt / fezandipiti ex','pecharunt-ex-fezandipiti-ex',
      'fezandipiti-pecharunt','pecharunt ex / codex'
    ]),
    -- Typhlosion ex / Dragapult ex
    ('typhlosion-dragapult', ARRAY[
      'typhlosion-dragapult','typhlosion ex / dragapult ex',
      'typhlosion / dragapult ex','typhlosion-ex-dragapult-ex',
      'dragapult-typhlosion','ethan''s typhlosion ex',
      'ethans-typhlosion-ex','ethan-s-typhlosion-ex'
    ]),
    -- Ethan's Ho-Oh ex
    ('ethans-ho-oh', ARRAY[
      'ethans-ho-oh','ethan''s ho-oh ex','ethans ho-oh ex',
      'ethan-ho-oh','ho-oh-ex-ethan','ethan-s-ho-oh-ex'
    ]),
    -- Crustle ex / Ogerpon ex
    ('crustle-ogerpon', ARRAY[
      'crustle-ogerpon','crustle ex / ogerpon ex',
      'crustle / ogerpon ex','crustle-ex-ogerpon-ex',
      'ogerpon-crustle','crustle ex'
    ]),
    -- Mega Dragonite ex
    ('mega-dragonite-ex', ARRAY[
      'mega-dragonite-ex','mega dragonite ex','mega-dragonite',
      'mega dragonite','dragonite-ex'
    ])
  ) AS t(slug, aliases)
  JOIN fantasy_archetypes fa ON fa.slug = t.slug
  CROSS JOIN LATERAL unnest(t.aliases) AS alias
) AS alias_data
ON CONFLICT (alias) DO NOTHING;

-- ============================================================
-- PART 4: Fix missing slug aliases for existing archetypes
-- (rk9 data sometimes uses slugified names without apostrophes)
-- ============================================================

INSERT INTO fantasy_archetype_aliases (alias, archetype_id)
SELECT alias, archetype_id FROM (VALUES
  -- cynthia-garchomp-ex → Cynthia's Garchomp ex (41 occurrences unmatched!)
  ('cynthia-garchomp-ex',          (SELECT id FROM fantasy_archetypes WHERE slug = 'cynthias-garchomp-ex')),
  ('cynthia-s-garchomp-ex',        (SELECT id FROM fantasy_archetypes WHERE slug = 'cynthias-garchomp-ex')),
  ('garchomp ex / cynthia''s',     (SELECT id FROM fantasy_archetypes WHERE slug = 'cynthias-garchomp-ex')),
  ('garchomp-ex-cynthia',          (SELECT id FROM fantasy_archetypes WHERE slug = 'cynthias-garchomp-ex')),
  ('carchacrock-ex',               (SELECT id FROM fantasy_archetypes WHERE slug = 'cynthias-garchomp-ex')),
  -- rocket-mewtwo-ex → Rocket's Mewtwo ex (28 occurrences)
  ('rocket-mewtwo-ex',             (SELECT id FROM fantasy_archetypes WHERE slug = 'rockets-mewtwo-ex')),
  ('rocket-s-mewtwo-ex',           (SELECT id FROM fantasy_archetypes WHERE slug = 'rockets-mewtwo-ex')),
  -- conkeldurr-twm → Conkeldurr Gutsy Swing (9 occurrences)
  ('conkeldurr-twm',               (SELECT id FROM fantasy_archetypes WHERE slug = 'conkeldurr-gutsy-swing')),
  ('conkeldurr ex / dudunsparce',  (SELECT id FROM fantasy_archetypes WHERE slug = 'conkeldurr-gutsy-swing')),
  ('conkeldurr ex / brute bonnet', (SELECT id FROM fantasy_archetypes WHERE slug = 'conkeldurr-gutsy-swing')),
  -- gholdengo-joltik-box → Joltik Box (9 occurrences)
  ('gholdengo-joltik-box',         (SELECT id FROM fantasy_archetypes WHERE slug = 'joltik-box')),
  ('gholdengo joltik box',         (SELECT id FROM fantasy_archetypes WHERE slug = 'joltik-box')),
  -- German: Katapuldra ex = Dragapult ex (17+8 occurrences)
  ('katapuldra-ex',                (SELECT id FROM fantasy_archetypes WHERE slug = 'dragapult-ex')),
  ('katapuldra ex',                (SELECT id FROM fantasy_archetypes WHERE slug = 'dragapult-ex')),
  ('katapuldra-ex-grolldra',       (SELECT id FROM fantasy_archetypes WHERE slug = 'dragapult-ex')),
  ('katapuldra ex / grolldra',     (SELECT id FROM fantasy_archetypes WHERE slug = 'dragapult-ex')),
  -- alakazam-meg → Alakazam Dudunsparce
  ('alakazam-meg',                 (SELECT id FROM fantasy_archetypes WHERE slug = 'alakazam-dudunsparce')),
  ('alakazam-meg-dudunsparce',     (SELECT id FROM fantasy_archetypes WHERE slug = 'alakazam-dudunsparce')),
  -- Eeveelution Toolbox → Joltik Box (closest match)
  ('eeveelution toolbox',          (SELECT id FROM fantasy_archetypes WHERE slug = 'joltik-box')),
  ('eeveelution-toolbox',          (SELECT id FROM fantasy_archetypes WHERE slug = 'joltik-box')),
  -- Sharpedo Toxtricity → rogue, alias to poison-box
  ('sharpedo-toxtricity',          (SELECT id FROM fantasy_archetypes WHERE slug = 'poison-box')),
  ('sharpedo / toxtricity',        (SELECT id FROM fantasy_archetypes WHERE slug = 'poison-box')),
  -- rocket-spidops (6 occurrences) — alias to rockets-honchkrow (same Rockets archetype)
  ('rocket-spidops',               (SELECT id FROM fantasy_archetypes WHERE slug = 'rockets-honchkrow')),
  -- slowking-scr → Slowking Seek Inspiration
  ('slowking-scr',                 (SELECT id FROM fantasy_archetypes WHERE slug = 'slowking-seek-inspiration')),
  ('slowking-scr-seek',            (SELECT id FROM fantasy_archetypes WHERE slug = 'slowking-seek-inspiration')),
  -- Ethan's Typhlosion → alias both plain Typhlosion and Ethan's forms
  ('typhlosion',                   (SELECT id FROM fantasy_archetypes WHERE slug = 'ethans-typhlosion'))
) AS a(alias, archetype_id)
WHERE archetype_id IS NOT NULL
ON CONFLICT (alias) DO NOTHING;
