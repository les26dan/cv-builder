require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔍 Checking database tables...\n');
  
  // Check if cv_workflow table exists
  const { data, error } = await supabase
    .from('cv_workflow')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ cv_workflow table error:', error);
    console.log('\n📋 Checking what tables exist...');
    
    // Try to get list of tables
    const { data: tables, error: tablesError } = await supabase.rpc('pg_tables');
    console.log('Tables query result:', tables, tablesError);
  } else {
    console.log('✅ cv_workflow table exists');
    console.log('Sample data:', data);
  }
  
  // Check cv_drafts table
  const { data: draftsData, error: draftsError } = await supabase
    .from('cv_drafts')
    .select('*')
    .limit(1);
  
  if (draftsError) {
    console.error('❌ cv_drafts table error:', draftsError);
  } else {
    console.log('✅ cv_drafts table exists');
  }
}

checkTables();
