'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponentInner() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ensure client-side only rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Test data from Manroe CV ChatGPT response (Step 2: ChatGPT API Response) - UPDATED EDUCATION FIELDS
  const testLLMData = {
    "possibility_score": 9,
    "contact": {
      "full_name": "Manroe Tran",
      "email": "maitn317@gmail.com",
      "phone": "+84 907535858", 
      "address": "Ho Chi Minh City, Vietnam",
      "linkedin": "LinkedIN"
    },
    "work_experience": [
      {
        "position": "Product Manager",
        "company": "M_Service (MoMo)",
        "location": "Vietnam",
        "start_date": "Dec 2019",
        "end_date": "Present",
        "bullets": [
          "Transformed single app to super app v2 to v3.1, optimizing customer journey",
          "Achieved 35% penetration, DAU: 1.7M-3.5M users per month",
          "Upgraded payment solutions v1 to v2 enterprise global (Apple, Google)",
          "Increased 10%-28% transaction rate success in BNPL, Paylater, ATM",
          "Led R&D innovative Face Recognition Payment (FRP) model in AI4VN 2022"
        ]
      },
      {
        "position": "Senior Product Manager", 
        "company": "BeGroup",
        "location": "Vietnam",
        "start_date": "Mar 2019",
        "end_date": "Jul 2019",
        "bullets": [
          "Launched be-Delivery application with 60% penetration, 45% retention, 500k DAU",
          "Built core-product be-Food for E2E delivery food service"
        ]
      },
      {
        "position": "Mobile Product Manager",
        "company": "SeaGroup (Garena Online)",
        "location": "Singapore, Vietnam", 
        "start_date": "Jun 2015",
        "end_date": "Oct 2018",
        "bullets": [
          "Launched Onmyoji (Am Duong Su) RPG - top game-of-the-day on App Store",
          "Achieved >1M downloads, exhibited in Shanghai, Thailand, Vietnam with 20k guests",
          "Launched ThunderStrike (Chien Co Huyen Thoai) with >3M downloads, 50K CCU, 300-450k DAU"
        ]
      },
      {
        "position": "Operation Officer, Consultant, PM & Sound Efx Manager",
        "company": "PLAYFURY",
        "location": "Vietnam",
        "start_date": "Jun 2013", 
        "end_date": "2015",
        "bullets": [
          "Managed multiple game development projects",
          "Received Bronze reward for management of organization"
        ]
      },
      {
        "position": "Supervisor 3D Animation Team",
        "company": "XTASEA",
        "location": "Israel",
        "start_date": "Jan 2013",
        "end_date": "May 2013", 
        "bullets": [
          "Supported and tracked working process of all active projects",
          "Managed performance and time-tracking of employees"
        ]
      },
      {
        "position": "Graphic Designer",
        "company": "SUNSOFT Joint Stock Company",
        "location": "Vietnam",
        "start_date": "Jan 2012",
        "end_date": "Jan 2013",
        "bullets": [
          "Graphic design work for web and digital projects"
        ]
      }
    ],
    "education": [
      {
        "degree": "Professional Bachelor of Computer Technology",
        "institution": "ITA, Asia E University",
        "location": "Kuala Lumpur, Malaysia",
        "graduationDate": "2013",
        "description": "GPA 3.67"
      },
      {
        "degree": "Bachelor of Sciences in Informatics, Web Developer",
        "institution": "Infoworld School", 
        "location": "Vietnam",
        "graduationDate": "2012",
        "description": ""
      }
    ],
    "skills": [
      "Product Management",
      "Mobile App Development",
      "Payment Solutions",
      "User Experience (UX)",
      "Data Analytics",
      "Team Leadership"
    ],
    "summary": "Experienced Product Manager with 8+ years in fintech, gaming, and mobile app development. Led successful product launches at major Vietnamese companies including MoMo, BeGroup, and SeaGroup."
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true)
    console.log('🧪 TEST: Starting JSON population analysis with Manroe CV data')
    console.log('📁 Source: /Workflow Files/Initiatives/CV Parser/Manroe/2.md')
    
    try {
      // Generate a test CV ID (client-side only)
      const testCvId = `test-manroe-${new Date().getTime()}`
      
      console.log('🧪 TEST: Raw ChatGPT JSON data:', JSON.stringify(testLLMData, null, 2))
      console.log('🔍 TEST: Contact field analysis:')
      console.log('  - full_name:', testLLMData.contact.full_name)
      console.log('  - email:', testLLMData.contact.email)
      console.log('  - phone:', testLLMData.contact.phone)
      console.log('  - address:', testLLMData.contact.address, '(should map to location)')
      console.log('  - linkedin:', testLLMData.contact.linkedin)
      
      // Simulate the actual upload response structure
      const uploadData = {
        cvId: testCvId,
        file: {
          name: 'Manroe_CV_Test.pdf',
          size: 256000,
          type: 'application/pdf'
        },
        extractedData: null,
        llmParsedData: testLLMData,
        structuredCV: null, // Will be populated by conversion logic
        blobUrl: null,
        timestamp: new Date().getTime(),
        processed: true,
        validCV: true
      }

      // Import and use the actual conversion logic
      console.log('⚙️ TEST: Converting JSON using cvParserService.convertToGuidedEditingFormat()')
      const { cvParserService } = await import('../../../shared/services/cvParserService')
      const structuredCV = cvParserService.convertToGuidedEditingFormat(testLLMData)
      
      console.log('🧪 TEST: Structured CV after conversion:', JSON.stringify(structuredCV, null, 2))
      console.log('🔍 TEST: Contact field mapping verification:')
      console.log('  - ChatGPT "address":', testLLMData.contact.address)
      console.log('  - Converted to "location":', structuredCV.contact.location)
      console.log('  - fullName mapping:', structuredCV.contact.fullName)
      console.log('  - email mapping:', structuredCV.contact.email)
      console.log('  - phone mapping:', structuredCV.contact.phone)
      console.log('  - linkedin mapping:', structuredCV.contact.linkedin)
      
      uploadData.structuredCV = structuredCV

      // Store in localStorage exactly like the real upload flow
      if (typeof window !== 'undefined') {
        localStorage.setItem('cv_upload_data', JSON.stringify(uploadData))
        localStorage.setItem(`cv_upload_${testCvId}`, JSON.stringify(uploadData))
        console.log('🧪 TEST: Data stored in localStorage with keys:')
        console.log('  - cv_upload_data')
        console.log('  - cv_upload_' + testCvId)
      }

      // Show success message
      setShowSuccess(true)
      
      setTimeout(() => {
        console.log('🧪 TEST: Navigating to CV guided editing')
        console.log('🎯 TEST: Expected contact population:')
        console.log('  - Full Name: "' + testLLMData.contact.full_name + '"')
        console.log('  - Email: "' + testLLMData.contact.email + '"')
        console.log('  - Phone: "' + testLLMData.contact.phone + '"')
        console.log('  - Location: "' + testLLMData.contact.address + '"')
        console.log('  - LinkedIn: "' + testLLMData.contact.linkedin + '"')
        // Navigate to CV guided editing with test CV ID
        router.push(`/cv-guided-editing/${testCvId}?source=test&parsed=success`)
      }, 1500)
      
    } catch (error) {
      console.error('🧪 TEST: Analysis failed:', error)
      setIsAnalyzing(false)
    }
  }

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(testLLMData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 CV Parser JSON Population Test
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Testing Manroe CV JSON → Structured Data → UI Population
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
                📄 Complete ChatGPT JSON Response (from Manroe/2.md)
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
                Source: /Workflow Files/Initiatives/CV Parser/Manroe/2.md
              </div>
              <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap break-words">
{JSON.stringify(testLLMData, null, 2)}
              </pre>
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>📝 Note:</strong> This is the exact JSON response from ChatGPT that should populate all fields in the CV Editor. 
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
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing JSON...
              </>
            ) : (
              '🚀 Start Analysis'
            )}
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  ✅ JSON processing complete! Redirecting to CV Guided Editing...
                </p>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
} 

// Dynamic import to completely bypass SSR
const CVUploadTestComponent = dynamic(() => Promise.resolve(CVUploadTestComponentInner), {
  ssr: false, // Real database integration for soft launch
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    </div>
  )
})

export default function CVUploadedTestPage() {
  return <CVUploadTestComponent />
} 