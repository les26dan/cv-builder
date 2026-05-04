require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function createTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📋 Creating CV tables in Supabase...\n');

  // Read the SQL file
  const sql = fs.readFileSync('create-cv-tables.sql', 'utf8');

  // Split into individual statements (removing comments and empty lines)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comment-only lines
    if (statement.trim().startsWith('--')) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: statement
    });

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('  Trying alternative method...');

      // For CREATE TABLE statements
      if (statement.includes('CREATE TABLE')) {
        console.log('  ⚠️  Please run this manually in Supabase SQL Editor');
        console.log('  Statement:', statement.substring(0, 100) + '...');
        continue;
      }
    }
  }

  console.log('\n✨ Checking if tables exist...\n');

  // Verify tables were created
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['cv_drafts', 'cv_workflow']);

  if (tablesError) {
    console.log('⚠️  Cannot verify with query, checking directly...\n');

    // Try to query the tables directly
    const { error: cvWorkflowError } = await supabase
      .from('cv_workflow')
      .select('id')
      .limit(1);

    const { error: cvDraftsError } = await supabase
      .from('cv_drafts')
      .select('id')
      .limit(1);

    if (!cvWorkflowError) {
      console.log('✅ cv_workflow table exists');
    } else {
      console.log('❌ cv_workflow table not found:', cvWorkflowError.message);
    }

    if (!cvDraftsError) {
      console.log('✅ cv_drafts table exists');
    } else {
      console.log('❌ cv_drafts table not found:', cvDraftsError.message);
    }
  } else {
    console.log('Found tables:', tables);
  }

  console.log('\n📌 IMPORTANT: If tables were not created automatically,');
  console.log('please run the SQL manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/avwxdoblngwwmxrcrpnk/sql\n');
  console.log('Make sure EXPLAIN mode is OFF (toggle in the editor)');
  console.log('Then paste the contents of create-cv-tables.sql and click Run\n');
}

createTables();
