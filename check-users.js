require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking users in database...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying users:', error);
    return;
  }

  console.log(`✅ Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`User ${index + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Full Name: ${user.full_name}`);
    console.log(`  Email Verified: ${user.email_verified}`);
    console.log(`  Signup Method: ${user.signup_method}`);
    console.log(`  Account Status: ${user.account_status}`);
    console.log(`  Has Password: ${user.password_hash ? 'Yes' : 'No'}`);
    console.log(`  Created: ${user.created_at}`);
    console.log('');
  });
}

checkUsers();
