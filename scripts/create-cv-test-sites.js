#!/usr/bin/env node

/**
 * Simple script to create test sites for all CV samples
 * Uses pre-processed JSON data for each CV
 */

const fs = require('fs');
const path = require('path');

// CV samples to process (excluding Manroe which is already done)
const cvSamples = [
  { 
    file: 'Resume_HoNguyenHaiNam.pdf',
    name: 'ho-nguyen-hai-nam',
    displayName: 'Ho Nguyen Hai Nam',
    // Pre-processed JSON data (will be filled manually)
    jsonData: null
  },
  { 
    file: 'Nguyen Tuan Anh\'s CV (1).pdf',
    name: 'nguyen-tuan-anh', 
    displayName: 'Nguyen Tuan Anh',
    jsonData: null
  },
  { 
    file: 'Marie Quyen Guilhem CV (1).pdf',
    name: 'marie-quyen-guilhem',
    displayName: 'Marie Quyen Guilhem',
    jsonData: null
  },
  { 
    file: 'Tu_Bryan_CV_TechPM (1).pdf',
    name: 'tu-bryan',
    displayName: 'Tu Bryan',
    jsonData: null
  },
  { 
    file: 'Kien Vu Sr. Product Manager (Jan 2025).pdf',
    name: 'kien-vu',
    displayName: 'Kien Vu',
    jsonData: null
  }
];

/**
 * Create test site page for a CV
 */
function createTestSite(sample, jsonData) {
  console.log(`📝 Creating test site for: ${sample.displayName}`);
  
  // Create directory
  const siteDir = `app/cv-uploaded-test/${sample.name}`;
  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }
  
  // Generate page.tsx content
  const componentName = sample.name.replace(/-/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const pageContent = `'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponent${componentName}() {
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
  const testLLMData = ${JSON.stringify(jsonData, null, 4)};

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

        <div className="mt-6 text-center">
          <a 
            href="/cv-uploaded-test/manroe" 
            className="text-blue-600 text-sm hover:underline"
          >
            Switch to Manroe Test
          </a>
        </div>
      </div>
    </div>
  );
}

// Use dynamic import to prevent SSR issues
const CVUploadTestComponent = dynamic(
  () => Promise.resolve(CVUploadTestComponent${componentName}),
  { ssr: false }
);

export default CVUploadTestComponent;`;

  // Write the page.tsx file
  const pagePath = path.join(siteDir, 'page.tsx');
  fs.writeFileSync(pagePath, pageContent);
  
  console.log(`✅ Created test site: /cv-uploaded-test/${sample.name}`);
}

/**
 * Create index page that lists all test sites
 */
function createIndexPage() {
  console.log('📝 Creating index page for all test sites...');
  
  const indexContent = `'use client';

import Link from 'next/link';

export default function CVTestSitesIndex() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            CV Upload Test Sites
          </h1>
          <p className="text-gray-600">
            Pre-loaded CV test data for rapid testing without ChatGPT API calls
          </p>
        </div>

        <div className="grid gap-4">
          <Link 
            href="/cv-uploaded-test/manroe"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Manroe Tran</h3>
            <p className="text-sm text-gray-600">Product Manager at MoMo (Original test CV)</p>
          </Link>

          ${cvSamples.map(sample => `
          <Link 
            href="/cv-uploaded-test/${sample.name}"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">${sample.displayName}</h3>
            <p className="text-sm text-gray-600">CV: ${sample.file}</p>
          </Link>`).join('')}
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/cv-upload"
            className="inline-block py-2 px-6 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to CV Upload
          </Link>
        </div>
      </div>
    </div>
  );
}`;

  // Create the index page
  const indexPath = 'app/cv-uploaded-test/page.tsx';
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Created index page: /cv-uploaded-test');
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Creating CV test sites...\n');
  
  // For now, create placeholder sites with empty JSON data
  // The JSON data will be added manually for each CV
  const placeholderData = {
    "possibility_score": 8,
    "contact": {
      "full_name": "Sample Name",
      "address": "Sample Address",
      "email": "sample@email.com",
      "phone": "+1234567890",
      "linkedin": "linkedin.com/in/sample"
    },
    "summary": "Sample professional summary...",
    "work_experience": [
      {
        "position": "Sample Position",
        "company": "Sample Company",
        "location": "Sample Location",
        "start_date": "Jan 2020",
        "end_date": "Present",
        "bullets": ["Sample achievement 1", "Sample achievement 2"]
      }
    ],
    "education": [
      {
        "degree": "Sample Degree",
        "institution": "Sample University",
        "start_date": "2016",
        "end_date": "2020",
        "details": "Sample details"
      }
    ],
    "skills": ["Sample Skill 1", "Sample Skill 2", "Sample Skill 3"]
  };
  
  // Create test sites for each CV sample
  cvSamples.forEach(sample => {
    createTestSite(sample, placeholderData);
  });
  
  // Create index page
  createIndexPage();
  
  console.log(`\n✅ Test sites created for ${cvSamples.length} CVs!`);
  console.log('\n🌐 Available test sites:');
  console.log('  - http://localhost:3000/cv-uploaded-test/ (index)');
  console.log('  - http://localhost:3000/cv-uploaded-test/manroe (original)');
  cvSamples.forEach(sample => {
    console.log(`  - http://localhost:3000/cv-uploaded-test/${sample.name}`);
  });
  
  console.log('\n📝 Next steps:');
  console.log('1. Process each CV through ChatGPT API manually');
  console.log('2. Replace placeholder JSON data with actual ChatGPT responses');
  console.log('3. Test each site to ensure proper data flow');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cvSamples, createTestSite, createIndexPage };