#!/usr/bin/env node

/**
 * Fix Test Page UUIDs for Supabase Integration
 * Replace dynamic test IDs with fixed real UUIDs
 */

const fs = require('fs');
const path = require('path');

// UUID mapping from the previous script run
const UUID_MAP = {
  'ho-nguyen-hai-nam': '8cb9891e-5f8b-4d18-bd16-1abafd5374d6',
  'kien-vu': '8a02e160-06df-4162-9ba5-25754fa075df', 
  'manroe': 'd717dbc1-32c8-4d00-9fd3-e89587f9f214',
  'marie-quyen-guilhem': 'bc6d418c-df46-4141-a42b-bf4597ddddaa',
  'nguyen-tuan-anh': 'd98457c8-6ade-42e6-97eb-2fef32debfb3',
  'tu-bryan': 'd3578d4f-38ea-4627-8e44-feb70c84a32c'
};

function fixTestPageUUID(testName, uuid) {
  const pagePath = path.join(__dirname, '..', 'app', 'cv-uploaded-test', testName, 'page.tsx');
  
  try {
    if (!fs.existsSync(pagePath)) {
      console.log(`⚠️  Page not found: ${testName}`);
      return false;
    }
    
    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Replace dynamic test ID generation
    const dynamicPattern = new RegExp(`const cvId = 'test-${testName}-' \\+ Date\\.now\\(\\);`, 'g');
    const replacement = `const cvId = '${uuid}'; // Real UUID for Supabase integration`;
    
    if (content.match(dynamicPattern)) {
      content = content.replace(dynamicPattern, replacement);
      fs.writeFileSync(pagePath, content);
      console.log(`✅ Fixed dynamic UUID in ${testName} -> ${uuid}`);
      return true;
    }
    
    // Also replace any existing test-* patterns
    const staticPattern = new RegExp(`test-${testName}-\\d+`, 'g');
    if (content.match(staticPattern)) {
      content = content.replace(staticPattern, uuid);
      fs.writeFileSync(pagePath, content);
      console.log(`✅ Fixed static UUID in ${testName} -> ${uuid}`);
      return true;
    }
    
    console.log(`✅ ${testName} already has correct UUID`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error fixing ${testName}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 FIXING TEST PAGE UUIDs FOR SUPABASE INTEGRATION');
  console.log('='.repeat(50));
  console.log('');
  
  let success = 0;
  let failed = 0;
  
  for (const [testName, uuid] of Object.entries(UUID_MAP)) {
    if (fixTestPageUUID(testName, uuid)) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log('');
  console.log('📋 SUMMARY:');
  console.log(`✅ Successfully fixed: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('');
    console.log('🚀 ALL TEST PAGES NOW USE REAL UUIDs FOR SUPABASE!');
    console.log('');
    console.log('🎯 Test page URLs:');
    Object.entries(UUID_MAP).forEach(([testName, uuid]) => {
      console.log(`  http://localhost:3000/cv-uploaded-test/${testName}/ -> ${uuid}`);
    });
  }
}

main();