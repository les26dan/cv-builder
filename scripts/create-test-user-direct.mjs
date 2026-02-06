import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('🔧 Creating test user in Supabase...');
    
    const testUser = {
      email: 'okbuddy.test.user@gmail.com',
      full_name: 'OkBuddy Test User',
      password_hash: '$2b$12$IHIuUMCC5xMw5MdzD6vIR.5csLp9T.e/GhCMv7QoyTpxPp5hGT.UW',
      email_verified: true,
      signup_method: 'email',
      account_status: 'active'
    };

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log('   📧 Email:', existingUser.email);
      console.log('   👤 Name:', existingUser.full_name);
      console.log('   🆔 ID:', existingUser.id);
      console.log('   📅 Created:', existingUser.created_at);
      return existingUser;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('🎉 Successfully created test user:');
    console.log('   📧 Email:', newUser.email);
    console.log('   🔐 Password: OkBuddy2025!');
    console.log('   👤 Name:', newUser.full_name);
    console.log('   🆔 ID:', newUser.id);
    console.log('   ✅ Verified:', newUser.email_verified);
    console.log('');
    console.log('🚀 Ready for testing:');
    console.log('   • Login at your production domain/login');
    console.log('   • Use for Google OAuth verification');
    console.log('   • Standard user permissions (no admin access)');

    return newUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

createTestUser()
  .then(() => {
    console.log('✅ Test user setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create test user:', error.message);
    process.exit(1);
  });