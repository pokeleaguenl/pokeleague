import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n=== Checking users table schema ===');

// Get sample user to see fields
const { data: users } = await supabase
  .from('users')
  .select('*')
  .limit(3);

if (users && users.length > 0) {
  console.log('\nSample user fields:');
  console.log(Object.keys(users[0]));
  console.log('\nSample user data (first user):');
  console.log(users[0]);
}

// Check if there's a profiles table (common in Supabase)
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (profiles) {
  console.log('\n=== Profiles table exists ===');
  console.log('Sample profile fields:');
  console.log(Object.keys(profiles[0] || {}));
}

// List all your admin users
console.log('\n=== Known admin users ===');
const adminEmails = [
  'dommitron', 
  'dom',
  // Add your actual admin emails/usernames
];

for (const identifier of adminEmails) {
  const { data: byEmail } = await supabase
    .from('users')
    .select('id, email, username')
    .or(`email.ilike.%${identifier}%,username.ilike.%${identifier}%`)
    .limit(1);
  
  if (byEmail && byEmail.length > 0) {
    console.log(`Found: ${byEmail[0].email || byEmail[0].username} (id: ${byEmail[0].id})`);
  }
}

process.exit(0);
