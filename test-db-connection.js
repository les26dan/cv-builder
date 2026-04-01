require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables!');
    return;
  }

  // Test with anon key (client-side)
  console.log('Testing with ANON key (client-side access)...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await anonClient
      .from('cv_workflow')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Anon key connection error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Anon key connection successful!');
      console.log('   Data:', data);
    }
  } catch (err) {
    console.log('❌ Anon key connection exception:', err.message);
  }

  console.log('');

  // Test with service role key (server-side)
  console.log('Testing with SERVICE ROLE key (server-side access)...');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await serviceClient
      .from('cv_workflow')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Service role connection error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Service role connection successful!');
      console.log('   Data:', data);
    }
  } catch (err) {
    console.log('❌ Service role connection exception:', err.message);
  }

  console.log('');

  // Test actual table access with RLS
  console.log('Testing RLS policies...');
  console.log('Attempting to query cv_workflow without auth (should fail with RLS)...');

  try {
    const { data, error } = await anonClient
      .from('cv_workflow')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ RLS working - no rows returned (expected with RLS enabled)');
      } else {
        console.log('⚠️  Error:', error.message);
        console.log('   This might be RLS blocking access (which is good!)');
      }
    } else {
      console.log('✅ Query successful');
      console.log('   Rows returned:', data.length);
    }
  } catch (err) {
    console.log('❌ Query exception:', err.message);
  }

  console.log('');

  // Check table structure
  console.log('Checking table structure...');
  try {
    const { data, error } = await serviceClient
      .from('cv_workflow')
      .select('*')
      .limit(0);

    if (error) {
      console.log('❌ Cannot check table structure:', error.message);
    } else {
      console.log('✅ Table cv_workflow exists and is accessible');
    }
  } catch (err) {
    console.log('❌ Table check exception:', err.message);
  }

  console.log('\n✨ Connection test complete!\n');
}

testConnection();
