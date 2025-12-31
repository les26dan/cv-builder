"use client";

import React from 'react';
import { landingPage } from '../config/texts/vi/landingPage';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';

const ProblemCoverLetters: React.FC = () => {
  const { problems } = landingPage;
  const { coverLetters } = problems;

  const handleCTAClick = async () => {
    trackCTAClick('problem_cover_letters');
    await handlePrimaryCTA();
  };

  return (
    <section className="flex flex-row justify-center items-center px-4 md:px-[120px] py-[60px] pb-[80px] gap-8 md:gap-16 w-full min-h-[500px] bg-[#E0F7FA]">
      {/* Image Container */}
      <div className="flex flex-row justify-center items-center w-full md:w-[500px] h-[360px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        {/* Cover Letter UI */}
        <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[400px] h-[320px] bg-white">
          {/* Header */}
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="font-inter font-bold text-xl leading-6 text-[#111827] w-full">
              {coverLetters.coverLetterUI.title}
            </h3>
            <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
              {coverLetters.coverLetterUI.subtitle}
            </p>
            </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#B2EBF2]"></div>

          {/* Cover Letter Preview */}
          <div className="flex flex-col items-start gap-3 w-full flex-1">
            {/* Greeting */}
            <h4 className="font-inter font-semibold text-base leading-[19px] text-[#111827] w-full">
              {coverLetters.coverLetterUI.greeting}
            </h4>

            {/* Letter Content */}
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="w-full h-2 bg-[#B2EBF2] rounded"></div>
              <div className="w-24 h-2 bg-[#B2EBF2] rounded"></div>
              <div className="w-28 h-2 bg-[#B2EBF2] rounded"></div>
              <div className="w-20 h-2 bg-[#B2EBF2] rounded"></div>
              <div className="w-32 h-2 bg-[#B2EBF2] rounded"></div>
            </div>

            {/* Customization Note */}
            <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
              {coverLetters.coverLetterUI.customization}
            </p>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleCTAClick}
            className="flex flex-row justify-center items-center w-full h-12 bg-[#0288D1] rounded-md hover:bg-[#0277BD] transition-colors"
          >
            <span className="font-inter font-semibold text-base leading-[19px] text-white">
              {coverLetters.coverLetterUI.cta}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start gap-6 w-full md:w-[500px]">
        {/* Section Label */}
        <div className="flex flex-row justify-center items-center px-3 h-7 bg-[#0288D1] rounded-[14px]">
          <span className="font-inter font-semibold text-sm leading-[17px] text-white">
            {coverLetters.label}
          </span>
        </div>

        {/* Problem Title */}
        <h2 className="font-inter font-bold text-2xl md:text-[32px] leading-tight md:leading-[38px] text-[#111827] w-full">
          {coverLetters.title}
        </h2>

        {/* Problem Description */}
        <p className="font-inter font-normal text-lg leading-[22px] text-[#374151] w-full">
          {coverLetters.description}
        </p>
      </div>
    </section>
  );
};

export default ProblemCoverLetters; 