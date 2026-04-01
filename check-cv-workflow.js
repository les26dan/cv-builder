#!/usr/bin/env node
/**
 * Check cv_workflow table: existence, row count, and sample.
 * Run: node check-cv-workflow.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkCvWorkflow() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !key) {
    console.error('❌ Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key);
  console.log('🔍 Checking cv_workflow table...\n');

  const { data, error } = await supabase
    .from('cv_workflow')
    .select('id, user_id, title, status, created_at, analysis_results')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ cv_workflow error:', error.code || error.message || error);
    console.log('   Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log(`✅ cv_workflow table exists. Rows in this page: ${data.length}`);
  if (data.length === 0) {
    console.log('\n   Table is empty — no CV workflow rows. JD analysis will return "No analysis found" until you create/save a CV.');
    return;
  }
  data.forEach((row, i) => {
    const hasAnalysis = row.analysis_results != null;
    console.log(`   ${i + 1}. id=${row.id} title="${row.title}" status=${row.status} analysis=${hasAnalysis ? 'yes' : 'no'}`);
  });
}

checkCvWorkflow();
