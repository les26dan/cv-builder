#!/usr/bin/env node

/**
 * Script to process all sample CVs through ChatGPT API
 * and create test sites for each one
 */

const fs = require('fs');
const path = require('path');
const PDFService = require('../shared/services/pdfService');
const { createChatCompletion } = require('../shared/services/chatgptService');

// CV samples to process (excluding Manroe which is already done)
const cvSamples = [
  { 
    file: 'Resume_HoNguyenHaiNam.pdf',
    name: 'ho-nguyen-hai-nam',
    displayName: 'Ho Nguyen Hai Nam'
  },
  { 
    file: 'Nguyen Tuan Anh\'s CV (1).pdf',
    name: 'nguyen-tuan-anh', 
    displayName: 'Nguyen Tuan Anh'
  },
  { 
    file: 'Marie Quyen Guilhem CV (1).pdf',
    name: 'marie-quyen-guilhem',
    displayName: 'Marie Quyen Guilhem'
  },
  { 
    file: 'Tu_Bryan_CV_TechPM (1).pdf',
    name: 'tu-bryan',
    displayName: 'Tu Bryan'
  },
  { 
    file: 'Kien Vu Sr. Product Manager (Jan 2025).pdf',
    name: 'kien-vu',
    displayName: 'Kien Vu'
  }
];

const SAMPLE_CVS_DIR = 'Workflow Files/Materials/Documents/Sample CVs';

/**
 * Generate English CV parsing prompt following LLM specification
 */
function generatePrompt(cvText) {
  const system = `You are a top-tier expert in global recruitment, CV parsing, and structured data extraction, with over 15 years of experience. You accurately and quickly parse CV or resume documents provided by users. You NEVER fabricate, infer, or add any information that is not explicitly available in the provided document. Extracted data is structured exactly as requested. If certain data is not explicitly available, leave the corresponding fields empty ("") or as empty arrays ([]).`;

  const user = `Review the CV text below carefully. Then:

Step 1: Rate the likelihood (1-10) that the text is a CV or Resume.  
- (1 = definitely NOT a CV, 10 = definitely a CV).

Step 2: ONLY if your score is 5 or higher, extract and structure the CV information precisely into the following JSON format:

{
  "possibility_score": [score],
  "contact": {
    "full_name": "",
    "address": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "summary": "",
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["", "", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "start_date": "",
      "end_date": "",
      "details": ""
    }
  ],
  "skills": ["", "", "", ""]
}

Critical Requirements:
- Return ONLY valid JSON, no other text, explanation, or commentary.
- Do NOT add bullets if unclear; leave empty arrays instead.
- Do NOT create skills if not explicitly mentioned; use empty array instead.
- Use exact dates and terms from the document.
- If information is unclear or missing, use empty string ("") or empty array ([]).

CV Text:
${cvText}`;

  return { system, user };
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    console.log(`📄 Extracting text from: ${filePath}`);
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Use our existing PDF service (which uses PDF.js)
    const pdfService = new PDFService();
    const extractedText = await pdfService.extractText(pdfBuffer);
    
    console.log(`✅ Text extracted: ${extractedText.length} characters`);
    return extractedText;
    
  } catch (error) {
    console.error(`❌ Error extracting text from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Process single CV through ChatGPT API
 */
async function processSingleCV(sample) {
  try {
    console.log(`\n🔄 Processing CV: ${sample.displayName}`);
    
    // 1. Extract text from PDF
    const filePath = path.join(SAMPLE_CVS_DIR, sample.file);
    const cvText = await extractTextFromPDF(filePath);
    
    // 2. Generate prompt
    const { system, user } = generatePrompt(cvText);
    
    // 3. Call ChatGPT API
    console.log(`🤖 Sending to ChatGPT API...`);
    const response = await createChatCompletion([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);
    
    // 4. Parse response
    const jsonResponse = JSON.parse(response);
    console.log(`✅ ChatGPT Response received. Score: ${jsonResponse.possibility_score}`);
    
    // 5. Save JSON response for debugging
    const jsonPath = `scripts/cv-responses/${sample.name}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(jsonResponse, null, 2));
    console.log(`💾 Saved response to: ${jsonPath}`);
    
    return {
      sample,
      jsonResponse,
      cvText: cvText.substring(0, 500) + '...' // Truncated for storage
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${sample.displayName}:`, error);
    throw error;
  }
}

/**
 * Create test site page for a CV
 */
function createTestSite(processedCV) {
  const { sample, jsonResponse } = processedCV;
  
  console.log(`📝 Creating test site for: ${sample.displayName}`);
  
  // Create directory
  const siteDir = `app/cv-uploaded-test/${sample.name}`;
  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }
  
  // Generate page.tsx content
  const pageContent = `'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponent${sample.name.replace(/-/g, '')}() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Test data from ${sample.displayName} CV ChatGPT response
  const testLLMData = ${JSON.stringify(jsonResponse, null, 4)};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with ${sample.displayName} CV data');
    console.log('📁 Source: ${sample.file}');
    
    try {
      // Create test file metadata
      const testFile = {
        name: '${sample.file}',
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = 'test-${sample.name}-' + Date.now();
      
      console.log('🧪 TEST: Raw ChatGPT JSON data:', testLLMData);
      
      // Convert to guided editing format using cvParserService
      const { cvParserService } = await import('../../../shared/services/cvParserService');
      console.log('⚙️ TEST: Converting JSON using cvParserService.convertToGuidedEditingFormat()');
      
      const structuredCV = cvParserService.convertToGuidedEditingFormat(testLLMData);
      console.log('🧪 TEST: Structured CV after conversion:', structuredCV);
      
      // Store in localStorage for CV guided editing
      const uploadData = {
        cvId: cvId,
        file: testFile,
        extractedData: null,
        llmParsedData: testLLMData,
        structuredCV: structuredCV,
        blobUrl: null,
        timestamp: Date.now(),
        processed: true,
        validCV: testLLMData.possibility_score >= 5
      };
      
      // Store with specific key
      const storageKey = 'cv_upload_' + cvId;
      localStorage.setItem(storageKey, JSON.stringify(uploadData));
      localStorage.setItem('cv_upload_data', JSON.stringify(uploadData));
      
      console.log('🧪 TEST: Data stored in localStorage with keys:');
      console.log('  - cv_upload_data');
      console.log('  - ' + storageKey);
      
      setShowSuccess(true);
      
      // Wait a moment then navigate
      setTimeout(() => {
        console.log('🧪 TEST: Navigating to CV guided editing');
        console.log('🎯 TEST: Expected contact population:');
        console.log('  - Full Name: "' + structuredCV.contact?.fullName + '"');
        console.log('  - Email: "' + structuredCV.contact?.email + '"');
        console.log('  - Phone: "' + structuredCV.contact?.phone + '"');
        console.log('  - Location: "' + structuredCV.contact?.location + '"');
        console.log('  - LinkedIn: "' + structuredCV.contact?.linkedin + '"');
        
        router.push('/cv-guided-editing/' + cvId + '?source=test&parsed=success');
      }, 2000);
      
    } catch (error) {
      console.error('❌ TEST: Error during analysis:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            CV Upload Test - ${sample.displayName}
          </h1>
          <p className="text-gray-600 text-sm">
            Pre-loaded with ${sample.displayName}'s CV data for testing
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Possibility Score:</strong> {testLLMData.possibility_score}/10
            </p>
            <p className="text-sm text-blue-800">
              <strong>Contact:</strong> {testLLMData.contact?.full_name || 'Not found'}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Experience:</strong> {testLLMData.work_experience?.length || 0} jobs
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {!showSuccess ? (
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className={\`w-full py-3 px-4 rounded-lg font-medium transition-colors \${
                isAnalyzing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-600'
              }\`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing CV...
                </div>
              ) : (
                'Start Analysis'
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <div className="text-green-600 text-lg font-medium mb-2">✅ Analysis Complete!</div>
              <div className="text-sm text-gray-600">Redirecting to CV guided editing...</div>
            </div>
          )}
          
          <button
            onClick={() => router.push('/cv-upload')}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to CV Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// Use dynamic import to prevent SSR issues
const CVUploadTestComponent = dynamic(
  () => Promise.resolve(CVUploadTestComponent${sample.name.replace(/-/g, '')}),
  { ssr: false }
);

export default CVUploadTestComponent;`;

  // Write the page.tsx file
  const pagePath = path.join(siteDir, 'page.tsx');
  fs.writeFileSync(pagePath, pageContent);
  
  console.log(`✅ Created test site: /cv-uploaded-test/${sample.name}`);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting CV sample processing...\n');
  
  // Create output directory for JSON responses
  const responseDir = 'scripts/cv-responses';
  if (!fs.existsSync(responseDir)) {
    fs.mkdirSync(responseDir, { recursive: true });
  }
  
  const results = [];
  
  // Process each CV sample
  for (const sample of cvSamples) {
    try {
      const result = await processSingleCV(sample);
      results.push(result);
      
      // Create test site immediately after processing
      createTestSite(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to process ${sample.displayName}:`, error);
      // Continue with next CV even if one fails
    }
  }
  
  console.log(`\n✅ Processing complete! Processed ${results.length}/${cvSamples.length} CVs`);
  console.log('\n📋 Summary:');
  results.forEach(result => {
    console.log(`  - ${result.sample.displayName}: Score ${result.jsonResponse.possibility_score}/10`);
  });
  
  console.log('\n🌐 Test sites created at:');
  results.forEach(result => {
    console.log(`  - http://localhost:3000/cv-uploaded-test/${result.sample.name}`);
  });
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cvSamples, processSingleCV, createTestSite };