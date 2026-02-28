#!/usr/bin/env node

/**
 * Create Real CV Records in Supabase for Test Pages (Fixed Version)
 * For soft launch preparation - all test pages must use real database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin user ID (created during login)
const ADMIN_USER_ID = 'b5787d9c-6cf7-422e-bce9-66cd284ec036';

// Test CV mapping with corrected file names
const TEST_CVS = [
  {
    name: 'ho-nguyen-hai-nam',
    title: 'Resume_HoNguyenHaiNam',
    responseFile: 'Resume_HoNguyenHaiNam.json'
  },
  {
    name: 'kien-vu', 
    title: 'Kien Vu Sr. Product Manager',
    responseFile: 'Kien Vu Sr. Product Manager (Jan 2025).json'
  },
  {
    name: 'manroe',
    title: 'Manroetran_CV_2023',
    responseFile: 'Manroetran(CV)2023 (2).json'
  },
  {
    name: 'marie-quyen-guilhem',
    title: 'Marie Quyen Guilhem CV',
    responseFile: 'Marie Quyen Guilhem CV (1).json'
  },
  {
    name: 'nguyen-tuan-anh',
    title: 'Nguyen Tuan Anh CV',
    responseFile: 'Nguyen Tuan Anh\'s CV (1).json'
  },
  {
    name: 'tu-bryan',
    title: 'Tu Bryan CV TechPM',
    responseFile: 'Tu_Bryan_CV_TechPM (1).json'
  }
];

function extractPossibilityScore(llmData) {
  if (!llmData?.possibility_score) return 10;
  
  const score = llmData.possibility_score;
  // Handle array format [10] or direct number 10
  if (Array.isArray(score)) {
    return score[0] || 10;
  }
  return typeof score === 'number' ? score : 10;
}

async function createTestCVRecord(testCV) {
  try {
    console.log(`🔄 Processing ${testCV.name}...`);
    
    // Use the generated UUID from previous run
    const uuidMap = {
      'ho-nguyen-hai-nam': '8cb9891e-5f8b-4d18-bd16-1abafd5374d6',
      'kien-vu': '8a02e160-06df-4162-9ba5-25754fa075df',
      'manroe': 'd717dbc1-32c8-4d00-9fd3-e89587f9f214',
      'marie-quyen-guilhem': 'bc6d418c-df46-4141-a42b-bf4597ddddaa',
      'nguyen-tuan-anh': 'd98457c8-6ade-42e6-97eb-2fef32debfb3',
      'tu-bryan': 'd3578d4f-38ea-4627-8e44-feb70c84a32c'
    };
    
    const cvId = uuidMap[testCV.name];
    
    // Load ChatGPT response data
    const responsePath = path.join(__dirname, 'cv-responses', testCV.responseFile);
    let llmData = null;
    
    if (fs.existsSync(responsePath)) {
      const responseContent = fs.readFileSync(responsePath, 'utf8');
      llmData = JSON.parse(responseContent);
      console.log(`  ✅ Loaded ChatGPT data from ${testCV.responseFile}`);
    } else {
      console.log(`  ⚠️  No response file found: ${testCV.responseFile}`);
    }
    
    // Create CV workflow record (skip cvs table for now)
    const workflowRecord = {
      id: cvId,
      user_id: ADMIN_USER_ID,
      title: testCV.title,
      status: 'completed',
      score: extractPossibilityScore(llmData), // Fixed: extract score properly
      workflow_current_step: 'analysis',
      workflow_steps_completed: ['upload', 'parsing', 'structuring'],
      cv_data: llmData || {
        possibility_score: 10,
        contact: { full_name: testCV.title },
        summary: 'Test CV data',
        work_experience: [],
        education: [],
        skills: []
      },
      uploaded_file_name: `${testCV.title}.pdf`,
      uploaded_file_size: 200000,
      uploaded_file_type: 'application/pdf',
      uploaded_file_text: llmData ? JSON.stringify(llmData).substring(0, 1000) + '...' : 'Test extracted text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('cv_workflow')
      .select('id')
      .eq('id', cvId)
      .single();
    
    if (existingRecord) {
      console.log(`  ✅ Record already exists: ${cvId}`);
      return { success: true, cvId, testCV, action: 'exists' };
    }
    
    // Insert into cv_workflow table using service role permissions
    const { data: workflowData, error: workflowError } = await supabase
      .from('cv_workflow')
      .insert(workflowRecord)
      .select()
      .single();
      
    if (workflowError) {
      console.log(`  ❌ Workflow insert failed: ${workflowError.message}`);
      return { success: false, error: workflowError.message, testCV };
    } else {
      console.log(`  ✅ Workflow record created: ${cvId}`);
      return { success: true, cvId, testCV, action: 'created' };
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing ${testCV.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      testCV
    };
  }
}

async function main() {
  console.log('🚀 CREATING REAL SUPABASE RECORDS FOR TEST CVS (FIXED)');
  console.log('='.repeat(55));
  console.log('');
  
  console.log('📊 Configuration:');
  console.log(`  Supabase URL: ${supabaseUrl}`);
  console.log(`  Admin User ID: ${ADMIN_USER_ID}`);
  console.log(`  Test CVs to process: ${TEST_CVS.length}`);
  console.log('');
  
  // Test database connection first
  console.log('🔍 Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('cv_workflow')
    .select('count(*)')
    .single();
    
  if (testError) {
    console.error('❌ Database connection failed:', testError.message);
    console.log('');
    console.log('📋 Required actions:');
    console.log('1. Run the schema update script in Supabase SQL Editor:');
    console.log('   scripts/update-supabase-schema.sql');
    console.log('2. Ensure RLS policies allow admin access');
    return;
  }
  
  console.log('✅ Database connection successful');
  console.log('');
  
  const results = [];
  
  // Process each test CV
  for (const testCV of TEST_CVS) {
    const result = await createTestCVRecord(testCV);
    results.push(result);
    console.log('');
  }
  
  // Summary
  console.log('📋 SUMMARY:');
  console.log('='.repeat(30));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const created = results.filter(r => r.success && r.action === 'created');
  const existing = results.filter(r => r.success && r.action === 'exists');
  
  console.log(`✅ Successfully processed: ${successful.length}`);
  console.log(`  📝 Created new: ${created.length}`);
  console.log(`  📋 Already existed: ${existing.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('');
    console.log('🎯 CV IDs in database:');
    successful.forEach(r => {
      const status = r.action === 'created' ? '(NEW)' : '(EXISTS)';
      console.log(`  ${r.testCV.name}: ${r.cvId} ${status}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ Failed CVs:');
    failed.forEach(r => {
      console.log(`  ${r.testCV.name}: ${r.error}`);
    });
  }
  
  console.log('');
  if (failed.length === 0) {
    console.log('🚀 ALL TEST PAGES NOW READY FOR SOFT LAUNCH WITH REAL SUPABASE!');
    console.log('✅ Next step: Test the pages to ensure they load from database');
  } else {
    console.log('⚠️  Some records failed - please run the schema update script first');
  }
}

main().catch(console.error);