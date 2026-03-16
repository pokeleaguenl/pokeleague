import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Testing admin status ===\n');

// Test both admin users
const testUsers = [
  '0ee9107e-3fb5-4b90-beac-dbea1ddfaed4', // p1srg
  '6de5f45b-3576-4ad2-b1a2-d0a86c1f7f68', // dommitron
];

for (const userId of testUsers) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin')
    .eq('id', userId)
    .single();
  
  const status = profile?.is_admin ? '✅ ADMIN' : '❌ NOT ADMIN';
  console.log(`${status} - ${profile?.username}`);
}

console.log('\n');
process.exit(0);
