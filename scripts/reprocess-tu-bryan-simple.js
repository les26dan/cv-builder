#!/usr/bin/env node

/**
 * Simple re-processing of Tu Bryan's CV
 * Uses direct API call with extended timeout
 */

const fs = require('fs');
const path = require('path');

async function reprocessTuBryan() {
  console.log('🚀 Re-processing Tu Bryan CV with updated prompts...\n');
  
  try {
    // Manual processing using node-fetch with timeout
    const { default: fetch } = await import('node-fetch');
    const FormData = require('form-data');
    
    const fileName = 'Tu_Bryan_CV_TechPM (1).pdf';
    const filePath = path.join('Workflow Files/Materials/Documents/Sample CVs', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ CV file not found: ${filePath}`);
      return;
    }
    
    console.log('📄 Processing CV file:', fileName);
    console.log('🔄 Using updated prompts with 6000 token limit and unlimited bullets\n');
    
    // Read the CV file
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`📄 File read: ${fileBuffer.length} bytes`);
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });
    
    // Extended timeout request (5 minutes)
    console.log(`📤 Uploading to server with 5-minute timeout...`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes
    
    const response = await fetch('http://localhost:3000/api/upload/cv-blob', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Cookie': 'user_session=' + JSON.stringify({
          id: 'test-user-reprocess-' + Date.now(),
          email: 'test-reprocess@example.com',
          firstName: 'Test',
          lastName: 'User'
        })
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ API Response received successfully!');
    
    if (!result.success) {
      console.error('❌ CV processing failed:', result.error);
      return;
    }
    
    const jsonData = result.llmParsedData;
    
    console.log('\n📊 Processing Results:');
    console.log('   Possibility Score:', jsonData.possibility_score);
    console.log('   Contact Name:', jsonData.contact?.full_name);
    console.log('   Work Experience Entries:', jsonData.work_experience?.length || 0);
    
    // Detailed work experience analysis
    if (jsonData.work_experience) {
      console.log('\n📋 Work Experience Details (BEFORE vs AFTER):');
      jsonData.work_experience.forEach((exp, index) => {
        console.log(`\n  ${index + 1}. ${exp.position} at ${exp.company}`);
        console.log(`     Duration: ${exp.start_date} - ${exp.end_date}`);
        console.log(`     Bullets: ${exp.bullets?.length || 0} items`);
        
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach((bullet, bulletIndex) => {
            if (bullet && bullet.trim()) {
              console.log(`       ${bulletIndex + 1}. ${bullet}`);
            }
          });
        } else {
          console.log('       ⚠️  NO BULLETS FOUND - This indicates an issue!');
        }
      });
    }
    
    // Update the test site
    updateTestSite(jsonData);
    
    // Save the new JSON for comparison
    const jsonPath = 'scripts/cv-responses/Tu_Bryan_CV_Updated_' + Date.now() + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`\n💾 Saved updated JSON: ${jsonPath}`);
    
    console.log('\n🎉 Re-processing complete!');
    console.log('🌐 View results: http://localhost:3000/cv-uploaded-test/tu-bryan');
    
    // Compare with old data
    console.log('\n🔍 COMPARISON SUMMARY:');
    console.log('OLD DATA: Only 1 bullet per job (truncated)');
    console.log(`NEW DATA: ${jsonData.work_experience?.reduce((total, exp) => total + (exp.bullets?.length || 0), 0) || 0} total bullets`);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out after 5 minutes');
    } else {
      console.error('❌ Error during re-processing:', error.message);
    }
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
  
  try {
    // Read current page content
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // Replace the testLLMData with new data
    const placeholderPattern = /const testLLMData = \{[\s\S]*?\};/;
    const replacement = `const testLLMData = ${JSON.stringify(jsonData, null, 4)};`;
    
    pageContent = pageContent.replace(placeholderPattern, replacement);
    
    // Write updated content
    fs.writeFileSync(pagePath, pageContent);
    console.log('✅ Test site updated successfully');
  } catch (error) {
    console.error('❌ Error updating test site:', error.message);
  }
}

// Run the script
if (require.main === module) {
  reprocessTuBryan().catch(console.error);
}