'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponenthonguyenhainam() {
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

  // REAL data from Ho Nguyen Hai Nam CV ChatGPT response (Updated with actual extraction)
  const testLLMData = {
    "possibility_score": [
        10
    ],
    "contact": {
        "full_name": "Ho Nguyen Hai Nam",
        "address": "237/18 Hoang Dieu Road, Ward 8, District 4, TP. Ho Chi Minh",
        "email": "honguyenhainam1996@gmail.com",
        "phone": "+84 908 406 514",
        "linkedin": ""
    },
    "summary": "Results-oriented quality assurance tester with 4+ years of expertise in ensuring long-term product quality with high stability and quick application development life cycles. Ability to learn quickly, often in high-pressure situations in order to fully understand a new product Help to Participate in many crucial projects that brought the company's name and success to the current company.",
    "work_experience": [
        {
            "position": "QA/QC Trainee",
            "company": "KMS Technology",
            "location": "",
            "start_date": "2018",
            "end_date": "2019",
            "bullets": [
                "Work with the internal and Sell tool",
                "Apply Scrum and Agile to the work process",
                "Do Test according to four criteria, including: Client requirement clarification, Production requirement, Under requirement, User experiences",
                "Suggest the enhancement idea for the product",
                "Make the weekly Bugs/Enchantments report",
                "Make the release note for each release time",
                "Make the user guide for the current product version",
                "Research new tools and methodologies in case of testing",
                "Make the document and the demo section about the research result"
            ]
        },
        {
            "position": "Middle-Quality Control",
            "company": "MoMo E-Wallet",
            "location": "",
            "start_date": "2019",
            "end_date": "Present",
            "bullets": [
                "Check and analyze the PO requirements",
                "Define the project features by Xmind diagram",
                "Define test cases/ Checklist",
                "Check manually on four main parts, including: UI, API, Database, Performance",
                "Report bugs for the development team through Confluence Board",
                "Write automation test script with Selenium by Python and Java language",
                "Weekly report for the work process and bug found summarize",
                "Write release notes and user guide",
                "Customer support after project release",
                "Write Automation for overall product checklist",
                "Define Document for member",
                "Define Automation test for released task in detail level"
            ]
        }
    ],
    "education": [
        {
            "degree": "Bachelor Of Information Technologies (BITS)",
            "institution": "RMIT University VietNam",
            "location": "",
            "graduationDate": "2018",
            "description": "Graduated"
        }
    ],
    "skills": [
        "Quality Control",
        "Quality Assurance",
        "Documentation Analyst",
        "Database query",
        "Performance manual test",
        "Emulator Testing",
        "Automation with Selenium (Java, Python)",
        "Familiar API tool",
        "Product risk analysis",
        "Fluently English communication",
        "Quickly and Effectively Problem solving",
        "Team Collaboration",
        "Created Documentation Re"
    ]
};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with Ho Nguyen Hai Nam CV data');
    console.log('📁 Source: Resume_HoNguyenHaiNam.pdf');
    
    try {
      // Create test file metadata
      const testFile = {
        name: 'Resume_HoNguyenHaiNam.pdf',
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = '8cb9891e-5f8b-4d18-bd16-1abafd5374d6'; // Real UUID for Supabase integration
      
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
            Testing Ho Nguyen Hai Nam CV JSON → Structured Data → UI Population
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
                📄 Complete Sample JSON Response (Ho Nguyen Hai Nam)
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
                Source: Resume_HoNguyenHaiNam.pdf (Sample Data)
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
                Analyzing Ho Nguyen Hai Nam CV...
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
  () => Promise.resolve(CVUploadTestComponenthonguyenhainam),
  { ssr: false // Real database integration for soft launch }
);

export default CVUploadTestComponent;