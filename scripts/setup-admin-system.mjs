import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Setting up admin system ===\n');

// Step 1: Try to add the column (might fail if it exists, that's ok)
console.log('Step 1: Adding is_admin column...');

// We can't directly execute DDL via Supabase client, so we'll do an upsert approach
// First check if column exists by trying to query it
const { error: testError } = await supabase
  .from('profiles')
  .select('is_admin')
  .limit(1);

if (testError && testError.message.includes('column')) {
  console.log('  ⚠️  Column does not exist. You need to add it via Supabase dashboard:');
  console.log('');
  console.log('  Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor');
  console.log('  Table: profiles');
  console.log('  Add column: is_admin (type: boolean, default: false)');
  console.log('');
  console.log('  OR run this SQL in the SQL Editor:');
  console.log('');
  console.log('  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;');
  console.log('');
  process.exit(1);
} else {
  console.log('  ✅ Column exists or can be queried');
}

// Step 2: Set admins
console.log('\nStep 2: Setting admin users...');

const adminUsers = [
  { id: '0ee9107e-3fb5-4b90-beac-dbea1ddfaed4', username: 'p1srg' },
  { id: '6de5f45b-3576-4ad2-b1a2-d0a86c1f7f68', username: 'dommitron' },
];

for (const user of adminUsers) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', user.id);
  
  if (error) {
    console.log(`  ❌ Failed to set ${user.username} as admin:`, error.message);
  } else {
    console.log(`  ✅ Set ${user.username} as admin`);
  }
}

// Step 3: Verify
console.log('\nStep 3: Verifying admin users...');
const { data: admins } = await supabase
  .from('profiles')
  .select('id, username, is_admin')
  .eq('is_admin', true);

console.log(`\nAdmin users: ${admins?.length || 0}`);
admins?.forEach(a => {
  console.log(`  ✅ ${a.username} (id: ${a.id})`);
});

console.log('\n=== Done! ===\n');
process.exit(0);
