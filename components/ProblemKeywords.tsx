"use client";

import React from 'react';
import { landingPage } from '../config/texts/index';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';

const ProblemKeywords: React.FC = () => {
  const { problems } = landingPage;
  const { keywords } = problems;

  const handleCTAClick = async () => {
    trackCTAClick('problem_keywords');
    await handlePrimaryCTA();
  };

  return (
    <section className="flex flex-row justify-center items-center px-4 sm:px-6 lg:px-10 py-[60px] pb-[80px] gap-8 md:gap-16 w-full min-h-[500px] bg-[#E0F7FA]">
      {/* Image Container */}
      <div className="flex flex-row justify-center items-center w-full md:w-[500px] h-[400px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        {/* Keyword Analysis */}
        <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[400px] h-[360px] bg-white border border-[#B2EBF2] rounded-lg">
          {/* Header */}
          <div className="flex flex-row justify-between items-center gap-2 w-full h-8">
            <span className="font-inter font-bold text-xl leading-6 text-[#111827]">
              {keywords.analysis.title}
            </span>
            
            {/* Match Indicator */}
            <div className="flex flex-row justify-center items-center px-3 h-8 bg-[#FFF8E1] rounded-2xl">
              <span className="font-inter font-semibold text-sm leading-[17px] text-[#FFA000]">
                {keywords.analysis.matchIndicator}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#B2EBF2]"></div>

          {/* Job Description */}
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="font-inter font-semibold text-base leading-[19px] text-[#111827] w-full">
              {keywords.analysis.jobRequirements}
            </h3>
            
            {/* Keywords Container */}
            <div className="flex flex-col items-start gap-2 w-full">
              {/* Present Keywords Row */}
              <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                {keywords.analysis.presentKeywords.map((keyword, index) => (
                  <div key={`present-${index}`} className="flex flex-row justify-center items-center px-3 h-8 bg-[#E1F5FE] rounded-2xl">
                    <span className="font-inter font-medium text-sm leading-[17px] text-[#0277BD]">
                      {keyword}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Missing Keywords Row */}
              <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                {keywords.analysis.missingKeywords.map((keyword, index) => (
                  <div key={`missing-${index}`} className="flex flex-row justify-center items-center px-3 h-8 bg-[#FEF2F2] rounded-2xl">
                    <span className="font-inter font-medium text-sm leading-[17px] text-[#EF4444]">
                      {keyword}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Keywords */}
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="font-inter font-semibold text-base leading-[19px] text-[#111827] w-full">
              {keywords.analysis.missingTitle}
            </h3>
            
            {/* Missing Keywords as horizontal tags with plus icons */}
            <div className="flex flex-row flex-wrap items-center gap-2 w-full">
              {keywords.analysis.missingList.map((item, index) => (
                <div key={index} className="flex flex-row items-center gap-1 px-3 h-8 bg-[#FEF2F2] rounded-2xl">
                  {/* Plus Icon */}
                  <div className="w-4 h-4 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="#0277BD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-inter font-medium text-sm leading-[17px] text-[#EF4444]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Button */}
          <button 
            onClick={handleCTAClick}
            className="flex flex-row justify-center items-center w-full h-12 px-4 py-3 bg-[#0277BD] rounded-md hover:bg-primary-600 transition-colors"
          >
            <span className="font-inter font-semibold text-base leading-[19px] text-white">
              {keywords.analysis.cta}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start gap-6 w-full md:w-[500px]">
        {/* Section Label removed per UI polish requirements */}

        {/* Problem Title */}
        <h2 className="font-inter font-bold text-2xl md:text-[32px] leading-tight md:leading-[38px] text-[#111827] w-full">
          {keywords.title}
        </h2>

        {/* Problem Description */}
        <p className="font-inter font-normal text-lg leading-[22px] text-[#374151] w-full">
          {keywords.description}
        </p>
      </div>
    </section>
  );
};

export default ProblemKeywords; 