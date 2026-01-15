#!/usr/bin/env node

/**
 * Process a single CV file using our existing upload API
 * This simulates the normal CV upload flow to get ChatGPT parsed data
 */

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SAMPLE_CVS_DIR = 'Workflow Files/Materials/Documents/Sample CVs';

/**
 * Process CV file through our upload API
 */
async function processCVFile(fileName) {
  try {
    console.log(`🔄 Processing CV: ${fileName}`);
    
    // 1. Read the CV file
    const filePath = path.join(SAMPLE_CVS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`📄 File read: ${fileBuffer.length} bytes`);
    
    // 2. Create FormData for upload
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });
    
    // 3. Make request to our upload API
    console.log(`📤 Uploading to ${SERVER_URL}/api/upload/cv-blob`);
    
    const response = await fetch(`${SERVER_URL}/api/upload/cv-blob`, {
      method: 'POST',
      body: formData,
      headers: {
        // Add a mock user session for authentication
        'Cookie': 'user_session=' + JSON.stringify({
          id: 'test-user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ API Response received`);
    
    // 4. Extract the parsed data
    if (result.success && result.llmParsedData) {
      console.log(`🎯 ChatGPT Score: ${result.llmParsedData.possibility_score}/10`);
      console.log(`👤 Contact: ${result.llmParsedData.contact?.full_name || 'Not found'}`);
      console.log(`💼 Experience: ${result.llmParsedData.work_experience?.length || 0} jobs`);
      
      // 5. Save the JSON response
      const outputFileName = fileName.replace(/\.pdf$/i, '.json');
      const outputPath = `scripts/cv-responses/${outputFileName}`;
      fs.writeFileSync(outputPath, JSON.stringify(result.llmParsedData, null, 2));
      console.log(`💾 Saved parsed data to: ${outputPath}`);
      
      return result.llmParsedData;
    } else {
      console.error('❌ No parsed data in response:', result);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Update test site with real data
 */
function updateTestSite(cvName, displayName, fileName, jsonData) {
  console.log(`📝 Updating test site for: ${displayName}`);
  
  const componentName = cvName.replace(/-/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const siteDir = `app/cv-uploaded-test/${cvName}`;
  
  if (!fs.existsSync(siteDir)) {
    console.error(`❌ Test site directory not found: ${siteDir}`);
    return;
  }
  
  // Read current page content
  const pagePath = path.join(siteDir, 'page.tsx');
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Replace placeholder data with real data
  const placeholderPattern = /const testLLMData = \{[\s\S]*?\};/;
  const replacement = `const testLLMData = ${JSON.stringify(jsonData, null, 4)};`;
  
  pageContent = pageContent.replace(placeholderPattern, replacement);
  
  // Write updated content
  fs.writeFileSync(pagePath, pageContent);
  console.log(`✅ Updated test site: /cv-uploaded-test/${cvName}`);
}

/**
 * Main execution
 */
async function main() {
  const cvToProcess = {
    file: 'Resume_HoNguyenHaiNam.pdf',
    name: 'ho-nguyen-hai-nam',
    displayName: 'Ho Nguyen Hai Nam'
  };
  
  console.log('🚀 Processing single CV for testing...\n');
  
  // Process the CV
  const jsonData = await processCVFile(cvToProcess.file);
  
  if (jsonData) {
    // Update the test site with real data
    updateTestSite(cvToProcess.name, cvToProcess.displayName, cvToProcess.file, jsonData);
    
    console.log('\n✅ Processing complete!');
    console.log(`🌐 Test site: http://localhost:3000/cv-uploaded-test/${cvToProcess.name}`);
  } else {
    console.log('\n❌ Processing failed!');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processCVFile, updateTestSite };