import React from 'react';
import { MobileDetectionResult } from '../utils/useMobileDetection';
import { mobileBlockingTexts } from '../config/texts/vi/mobileBlocking';

interface MobileBlockingOverlayProps {
  detection: MobileDetectionResult;
  onBackToWorkspace: () => void;
  onLogout?: () => void;
}

/**
 * Mobile Blocking Overlay Component
 * 
 * Displays a blocking message for mobile users trying to access the CV Guided Editing interface.
 * Provides navigation options and clear messaging about desktop requirement.
 * 
 * Design follows Product Spec requirements:
 * - Block devices with viewport width < 1024px
 * - Provide clear messaging about desktop requirement
 * - Offer navigation options (back to workspace)
 * - Maintain OkBuddy branding and styling
 * - Use Vietnamese text from configuration
 */
export function MobileBlockingOverlay({ 
  detection, 
  onBackToWorkspace, 
  onLogout 
}: MobileBlockingOverlayProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-okbuddy-light-blue flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-sm mx-auto flex flex-col items-center p-6 gap-8">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Icon Container */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full flex items-center justify-center">
            {/* Monitor Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.33" y="5" width="33.33" height="23.33" rx="2" stroke="#F59E0B" strokeWidth="3.33" fill="none"/>
              <rect x="13.33" y="35" width="13.33" height="0" stroke="#F59E0B" strokeWidth="3.33"/>
              <line x1="20" y1="28.33" x2="20" y2="35" stroke="#F59E0B" strokeWidth="3.33"/>
            </svg>
          </div>

          {/* Title Section */}
          <div className="flex flex-col items-center gap-3 w-full">
            <h1 className="text-2xl font-bold text-gray-900 text-center leading-7">
              {mobileBlockingTexts.title}
            </h1>
            <p className="text-base text-gray-500 text-center leading-6">
              {mobileBlockingTexts.description}
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-50 rounded-xl p-5 gap-4 w-full flex flex-col">
          <h3 className="text-sm font-semibold text-emerald-600">
            {mobileBlockingTexts.featuresTitle}
          </h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#059669" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-gray-700">{mobileBlockingTexts.features.workspace}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#059669" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-gray-700">{mobileBlockingTexts.features.upload}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#059669" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-gray-700">{mobileBlockingTexts.features.download}</span>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={onBackToWorkspace}
            className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center"
            type="button"
          >
            <span className="text-base font-semibold text-black">{mobileBlockingTexts.actions.backButton}</span>
          </button>
          
          <p className="text-xs text-gray-400 text-center">
            {mobileBlockingTexts.actions.tabletSuggestion}
          </p>
        </div>
      </div>
    </div>
  );
} 