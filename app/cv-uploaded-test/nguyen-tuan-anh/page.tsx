'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponentnguyentuananh() {
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

  // Test data from Nguyen Tuan Anh CV ChatGPT response
  const testLLMData = {
    "possibility_score": [
        10
    ],
    "contact": {
        "full_name": "TUAN ANH NGUYEN",
        "address": "",
        "email": "tuananh.email001@gmail.com",
        "phone": "+84 988 221015",
        "linkedin": ""
    },
    "summary": "Starting his career as an electronic engineer when just graduated from HCM University of Technology (Polytechnic) in 2008, Tuan Anh has moved to Supply Chain Management area (Intel) and latterly in Real Estate - Office Leasing & Investment area after he finished his Master of Business Administration course in Sydney, Australia in 2011. His career achievement is listed as the top three papers submitted for Intel Manufacturing Excellence Conference in planning organization world-wide in 2014, successful leading planning team’s project for transferring CPU products from Intel Malaysia to Intel Vietnam in 2015. Found Vietnam Office Leasing Co. Ltd, in 2017 and made it become profitable business operation from 2017 to 2020. His strengths are expertise in Production Planning, Office Management, Real Estate Investment, Property Management, Business Financial Analysis, Company starting up and Professional Networking.",
    "work_experience": [
        {
            "position": "DEPUTY ASSOCIATE DIRECTOR",
            "company": "COLLIERS",
            "location": "",
            "start_date": "June 2022",
            "end_date": "Present",
            "bullets": [
                "Joined Office Services team to provide office leasing consulting services to top high-end Buildings (Grade A, A+) to high-grade international companies in HCM.",
                "Supporting international and domestic clients, and planning for their office leasing include strategy go-stay analysis, searching for contingency options, leasing negotiation, leasing document submission and review.",
                "Landlord representative for a grade B building- Central Plaza building- 17 Le Duan Street.",
                "Acquiring new clients via professional networking and customer relationship activities."
            ]
        },
        {
            "position": "FOUNDER & CEO",
            "company": "VIETNAM OFFICE LEASING",
            "location": "",
            "start_date": "Jan 2017",
            "end_date": "May 2022",
            "bullets": [
                "Founded Vietnam Office Leasing (VOL) CO., LTD to provide building management services, office searching services and office leasing to small & medium enterprises in Ho Chi Minh City.",
                "Strategic planning for office leasing business. Weekly operation and finance status review.",
                "Financial analysis for acquiring any new buildings, all cost management.",
                "Negotiation and contracting to building owners, customers, sub-contractors, suppliers and supplement services."
            ]
        },
        {
            "position": "DEPUTY MANAGING DIRECTOR",
            "company": "DSG VIETNAM",
            "location": "",
            "start_date": "Oct 2015",
            "end_date": "Dec 2016",
            "bullets": [
                "Joining Digital Solution Company (DSG) CO., LTD as a deputy managing director responsible for maintaining ISO9001 standard for the company, direct managing department heads such as Accounting & Finance, Sale, Technical product training, Software Development, Customer services and Admin team.",
                "Manage internal projects such as upgrading ERP system, ISO 9001 new version implementation, compiling company training materials for software and hardware of company’s product.",
                "Support Managing Director to issue and control the implementation of company’s policies and procedures.",
                "Manage accounts of large enterprise customers in Banks, Insurances, FMCG, and pharmaceutical."
            ]
        },
        {
            "position": "FACTORY PLANNER",
            "company": "INTEL VN & MALAYSIA",
            "location": "",
            "start_date": "June 2014",
            "end_date": "Sep 2015",
            "bullets": [
                "Working as a production planner for Intel products in Malaysia and Vietnam as a same time, the role was to make sure Intel customers have the right supply from Manufacturing in the 2 countries.",
                "Communicate with upstream factories/ organizations regarding resource availability (piece parts, factory capacity and die) to support weekly commit.",
                "Working with logistic managers to make sure raw materials are ship to Vietnam factory without any delay and at saving cost mode of shipment, and finished goods will be distributed to customers’ warehouse on time without any quality issue.",
                "Closely work with custom team for any new products and material that will come to Vietnam factory."
            ]
        },
        {
            "position": "SUPPLY MANAGEMENT ANALYST",
            "company": "INTEL VIETNAM",
            "location": "",
            "start_date": "June 2012",
            "end_date": "May 2014",
            "bullets": [
                "Joining Intel Vietnam as a supply management analyst with main responsible is producing flawless execution plan that can bring Vietnam factory performance to serve Intel customers.",
                "Own and manage manufacturing assembly/test wip, inventory and product parameters.",
                "Closely work with manufacturing, integration, engineers and quality divisions on product commitments, product quality and product detail execution.",
                "Joining continuous improvement activities results in working process improvement which cut waste and reducing lead time."
            ]
        },
        {
            "position": "HARDWARE ENGINEER",
            "company": "RENESAS DESIGN VIETNAM",
            "location": "",
            "start_date": "Mar 2008",
            "end_date": "Feb 2009",
            "bullets": [
                "Worked as a hardware-design engineer in Japanese professional working environment to make sure every electronic designed module was implemented test circuits."
            ]
        }
    ],
    "education": [
        {
            "degree": "Master of Business Administration",
            "institution": "University of Technology, Sydney",
            "location": "",
            "graduationDate": "2011",
            "description": "Mentored, coached & tutored peers, team members during tutorials, seminars & workshops as a means of collaborative problem solving & decision making."
        },
        {
            "degree": "Master of Engineering Management",
            "institution": "University of Technology, Sydney",
            "location": "",
            "graduationDate": "2010",
            "description": "Focused studies on working with teams in a practical engineering environment; and in particular leading teams of engineers in a vast spectrum of specialties to achieve an outcome in desired projects based on real life case studies."
        },
        {
            "degree": "Bachelor of Electronic & Telecommunication Engineering",
            "institution": "University of Polytechnic, Ho Chi Minh City (HCMUT)",
            "location": "",
            "graduationDate": "2008",
            "description": ""
        },
        {
            "degree": "Professional C.E.O assistant",
            "institution": "Toppion Training & Consulting group, HCM city",
            "location": "",
            "graduationDate": "2013",
            "description": ""
        }
    ],
    "skills": [
        "Production Planning",
        "Office Management",
        "Real Estate Investment",
        "Property Management",
        "Business Financial Analysis",
        "Company starting up",
        "Professional Networking"
    ]
};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with Nguyen Tuan Anh CV data');
    console.log(`📁 Source: Nguyen Tuan Anh's CV (1).pdf`);
    
    try {
      // Create test file metadata
      const testFile = {
        name: "Nguyen Tuan Anh's CV (1).pdf",
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = 'd98457c8-6ade-42e6-97eb-2fef32debfb3'; // Real UUID for Supabase integration
      
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
            Testing Nguyen Tuan Anh CV JSON → Structured Data → UI Population
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
                📄 Complete Sample JSON Response (Nguyen Tuan Anh)
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
                Source: Nguyen Tuan Anh's CV (1).pdf (Sample Data)
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
                Analyzing Nguyen Tuan Anh CV...
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
  () => Promise.resolve(CVUploadTestComponentnguyentuananh),
  { ssr: false } // Real database integration for soft launch
);

export default CVUploadTestComponent;