require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkCVData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking CV database tables...\n');

  // Check cv_workflow table
  console.log('=== CV WORKFLOW TABLE ===');
  const { data: cvWorkflowData, error: cvWorkflowError } = await supabase
    .from('cv_workflow')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (cvWorkflowError) {
    console.error('❌ Error querying cv_workflow:', cvWorkflowError);
  } else {
    console.log(`✅ Found ${cvWorkflowData.length} records in cv_workflow table`);
    if (cvWorkflowData.length > 0) {
      cvWorkflowData.forEach((row, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  User ID: ${row.user_id}`);
        console.log(`  Title: ${row.title}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Score: ${row.score}`);
        console.log(`  Has analysis_results: ${row.analysis_results ? 'Yes' : 'No'}`);
        console.log(`  Has cv_data: ${row.cv_data ? 'Yes' : 'No'}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Updated: ${row.updated_at}`);
      });
    } else {
      console.log('  (Empty - no CV records found)');
    }
  }

  // Check cv_drafts table
  console.log('\n\n=== CV DRAFTS TABLE ===');
  const { data: cvDraftsData, error: cvDraftsError } = await supabase
    .from('cv_drafts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (cvDraftsError) {
    console.error('❌ Error querying cv_drafts:', cvDraftsError);
  } else {
    console.log(`✅ Found ${cvDraftsData.length} records in cv_drafts table`);
    if (cvDraftsData.length > 0) {
      cvDraftsData.forEach((row, idx) => {
        console.log(`\nDraft ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  User ID: ${row.user_id}`);
        console.log(`  File name: ${row.file_name}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Score: ${row.score}`);
        console.log(`  Created: ${row.created_at}`);
      });
    } else {
      console.log('  (Empty - no draft records found)');
    }
  }

  // Check for specific user
  console.log('\n\n=== YOUR USER DATA ===');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email', 'les72dan@gmail.com')
    .single();

  if (userError) {
    console.error('❌ Error finding user:', userError);
  } else if (userData) {
    console.log(`✅ User found:`);
    console.log(`  ID: ${userData.id}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Name: ${userData.full_name}`);

    // Check if this user has any CVs
    const { data: userCVs, error: userCVsError } = await supabase
      .from('cv_workflow')
      .select('*')
      .eq('user_id', userData.id);

    if (userCVsError) {
      console.error('❌ Error checking user CVs:', userCVsError);
    } else {
      console.log(`\n  This user has ${userCVs.length} CV(s) in the database`);
      if (userCVs.length === 0) {
        console.log('  👉 No CVs found - database is empty for this user');
      }
    }
  }

  console.log('\n✨ Check complete!\n');
}

checkCVData();
