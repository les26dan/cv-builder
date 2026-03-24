'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponenttubryan() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Test data from Tu Bryan CV ChatGPT response
  const testLLMData = {
    "possibility_score": 10,
    "contact": {
        "full_name": "TU (BRYAN) LE",
        "address": "Ho Chi Minh, Vietnam",
        "email": "ledinhtu20@gmail.com",
        "phone": "(+84) (0) 83 94 777 28",
        "linkedin": "linkedin.com/in/ledinhtu/"
    },
    "summary": "Technical Product Manager with 5+ years of experience in the banking and fintech industries, specializing in SaaS platforms, API payment solutions, and B2C microservice products. Led API integrations with bank partners and experiences in supported developer communities with Microsoft and Googles. Skilled in Agile methodologies, I collaborate with multinational teams to deliver product roadmaps and innovative solutions that meet end-user needs. Now, I’m eager to bring my technical and business expertise help company create impactful products.",
    "work_experience": [
        {
            "position": "Senior Technical Product Manager",
            "company": "SeaMoney & ShopeePay",
            "location": "",
            "start_date": "2022",
            "end_date": "now",
            "bullets": [
                "Country responsible for managing 3 digital lending products (buy now pay later, cash loan)"
            ]
        },
        {
            "position": "Product Owner",
            "company": "MTI Technology",
            "location": "",
            "start_date": "2020",
            "end_date": "2022",
            "bullets": [
                "Successfully delivered 2 fintech products (payment app, eKYC solution)"
            ]
        },
        {
            "position": "Onsite Business Analyst",
            "company": "FPT Software, Fintech Dept.",
            "location": "",
            "start_date": "2016",
            "end_date": "2020",
            "bullets": [
                "Contributed to 10 software development projects with customer NPS>90"
            ]
        }
    ],
    "education": [
        {
            "degree": "Bachelor of Science in Engineering",
            "institution": "Da Nang University of Science and Technology",
            "location": "",
            "graduationDate": "",
            "description": "Information System Management | 3.1/4 | Ranked 15th/300 | Head of 25 events, 4 workshops, 1 club, 2 contests | Vietnam's Representative of The 46th Ship of Southeast Asian and Japanese Program (SSEAYP) 2019"
        }
    ],
    "skills": [
        "Product Management",
        "Data Analysis",
        "Interpersonal skill",
        "Language"
    ]
};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with Tu Bryan CV data');
    console.log('📁 Source: Tu_Bryan_CV_TechPM (1).pdf');
    
    try {
      // Create test file metadata
      const testFile = {
        name: 'Tu_Bryan_CV_TechPM (1).pdf',
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = 'd3578d4f-38ea-4627-8e44-feb70c84a32c'; // Real UUID for Supabase integration
      
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

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(testLLMData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 CV Parser JSON Population Test
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Testing Tu Bryan CV JSON → Structured Data → UI Population
          </p>
          <p className="text-sm text-gray-500">
            ChatGPT JSON response ready for CV Editor analysis
          </p>
        </div>

        {/* Complete JSON Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <details className="group" open>
            <div className="flex items-center justify-between mb-4">
              <summary className="cursor-pointer text-xl font-semibold text-gray-800 flex items-center hover:text-blue-600 transition-colors">
                <span className="mr-2 transform group-open:rotate-90 transition-transform">▶</span>
                📄 Complete Sample JSON Response (Tu Bryan)
              </summary>
              <button
                onClick={handleCopyJSON}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  copied 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="text-xs text-green-400 mb-2 font-mono">
                Source: Tu_Bryan_CV_TechPM (1).pdf (Sample Data)
              </div>
              <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap break-words">
{JSON.stringify(testLLMData, null, 2)}
              </pre>
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>📝 Note:</strong> This is sample JSON data that demonstrates the expected structure from ChatGPT. 
              Each field mapping can be traced from this source to the final UI display.
            </div>
          </details>
        </div>

        {/* Analysis Button */}
        <div className="text-center">
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className={`
              px-8 py-4 rounded-lg font-semibold text-white text-lg transition-all duration-200
              ${isAnalyzing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }
            `}
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Analyzing Tu Bryan CV...
              </div>
            ) : (
              'Start Analysis'
            )}
          </button>
          
          {showSuccess && (
            <div className="mt-4 text-center py-4">
              <div className="text-green-600 text-lg font-medium mb-2">✅ Analysis Complete!</div>
              <div className="text-sm text-gray-600">Redirecting to CV guided editing...</div>
            </div>
          )}
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
  () => Promise.resolve(CVUploadTestComponenttubryan),
  { ssr: false } // Real database integration for soft launch
);

export default CVUploadTestComponent;