#!/usr/bin/env node

/**
 * CV-User ID Relationship Audit Script
 * Ensures every CV has unique ID and proper user linkage for production
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditCVUserRelationships() {
  console.log('🔍 CV-USER ID RELATIONSHIP AUDIT');
  console.log('='.repeat(40));
  console.log('');
  
  console.log('📊 Checking current data structure...');
  
  try {
    // Check cv_workflow table structure and data
    const { data: workflows, error: workflowError } = await supabase
      .from('cv_workflow')
      .select('id, user_id, title, created_at')
      .order('created_at', { ascending: false });
    
    if (workflowError) {
      console.log('⚠️  Database query failed:', workflowError.message);
      console.log('');
      console.log('📋 This might indicate:');
      console.log('1. Missing Supabase schema setup');
      console.log('2. RLS policies blocking access');
      console.log('3. Invalid credentials');
      return;
    }
    
    console.log(`✅ Found ${workflows?.length || 0} CV records in database`);
    console.log('');
    
    if (workflows && workflows.length > 0) {
      console.log('📋 Current CV-User Relationships:');
      console.log('-'.repeat(80));
      console.log('CV ID'.padEnd(40) + 'User ID'.padEnd(40) + 'Title');
      console.log('-'.repeat(80));
      
      const userGroups = {};
      const duplicateIDs = {};
      
      workflows.forEach(cv => {
        console.log(`${cv.id}`.padEnd(40) + `${cv.user_id}`.padEnd(40) + `${cv.title}`);
        
        // Group by user ID
        if (!userGroups[cv.user_id]) {
          userGroups[cv.user_id] = [];
        }
        userGroups[cv.user_id].push(cv);
        
        // Check for duplicate CV IDs
        if (duplicateIDs[cv.id]) {
          duplicateIDs[cv.id].push(cv);
        } else {
          duplicateIDs[cv.id] = [cv];
        }
      });
      
      console.log('');
      console.log('📊 Summary by User:');
      Object.entries(userGroups).forEach(([userId, cvs]) => {
        console.log(`👤 User ${userId}: ${cvs.length} CVs`);
        cvs.forEach(cv => {
          console.log(`  📄 ${cv.id} - "${cv.title}"`);
        });
      });
      
      console.log('');
      console.log('🔍 Data Integrity Check:');
      
      // Check for duplicate CV IDs
      const duplicates = Object.entries(duplicateIDs).filter(([id, cvs]) => cvs.length > 1);
      if (duplicates.length > 0) {
        console.log('❌ DUPLICATE CV IDs FOUND:');
        duplicates.forEach(([id, cvs]) => {
          console.log(`  🚨 CV ID ${id} appears ${cvs.length} times`);
        });
      } else {
        console.log('✅ No duplicate CV IDs found');
      }
      
      // Check for orphaned CVs (no user_id)
      const orphaned = workflows.filter(cv => !cv.user_id);
      if (orphaned.length > 0) {
        console.log('❌ ORPHANED CVs FOUND (no user_id):');
        orphaned.forEach(cv => {
          console.log(`  🚨 CV ID ${cv.id} - "${cv.title}"`);
        });
      } else {
        console.log('✅ All CVs have valid user_id');
      }
      
      // Check UUID format validity
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidCVIDs = workflows.filter(cv => !uuidRegex.test(cv.id));
      const invalidUserIDs = workflows.filter(cv => !uuidRegex.test(cv.user_id));
      
      if (invalidCVIDs.length > 0) {
        console.log('❌ INVALID CV ID FORMATS:');
        invalidCVIDs.forEach(cv => {
          console.log(`  🚨 CV ID "${cv.id}" is not a valid UUID`);
        });
      } else {
        console.log('✅ All CV IDs are valid UUIDs');
      }
      
      if (invalidUserIDs.length > 0) {
        console.log('❌ INVALID USER ID FORMATS:');
        invalidUserIDs.forEach(cv => {
          console.log(`  🚨 User ID "${cv.user_id}" is not a valid UUID`);
        });
      } else {
        console.log('✅ All User IDs are valid UUIDs');
      }
      
    } else {
      console.log('📋 No CV records found in database');
    }
    
    console.log('');
    console.log('🔍 Checking localStorage data...');
    
    // Check localStorage patterns for test data
    console.log('📋 Test page CV IDs:');
    const testCVs = {
      'ho-nguyen-hai-nam': '8cb9891e-5f8b-4d18-bd16-1abafd5374d6',
      'kien-vu': '8a02e160-06df-4162-9ba5-25754fa075df',
      'manroe': 'd717dbc1-32c8-4d00-9fd3-e89587f9f214',
      'marie-quyen-guilhem': 'bc6d418c-df46-4141-a42b-bf4597ddddaa',
      'nguyen-tuan-anh': 'd98457c8-6ade-42e6-97eb-2fef32debfb3',
      'tu-bryan': 'd3578d4f-38ea-4627-8e44-feb70c84a32c'
    };
    
    Object.entries(testCVs).forEach(([name, id]) => {
      console.log(`  📄 ${name}: ${id}`);
    });
    
    console.log('');
    console.log('🎯 AUDIT RECOMMENDATIONS:');
    
    const issues = [];
    
    if (!workflows || workflows.length === 0) {
      issues.push('No CVs in database - run schema setup and data creation');
    }
    
    if (duplicates && duplicates.length > 0) {
      issues.push('Duplicate CV IDs found - need cleanup');
    }
    
    if (orphaned && orphaned.length > 0) {
      issues.push('Orphaned CVs found - need user assignment');
    }
    
    if (invalidCVIDs && invalidCVIDs.length > 0) {
      issues.push('Invalid CV ID formats - need UUID conversion');
    }
    
    if (invalidUserIDs && invalidUserIDs.length > 0) {
      issues.push('Invalid User ID formats - need UUID conversion');
    }
    
    if (issues.length === 0) {
      console.log('✅ All CV-User relationships are properly configured!');
      console.log('🚀 Database is ready for production launch');
    } else {
      console.log('⚠️  Issues found that need attention:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
}

async function checkCurrentUploadLogic() {
  console.log('');
  console.log('🔍 UPLOAD LOGIC ANALYSIS');
  console.log('='.repeat(30));
  
  try {
    // Read the upload route to verify ID generation
    const uploadRoutePath = path.join(__dirname, '..', 'app', 'api', 'upload', 'cv-blob', 'route.ts');
    const uploadContent = fs.readFileSync(uploadRoutePath, 'utf8');
    
    console.log('✅ Upload route analysis:');
    
    // Check CV ID generation
    if (uploadContent.includes('crypto.randomUUID()')) {
      console.log('  ✅ CV ID: Uses crypto.randomUUID() - CORRECT');
    } else {
      console.log('  ❌ CV ID: Not using crypto.randomUUID()');
    }
    
    // Check user ID usage
    if (uploadContent.includes('user_id: userId')) {
      console.log('  ✅ User ID: Properly linked to CV records - CORRECT');
    } else {
      console.log('  ❌ User ID: Not properly linked');
    }
    
    // Check database insertion
    if (uploadContent.includes('cv_workflow') && uploadContent.includes('insert')) {
      console.log('  ✅ Database: Inserts to cv_workflow table - CORRECT');
    } else {
      console.log('  ❌ Database: Missing cv_workflow insertion');
    }
    
  } catch (error) {
    console.log('⚠️  Could not analyze upload logic:', error.message);
  }
}

async function main() {
  await auditCVUserRelationships();
  await checkCurrentUploadLogic();
  
  console.log('');
  console.log('🎯 PRODUCTION READINESS CHECKLIST:');
  console.log('□ Each CV has unique UUID');
  console.log('□ Each CV properly links to user_id');
  console.log('□ No duplicate CV IDs');
  console.log('□ No orphaned CVs');
  console.log('□ Upload logic generates proper UUIDs');
  console.log('□ Database schema supports relationships');
  console.log('');
  console.log('Run this audit regularly to ensure data integrity!');
}

main().catch(console.error);