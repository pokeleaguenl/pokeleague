import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Analyzing Base vs Variant Archetype Pattern ===\n');

// Get all archetypes
const { data: archetypes } = await supabase
  .from('fantasy_archetypes')
  .select('id, name, canonical_id')
  .order('name');

// Find bases and their variants
const basePattern = {};

for (const arch of archetypes || []) {
  if (arch.canonical_id) continue; // Skip canonical references
  
  // Extract base name (first part before " / ")
  const baseName = arch.name.split(' / ')[0];
  
  if (!basePattern[baseName]) {
    basePattern[baseName] = {
      base: null,
      variants: []
    };
  }
  
  if (arch.name === baseName) {
    basePattern[baseName].base = arch;
  } else if (arch.name.startsWith(baseName + ' / ')) {
    basePattern[baseName].variants.push(arch);
  }
}

// Show bases that have variants
console.log('Base archetypes with separate variant archetypes:\n');

for (const [baseName, data] of Object.entries(basePattern)) {
  if (data.base && data.variants.length > 0) {
    console.log(`${baseName} (id: ${data.base.id})`);
    console.log(`  ${data.variants.length} variants:`);
    data.variants.slice(0, 3).forEach(v => console.log(`    - ${v.name} (id: ${v.id})`));
    if (data.variants.length > 3) {
      console.log(`    ... and ${data.variants.length - 3} more`);
    }
    console.log('');
  }
}

console.log('\n=== DESIGN DECISION ===');
console.log('Current approach: Base and variants are separate archetypes');
console.log('  ✅ Pro: Shows exact deck composition differences');
console.log('  ❌ Con: Base archetypes look weak with few entries');
console.log('');
console.log('Alternative: Use canonical_id to merge base → most popular variant');
console.log('  ✅ Pro: Users see full data for the archetype');
console.log('  ❌ Con: Loses granularity of exact deck variants');

process.exit(0);
