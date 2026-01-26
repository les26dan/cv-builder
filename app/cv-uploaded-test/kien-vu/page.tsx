'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

function CVUploadTestComponentkienvu() {
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

  // Test data from Kien Vu CV ChatGPT response
  const testLLMData = {
    "possibility_score": [
        10
    ],
    "contact": {
        "full_name": "KIEN (JONATHAN) VU VIET",
        "address": "Ho Chi Minh City, Vietnam",
        "email": "vuvietkien.ptithcm@gmail.com",
        "phone": "+84 972 947 523",
        "linkedin": "Linkedin"
    },
    "summary": "",
    "work_experience": [
        {
            "position": "Technical Product Manager",
            "company": "DHF Platforms",
            "location": "Vietnam, Singapore",
            "start_date": "Jul 2024",
            "end_date": "Now",
            "bullets": [
                "Optimized supply chain operations and production workflows, achieving 3x improvement in inventory update and a 90% reduction in reporting errors, by designing and implementing an ERP system tailored to operational needs.",
                "Centralized fragmented data from ERP, CRM, and B2B reports into a unified data warehouse, enabling real-time tracking of north-star metrics and KPIs through scalable ETL processes and comprehensive data mapping.",
                "Defined and prioritized the 2025 product roadmap to achieve 200% GMV growth, focusing on scaling operational workflows and launching a farm application for suppliers to enhance crop quality, productivity, and traceability.",
                "Developed a cohesive UI/UX design system in Figma, enhancing usability and platform consistency, measured by improved stakeholder satisfaction through iterative feedback loops."
            ]
        },
        {
            "position": "Product Manager",
            "company": "Peeba (YC23)",
            "location": "Indonesia, Vietnam",
            "start_date": "May 2023",
            "end_date": "Nov 2023",
            "bullets": [
                "Enhanced UI/UX of products by conducting experiments such as implementing a new sign-up flow that increased conversion rates by 26%.",
                "Led the development of pivotal features, encompassing inventory management, a tiered pricing system, tailored to the business structures of brands, flexible payment methods for local markets, and the integration of a buy-now-pay-later scheme with third-party services.",
                "Accomplished 3 comprehensive market research initiatives in Indonesia, gathering insights through on-field talking, surveys, and in-depth interviews. Informed business decisions and shaped product directions based on collected feedback.",
                "Collaborated with the business team to test and refine key strategies, introducing a wholesale subscription model, one-year free shipping, and a Direct Sales App (SaaS) for brands to enhance sales efficiency. Achieved a remarkable $17,000 in GMV for one brand within just 3 weeks through the implementation of the Direct Sales App."
            ]
        },
        {
            "position": "Product Lead, Growth",
            "company": "MoMo",
            "location": "Ho Chi Minh (Vietnam)",
            "start_date": "Mar 2020",
            "end_date": "Apr 2023",
            "bullets": [
                "Achieved a 1.7x increase in daily transaction numbers through the implementation of multi-source funds. Post-campaign, daily transaction volume was 1.5x higher than pre-campaign average volume.",
                "Successfully educated the financial hub to 12 million users by providing multiple sources of funds and flexible payment choices.",
                "Coordinated with the engineering manager to develop a cloud platform for the game that can manage 10,000 connections during a room battle, utilizing the Google Cloud Platform.",
                "Established a document about LAWs of UX applied to build gamification features in Fintech to enhance user engagement."
            ]
        },
        {
            "position": "Engineering Manager",
            "company": "SaveMoney (Insurance Startup)",
            "location": "Vietnam",
            "start_date": "Oct 2018",
            "end_date": "Feb 2020",
            "bullets": [
                "Increased product quality and execution speed by 50%, measured by faster deployment and improved team efficiency, by establishing cross-functional workflows with Scrum and ensuring clear communication across a team of 11.",
                "Improved team cohesion and adaptability to feedback, resulting in reduced development timelines and increased stakeholder satisfaction, by implementing agile practices.",
                "Delivered new microinsurance products successfully, measured by meeting project deadlines and launching on schedule, by leading a team of product owners, engineers, and designers, and holding regular workshops to foster collaboration."
            ]
        },
        {
            "position": "Senior Fullstack Software Engineer",
            "company": "",
            "location": "Vietnam and the Philippines",
            "start_date": "Feb 2015",
            "end_date": "Feb 2020",
            "bullets": [
                "Collaborated with a global team across the Philippines, US (Florida, and other regions) to enhance the Disney Cruise Line reservation tracking system, ensuring real-time updates and operational accuracy while adapting to US working styles and overnight schedules to meet deadlines.",
                "Designed and implemented scalable web-based solutions, including Warehouse Management, CRM systems, and cloud-based insurance platforms, using AngularJS, ReactJS, Node.js, GCP, and aligning technical solutions with business goals to optimize performance and reliability.",
                "Improved full-stack application scalability and efficiency, leveraging CI/CD pipelines, Kubernetes, and SQL databases, reducing downtime and enhancing deployment speed.",
                "Translated business requirements into technical solutions by coordinating with business analysts and product owners, ensuring alignment with client needs and user expectations."
            ]
        }
    ],
    "education": [
        {
            "degree": "Business Intelligence Program",
            "institution": "Mastering Data Analytics, VN",
            "location": "",
            "graduationDate": "Nov 2024 – 2025",
            "description": "Analytics techniques, Dashboard insights, Storytelling, Business statistics and Analytical thinking."
        },
        {
            "degree": "Leadership & Management",
            "institution": "Master in Public Policy, Fulbright University VN",
            "location": "",
            "graduationDate": "Oct 2022 – 2024",
            "description": "Subjects included leadership and management, negotiation, data science, quantitative methods, microeconomics, macroeconomics, public policy, law, budgeting and financial management."
        },
        {
            "degree": "Software Engineer",
            "institution": "Posts and Telecommunication Institute of Technology",
            "location": "",
            "graduationDate": "Oct 2010 - Jan 2015",
            "description": ""
        }
    ],
    "skills": []
};

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    console.log('🧪 TEST: Starting JSON population analysis with Kien Vu CV data');
    console.log('📁 Source: Kien Vu Sr. Product Manager (Jan 2025).pdf');
    
    try {
      // Create test file metadata
      const testFile = {
        name: 'Kien Vu Sr. Product Manager (Jan 2025).pdf',
        size: 250000, // Approximate size
        type: 'application/pdf'
      };

      // Generate unique CV ID
      const cvId = '8a02e160-06df-4162-9ba5-25754fa075df'; // Real UUID for Supabase integration
      
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
            Testing Kien Vu CV JSON → Structured Data → UI Population
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
                📄 Complete Sample JSON Response (Kien Vu)
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
                Source: Kien Vu Sr. Product Manager (Jan 2025).pdf (Sample Data)
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
                Analyzing Kien Vu CV...
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
  () => Promise.resolve(CVUploadTestComponentkienvu),
  { ssr: false // Real database integration for soft launch }
);

export default CVUploadTestComponent;