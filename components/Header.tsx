import React from 'react';
import { CrossAppDataService } from '../shared/services/crossAppDataService';

interface HeaderProps {
  cvScore: number;
  cvData?: any;
  onUpdateCvData?: (data: any) => void;
  onJobAnalysisComplete?: (analysisResults: any) => void;
}

export const Header = ({ cvScore, cvData, onUpdateCvData, onJobAnalysisComplete }: HeaderProps) => {

  const crossAppService = CrossAppDataService.getInstance();
  const { cvId, userId } = crossAppService.getURLParams();

  const handleBackToUpload = () => {
    if (cvId && userId && cvData) {
      // Convert current CV data back to WorkflowCVData format
      const workflowData = {
        id: cvId,
        userId: userId,
        title: cvData.contact?.fullName ? `CV - ${cvData.contact.fullName}` : 'CV',
        status: 'completed' as const,
        score: cvScore,
        contact: cvData.contact,
        summary: cvData.summary,
        experience: cvData.experience,
        skills: cvData.skills,
        education: cvData.education,
        workflow: {
          currentStep: 'editing' as const,
          stepsCompleted: ['upload', 'analysis'],
          lastActiveStep: 'editing' as const,
          timeSpent: 0
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          source: 'upload' as const
        },
        settings: {
          autoSave: true,
          aiAssistance: true,
          template: 'dennis-schroder',
          language: 'vi' as const
        }
      };

      // Navigate back to upload page with current CV data
      crossAppService.navigateWithCVData('upload', workflowData);
    } else {
      // Fallback to direct navigation if no CV data
      window.location.href = 'http://localhost:4000';
    }
  };

  const handleLogoClick = () => {
    // Auto-save current CV data before navigation
    if (cvId && userId && cvData && onUpdateCvData) {
      // Trigger auto-save by calling onUpdateCvData with current data
      onUpdateCvData(cvData);
    }
    
    // Navigate to workspace - corrected URL to use port 3002
    window.location.href = 'http://localhost:3002/workspace';
  };



  return (
    <>
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          {/* Back to Upload Button - Standardized Design */}
          {cvId && (
            <button
              onClick={handleBackToUpload}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
              title="Quay lại trang Upload CV & JD"
              aria-label="Quay lại trang Upload CV & JD"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          
          {/* OkBuddy Logo - Standardized Design */}
          <button
            onClick={handleLogoClick}
            className="text-2xl font-bold text-primary-500 hover:text-primary-600 active:text-primary-700 transition-colors duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 rounded-md px-2 py-1"
            title="Quay lại CV Workspace"
            aria-label="Quay lại CV Workspace"
          >
            OkBuddy
            {/* Hover tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Quay lại CV Workspace
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
            </div>
          </button>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-success-50 text-success-500 text-sm rounded-full border border-success-500/20">
            ✓ Đã lưu tự động
          </div>
          <div className="w-8 h-8 bg-primary-500 rounded-full text-white flex items-center justify-center font-bold">
            N
          </div>
        </div>
      </div>


    </>
  );
};