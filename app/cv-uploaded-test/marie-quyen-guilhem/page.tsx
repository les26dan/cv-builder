'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponentmariequyenguilhem() {
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

  // Test data from Marie Quyen Guilhem CV ChatGPT response
  const testLLMData = {
    "possibility_score": [
        10
    ],
    "contact": {
        "full_name": "MARIE QUYEN GUILHEM",
        "address": "",
        "email": "mguilhem19@gmail.com",
        "phone": "+84 388934808",
        "linkedin": "www.linkedin.com/in/marie-guilhem-8ab6b888/"
    },
    "summary": "Marie has 8 years of international experience with proven track record in product management, remote build, agile capability building, and digital transformation across banking, manufacturing and consumer industries in Asia, Europe, and the US.",
    "work_experience": [
        {
            "position": "Product Manager (Product Specialist)",
            "company": "McKinsey & Company",
            "location": "Global",
            "start_date": "Apr 2021",
            "end_date": "Present",
            "bullets": [
                "Launched a Gen-AI chatbot for a pharmaceutical company (United States) to provide tailored recommendations to Sales staff.",
                "Launched a Carbon Management System (Taiwan) to track, streamline reporting and reduce carbon emission in factories.",
                "Re-launched the 4th biggest utility mobile app globally (Indonesia)",
                "Launched a secured digital lending app (Indonesia) within 12 weeks as part of a new venture."
            ]
        },
        {
            "position": "Marketplace Product Manager",
            "company": "Global Fashion Group",
            "location": "Ho Chi Minh City, Vietnam",
            "start_date": "Oct 2020",
            "end_date": "Apr 2021",
            "bullets": [
                "Led projects across Asia, South America, and Australia on increasing stock availability, pricing compliance and gift with purchase.",
                "Partnered with Product teams in Germany and Vietnam to create product roadmaps based on global and regional market strategy."
            ]
        },
        {
            "position": "Proxy Product Owner",
            "company": "NashTech",
            "location": "Ho Chi Minh City, Vietnam",
            "start_date": "Mar 2018",
            "end_date": "Aug 2020",
            "bullets": [
                "Managed product backlogs for 3 web-based applications to streamline audit reporting for a British HR consulting firm.",
                "Partnered with 3 POs in London to define requirements."
            ]
        },
        {
            "position": "UX/UI Business Analyst",
            "company": "Cisco",
            "location": "San Jose, United States",
            "start_date": "Aug 2016",
            "end_date": "Aug 2017",
            "bullets": [
                "Conducted user research and usability testing for Cisco Cloud Collaboration products (Cisco WebEx and Spark) and presented insights for product improvements.",
                "Built Tableau dashboards to analyze usage trends."
            ]
        },
        {
            "position": "Business Analyst",
            "company": "Nestlé",
            "location": "London, United Kingdom",
            "start_date": "Sep 2014",
            "end_date": "Sep 2015",
            "bullets": [
                "Built a suite of visualization dashboards to understand seasonal trend of sales and profit in UK&I, Asia, and Central Europe.",
                "Implemented a new management system to coordinate information sharing of 18 reports."
            ]
        }
    ],
    "education": [
        {
            "degree": "BSc Information Management for Business (First Class)",
            "institution": "University College London",
            "location": "London, United Kingdom",
            "graduationDate": "June 2016",
            "description": "Relevant Course: Interaction Design, Business in a Competitive Environment, Programming"
        }
    ],
    "skills": [
        "Fluent in English and Vietnamese",
        "Conversational in French",
        "Wireframes (Zeplin, Visio, Balsamiq, Pencil, Invision) and workflow (Miro)",
        "Software development tools (Jira, Confluence, Asana)"
    ]
};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with Marie Quyen Guilhem CV data');
    console.log('📁 Source: Marie Quyen Guilhem CV (1).pdf');
    
    try {
      // Create test file metadata
      const testFile = {
        name: 'Marie Quyen Guilhem CV (1).pdf',
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = 'bc6d418c-df46-4141-a42b-bf4597ddddaa'; // Real UUID for Supabase integration
      
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
            Testing Marie Quyen Guilhem CV JSON → Structured Data → UI Population
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
                📄 Complete Sample JSON Response (Marie Quyen Guilhem)
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
                Source: Marie Quyen Guilhem CV (1).pdf (Sample Data)
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
                Analyzing Marie Quyen Guilhem CV...
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
  () => Promise.resolve(CVUploadTestComponentmariequyenguilhem),
  { ssr: false } // Real database integration for soft launch
);

export default CVUploadTestComponent;