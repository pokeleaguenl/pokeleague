#!/usr/bin/env node

// Add archetype_id to decks table and populate by matching names
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkDecksToArchetypes() {
  console.log('🔗 Linking decks to fantasy archetypes...\n');

  // 1. Check if archetype_id column exists
  console.log('Step 1: Checking schema...');
  const { data: sample } = await supabase.from('decks').select('*').limit(1);
  
  if (sample && sample[0] && 'archetype_id' in sample[0]) {
    console.log('✅ archetype_id column already exists\n');
  } else {
    console.log('⚠️  archetype_id column does NOT exist');
    console.log('   You need to run this SQL migration first:\n');
    console.log('   ALTER TABLE decks ADD COLUMN archetype_id INTEGER REFERENCES fantasy_archetypes(id);');
    console.log('\n   Run it in Supabase SQL Editor, then re-run this script.\n');
    return;
  }

  // 2. Fetch all decks and archetypes
  const [{ data: decks }, { data: archetypes }] = await Promise.all([
    supabase.from('decks').select('id, name, archetype_id'),
    supabase.from('fantasy_archetypes').select('id, name'),
  ]);

  console.log(`Found ${decks?.length || 0} decks and ${archetypes?.length || 0} archetypes\n`);

  // 3. Match by name and update
  let matched = 0;
  let unmatched = 0;

  for (const deck of decks || []) {
    // Find matching archetype
    const archetype = archetypes?.find(a => a.name.toLowerCase() === deck.name.toLowerCase());

    if (archetype) {
      if (deck.archetype_id === archetype.id) {
        console.log(`✓ ${deck.name} already linked to archetype ${archetype.id}`);
      } else {
        console.log(`🔗 Linking ${deck.name} → archetype ${archetype.id}`);
        
        const { error } = await supabase
          .from('decks')
          .update({ archetype_id: archetype.id })
          .eq('id', deck.id);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Updated`);
          matched++;
        }
      }
    } else {
      console.log(`⚠️  No archetype found for deck: ${deck.name}`);
      unmatched++;
    }
  }

  console.log(`\n✅ Complete: ${matched} linked, ${unmatched} unmatched`);
}

linkDecksToArchetypes().catch(console.error);
