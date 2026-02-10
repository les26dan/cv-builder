const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkAdmin() {
  console.log('🔗 Testing Supabase connection...');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error('❌ Missing credentials');
    console.log('URL:', url ? 'SET' : 'NOT SET');
    console.log('SERVICE KEY:', key ? 'SET' : 'NOT SET');
    return;
  }
  
  console.log('📍 URL:', url);
  console.log('🔑 Service Key: [CONFIGURED]');
  
  const supabase = createClient(url, key);
  
  try {
    // Test connection
    console.log('🧪 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful!');
    
    // Check for admin user
    console.log('👤 Checking for admin user...');
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single();
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Error checking admin:', adminError.message);
      return;
    }
    
    if (admin) {
      console.log('✅ Admin user exists:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.full_name);
      console.log('   Verified:', admin.email_verified);
      console.log('   Created:', admin.created_at);
      console.log('   Password Hash:', admin.password_hash ? '[SET]' : '[NOT SET]');
    } else {
      console.log('❌ Admin user does not exist in database');
      console.log('📝 User needs to be created');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkAdmin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});