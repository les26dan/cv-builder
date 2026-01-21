"use client";

import React from 'react';
import { landingPage } from '../config/texts/index';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';
import { useSectionTracking, useCTATracking } from '../hooks/useAnalytics';

const ProblemATS: React.FC = () => {
  const { problems } = landingPage;
  const { ats } = problems;
  
  // Track section visibility
  const sectionRef = useSectionTracking('Problem ATS', 0.5, {
    section_position: 2,
    problem_type: 'ats_optimization'
  });
  
  // Track CTA clicks
  const trackCTA = useCTATracking();

  const handleCTAClick = async (event: React.MouseEvent) => {
    // Track with new analytics system
    trackCTA('Fix all issues now', 'problem_ats_section', {
      clickEvent: event,
      section_name: 'Problem ATS',
      problem_category: 'ats_optimization'
    });
    
    // Keep existing tracking for backward compatibility
    trackCTAClick('problem_ats');
    await handlePrimaryCTA();
  };

  return (
    <section 
      ref={sectionRef}
      className="flex flex-row justify-center items-center px-4 sm:px-6 lg:px-10 py-[60px] pb-[80px] gap-8 md:gap-16 w-full min-h-[500px] bg-[#E0F7FA]"
    >
      {/* Content */}
      <div className="flex flex-col items-start gap-6 w-full md:w-[500px]">
        {/* Section Label removed per UI polish requirements */}

        {/* Problem Title */}
        <h2 className="font-inter font-bold text-2xl md:text-[32px] leading-tight md:leading-[38px] text-[#111827] w-full">
          {ats.title}
          </h2>

        {/* Problem Description */}
        <p className="font-inter font-normal text-lg leading-[22px] text-[#374151] w-full">
          {ats.description}
        </p>
      </div>

      {/* Image Container */}
      <div className="flex flex-row justify-center items-center w-full md:w-[500px] h-[360px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        {/* Resume Score Card */}
        <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[400px] h-[320px] bg-white border border-[#B2EBF2] rounded-lg">
          {/* Header */}
          <div className="flex flex-row justify-between items-center gap-2 w-full h-16">
            <span className="font-inter font-bold text-xl leading-6 text-[#111827]">
              {ats.scoreCard.title}
            </span>
            
            {/* Score Circle */}
            <div className="flex flex-row justify-center items-center w-16 h-16 bg-[#FFC107] rounded-full">
              <span className="font-inter font-bold text-2xl leading-[29px] text-white">
                {ats.scoreCard.score}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#B2EBF2]"></div>

          {/* Issues Title */}
          <h3 className="font-inter font-semibold text-base leading-[19px] text-[#111827] w-full">
            {ats.scoreCard.issuesTitle}
          </h3>

          {/* Issues List */}
          <div className="flex flex-col items-start gap-3 w-full flex-1">
            {ats.scoreCard.issues.map((issue, index) => (
              <div key={index} className="flex flex-row items-start gap-2 w-full">
                {/* Warning Icon */}
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-inter font-normal text-sm leading-[17px] text-[#111827] flex-1">
                  {issue}
                </span>
              </div>
            ))}
          </div>

          {/* Fix Button */}
          <button 
            onClick={handleCTAClick}
            className="flex flex-row justify-center items-center w-full h-12 px-4 py-3 bg-[#0277BD] rounded-md hover:bg-primary-600 transition-colors"
          >
            <span className="font-inter font-semibold text-base leading-[19px] text-white">
              {ats.scoreCard.cta}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProblemATS; 