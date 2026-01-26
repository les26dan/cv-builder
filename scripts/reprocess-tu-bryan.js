#!/usr/bin/env node

/**
 * Re-process Tu Bryan's CV with updated ChatGPT prompts
 * This will test the new improvements (expanded bullets, anti-hallucination, 6000 tokens)
 */

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SAMPLE_CVS_DIR = 'Workflow Files/Materials/Documents/Sample CVs';

/**
 * Process Tu Bryan's CV through the upload API
 */
async function reprocessTuBryan() {
  console.log('🚀 Re-processing Tu Bryan CV with updated prompts...\n');
  
  try {
    const fileName = 'Tu_Bryan_CV_TechPM (1).pdf';
    const filePath = path.join(SAMPLE_CVS_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ CV file not found: ${filePath}`);
      return;
    }
    
    console.log('📄 Processing CV file:', fileName);
    console.log('🔄 Using updated prompts with:');
    console.log('  ✅ Unlimited bullet points (removed 4-bullet limit)');
    console.log('  ✅ Anti-hallucination measures ("ONLY EXTRACT")');
    console.log('  ✅ 6000 token limit (doubled from 3000)');
    console.log('  ✅ Explicit preservation of responsibilities & achievements');
    console.log('');
    
    // Read the CV file
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`📄 File read: ${fileBuffer.length} bytes`);
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });
    
    // Make request to our upload API
    console.log(`📤 Uploading to ${SERVER_URL}/api/upload/cv-blob`);
    
    const response = await fetch(`${SERVER_URL}/api/upload/cv-blob`, {
      method: 'POST',
      body: formData,
      headers: {
        // Add a mock user session for authentication
        'Cookie': 'user_session=' + JSON.stringify({
          id: 'test-user-reprocess',
          email: 'test-reprocess@example.com',
          firstName: 'Test',
          lastName: 'User'
        })
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ API Response received');
    
    // Check if processing was successful
    if (!result.success) {
      console.error('❌ CV processing failed:', result.error);
      return;
    }
    
    const jsonData = result.llmParsedData;
    
    console.log('📊 Possibility Score:', jsonData.possibility_score);
    console.log('👤 Contact Name:', jsonData.contact?.full_name);
    console.log('💼 Work Experience Entries:', jsonData.work_experience?.length || 0);
    
    // Log work experience details to verify improvements
    if (jsonData.work_experience) {
      console.log('\n📋 Work Experience Details:');
      jsonData.work_experience.forEach((exp, index) => {
        console.log(`\n  ${index + 1}. ${exp.position} at ${exp.company}`);
        console.log(`     Duration: ${exp.start_date} - ${exp.end_date}`);
        console.log(`     Bullets: ${exp.bullets?.length || 0} items`);
        if (exp.bullets) {
          exp.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.trim()) {
              console.log(`       ${bulletIndex + 1}. ${bullet}`);
            }
          });
        }
      });
    }
    
    // Update the test site with new data
    updateTestSite(jsonData);
    
    // Save the new JSON response for reference
    const jsonPath = 'scripts/cv-responses/Tu_Bryan_CV_TechPM_Updated.json';
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`\n💾 Saved updated JSON: ${jsonPath}`);
    
    console.log('\n🎉 Re-processing complete!');
    console.log('🌐 Updated test site: http://localhost:3000/cv-uploaded-test/tu-bryan');
    
  } catch (error) {
    console.error('❌ Error during re-processing:', error);
  }
}

/**
 * Update the Tu Bryan test site with new data
 */
function updateTestSite(jsonData) {
  console.log('\n📝 Updating Tu Bryan test site...');
  
  const siteDir = 'app/cv-uploaded-test/tu-bryan';
  const pagePath = path.join(siteDir, 'page.tsx');
  
  if (!fs.existsSync(pagePath)) {
    console.error(`❌ Test site not found: ${pagePath}`);
    return;
  }
  
  // Read current page content
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Replace the testLLMData with new data
  const placeholderPattern = /const testLLMData = \{[\s\S]*?\};/;
  const replacement = `const testLLMData = ${JSON.stringify(jsonData, null, 4)};`;
  
  pageContent = pageContent.replace(placeholderPattern, replacement);
  
  // Write updated content
  fs.writeFileSync(pagePath, pageContent);
  console.log('✅ Updated test site successfully');
}

// Run the script
if (require.main === module) {
  reprocessTuBryan().catch(console.error);
}

module.exports = { reprocessTuBryan, updateTestSite };