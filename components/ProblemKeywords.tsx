"use client";

import React from 'react';
import { landingPage } from '../config/texts/vi/landingPage';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';

const ProblemKeywords: React.FC = () => {
  const { problems } = landingPage;
  const { keywords } = problems;

  const handleCTAClick = async () => {
    trackCTAClick('problem_keywords');
    await handlePrimaryCTA();
  };

  return (
    <section className="flex flex-row justify-center items-center px-4 md:px-[120px] py-[60px] pb-[80px] gap-8 md:gap-16 w-full min-h-[500px] bg-[#E0F7FA]">
      {/* Image Container */}
      <div className="flex flex-row justify-center items-center w-full md:w-[500px] h-[360px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        {/* Keyword Analysis */}
        <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[400px] h-[320px] bg-white">
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
            <div className="flex flex-row flex-wrap items-center gap-2 w-full">
              {/* Present Keywords */}
              {keywords.analysis.presentKeywords.map((keyword, index) => (
                <div key={`present-${index}`} className="flex flex-row justify-center items-center px-3 h-8 bg-[#E1F5FE] rounded-2xl">
                  <span className="font-inter font-medium text-sm leading-[17px] text-[#0288D1]">
                    {keyword}
                  </span>
                </div>
              ))}
              
              {/* Missing Keywords */}
              {keywords.analysis.missingKeywords.map((keyword, index) => (
                <div key={`missing-${index}`} className="flex flex-row justify-center items-center px-3 h-8 bg-[#FEF2F2] rounded-2xl">
                  <span className="font-inter font-medium text-sm leading-[17px] text-[#EF4444]">
                    {keyword}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Keywords */}
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="font-inter font-semibold text-base leading-[19px] text-[#111827] w-full">
              {keywords.analysis.missingTitle}
            </h3>
            
            {/* Keywords List */}
            <div className="flex flex-col items-start gap-2 w-full">
              {keywords.analysis.missingList.map((item, index) => (
                <div key={index} className="flex flex-row items-center gap-2 w-full">
                  {/* Plus Icon */}
                  <div className="w-5 h-5 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="#0288D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-inter font-normal text-sm leading-[17px] text-[#111827] flex-1">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Button */}
          <button 
            onClick={handleCTAClick}
            className="flex flex-row justify-center items-center w-full h-12 bg-[#0288D1] rounded-md hover:bg-[#0277BD] transition-colors"
          >
            <span className="font-inter font-semibold text-base leading-[19px] text-white">
              {keywords.analysis.cta}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start gap-6 w-full md:w-[500px]">
        {/* Section Label */}
        <div className="flex flex-row justify-center items-center px-3 h-7 bg-[#0288D1] rounded-[14px]">
          <span className="font-inter font-semibold text-sm leading-[17px] text-white">
            {keywords.label}
          </span>
        </div>

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