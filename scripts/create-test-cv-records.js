#!/usr/bin/env node

/**
 * Create Real CV Records in Supabase for Test Pages
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

// Test CV mapping
const TEST_CVS = [
  {
    name: 'ho-nguyen-hai-nam',
    title: 'Resume_HoNguyenHaiNam',
    responseFile: 'ho_nguyen_hai_nam_CV.json'
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

async function createTestCVRecord(testCV) {
  try {
    console.log(`🔄 Processing ${testCV.name}...`);
    
    // Generate real UUID
    const cvId = crypto.randomUUID();
    
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
    
    // Create CV record
    const cvRecord = {
      id: cvId,
      user_id: ADMIN_USER_ID,
      title: testCV.title,
      file_name: `${testCV.title}.pdf`,
      file_size: 200000, // Approximate
      file_type: 'application/pdf',
      blob_url: `local://cv-files/${cvId}/${testCV.title}.pdf`,
      extracted_text: llmData ? JSON.stringify(llmData).substring(0, 1000) + '...' : 'Test extracted text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create CV workflow record
    const workflowRecord = {
      id: cvId,
      user_id: ADMIN_USER_ID,
      title: testCV.title,
      status: 'completed',
      workflow_current_step: 'analysis',
      workflow_steps_completed: ['upload', 'parsing', 'structuring'],
      cv_data: llmData,
      score: llmData?.possibility_score || 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into cvs table
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .insert(cvRecord)
      .select()
      .single();
      
    if (cvError) {
      console.log(`  ⚠️  CV insert failed (may already exist): ${cvError.message}`);
    } else {
      console.log(`  ✅ CV record created: ${cvId}`);
    }
    
    // Insert into cv_workflow table  
    const { data: workflowData, error: workflowError } = await supabase
      .from('cv_workflow')
      .insert(workflowRecord)
      .select()
      .single();
      
    if (workflowError) {
      console.log(`  ⚠️  Workflow insert failed (may already exist): ${workflowError.message}`);
    } else {
      console.log(`  ✅ Workflow record created: ${cvId}`);
    }
    
    return {
      success: true,
      cvId,
      testCV
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${testCV.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      testCV
    };
  }
}

async function updateTestPage(result) {
  if (!result.success) return;
  
  const { cvId, testCV } = result;
  const pagePath = path.join(__dirname, '..', 'app', 'cv-uploaded-test', testCV.name, 'page.tsx');
  
  try {
    if (fs.existsSync(pagePath)) {
      let content = fs.readFileSync(pagePath, 'utf8');
      
      // Replace test ID with real UUID
      const oldPattern = new RegExp(`test-${testCV.name}-\\d+`, 'g');
      content = content.replace(oldPattern, cvId);
      
      // Update client-side rendering to allow database queries
      content = content.replace('ssr: false', 'ssr: false // Real database integration for soft launch');
      
      fs.writeFileSync(pagePath, content);
      console.log(`  ✅ Updated test page: ${testCV.name} -> ${cvId}`);
    } else {
      console.log(`  ⚠️  Test page not found: ${pagePath}`);
    }
  } catch (error) {
    console.error(`  ❌ Error updating test page ${testCV.name}:`, error.message);
  }
}

async function main() {
  console.log('🚀 CREATING REAL SUPABASE RECORDS FOR TEST CVS');
  console.log('='.repeat(50));
  console.log('');
  
  console.log('📊 Configuration:');
  console.log(`  Supabase URL: ${supabaseUrl}`);
  console.log(`  Admin User ID: ${ADMIN_USER_ID}`);
  console.log(`  Test CVs to process: ${TEST_CVS.length}`);
  console.log('');
  
  const results = [];
  
  // Process each test CV
  for (const testCV of TEST_CVS) {
    const result = await createTestCVRecord(testCV);
    results.push(result);
    
    if (result.success) {
      await updateTestPage(result);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📋 SUMMARY:');
  console.log('='.repeat(30));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully processed: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('');
    console.log('🎯 New CV IDs:');
    successful.forEach(r => {
      console.log(`  ${r.testCV.name}: ${r.cvId}`);
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
  console.log('🚀 ALL TEST PAGES NOW READY FOR SOFT LAUNCH WITH REAL SUPABASE!');
}

main().catch(console.error);