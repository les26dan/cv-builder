"use client";

import React from 'react';
import { landingPage } from '../config/texts/index';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';

const HeroSection: React.FC = () => {
  const { hero, resume, problems } = landingPage;

  const handleCTAClick = async () => {
    trackCTAClick('hero_section');
    await handlePrimaryCTA();
  };

  return (
    <section className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-[60px] md:py-[60px] pb-[80px] gap-8 w-full min-h-[840px] bg-[#E0F7FA]">
      {/* Content Container */}
      <div className="flex flex-col justify-center items-center gap-6 w-full max-w-[800px]">
        {/* Main Headline */}
        <h1 className="font-inter font-bold text-2xl sm:text-3xl md:text-5xl leading-tight md:leading-[58px] text-center text-[#111827] w-full">
          {hero.title}
        </h1>

        {/* Subheadline */}
        <p className="font-inter font-normal text-base sm:text-lg md:text-xl leading-6 md:leading-6 text-center text-[#374151] w-full">
          {hero.subtitle}
        </p>

        {/* CTA Button */}
        <button 
          onClick={handleCTAClick}
          className="flex flex-row justify-center items-center w-full h-12 px-4 py-3 bg-[#0277BD] rounded-md hover:bg-primary-600 transition-colors"
        >
          <span className="font-inter font-semibold text-base leading-[19px] text-white">
            {hero.cta}
          </span>
        </button>
      </div>

      {/* Hero Image */}
      <div className="flex flex-row justify-center items-center w-full max-w-[900px] min-h-[400px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full h-full p-4 md:p-8">
          {/* Resume Preview */}
          <div className="flex flex-col items-start p-4 md:p-6 gap-4 w-full md:w-[380px] min-h-[320px] md:h-[340px] bg-white border border-[#B2EBF2] rounded-lg">
            {/* Resume Header */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h3 className="font-inter font-bold text-lg md:text-xl leading-6 text-[#111827] w-full">
                {resume.preview.name}
              </h3>
              <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
                {resume.preview.role}
              </p>
            </div>

            {/* Resume Score */}
            <div className="flex flex-row items-center gap-2 w-full h-12">
              {/* Score Circle */}
              <div className="flex flex-row justify-center items-center w-12 h-12 bg-[#FFC107] rounded-full">
                <span className="font-inter font-bold text-base leading-[19px] text-white">
                  60
                </span>
              </div>

              {/* Score Text */}
              <div className="flex flex-col items-start gap-1 flex-1">
                <span className="font-inter font-semibold text-sm md:text-base leading-[19px] text-[#111827]">
                  {problems.ats.scoreCard.title}
                </span>
                <span className="font-inter font-normal text-xs md:text-sm leading-[17px] text-[#374151]">
                  {problems.ats.scoreCard.description}
                </span>
              </div>
            </div>

            {/* Resume Content */}
            <div className="flex flex-col items-start gap-3 w-full flex-1">
              {/* Experience Section */}
              <div className="flex flex-col items-start gap-2 w-full">
                <h4 className="font-inter font-semibold text-sm md:text-base leading-[19px] text-[#111827] w-full">
                  {resume.preview.experience}
                </h4>
                <div className="flex flex-col items-start gap-2 w-full">
                  <div className="w-full h-2 bg-[#B2EBF2] rounded"></div>
                  <div className="w-20 h-2 bg-[#B2EBF2] rounded"></div>
                  <div className="w-24 h-2 bg-[#B2EBF2] rounded"></div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="flex flex-col items-start gap-2 w-full">
                <h4 className="font-inter font-semibold text-sm md:text-base leading-[19px] text-[#111827] w-full">
                  {resume.preview.skills}
                </h4>
                <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                  {resume.preview.skillsList.map((skill: any, index) => (
                    <div key={index} className="flex flex-row justify-center items-center px-2 md:px-3 h-7 md:h-8 bg-[#E1F5FE] rounded-2xl">
                      <span className="font-inter font-medium text-xs md:text-sm leading-[17px] text-[#0277BD]">
                        {typeof skill === 'object' && skill.name ? skill.name : skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="flex md:hidden lg:flex flex-col items-start p-4 md:p-6 gap-4 w-full md:w-[380px] min-h-[320px] md:h-[340px] bg-white border border-[#B2EBF2] shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-lg">
            {/* Header */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h3 className="font-inter font-bold text-lg md:text-xl leading-6 text-[#111827] w-full">
                {resume.aiSuggestions.title}
              </h3>
              <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
                {resume.aiSuggestions.subtitle}
              </p>
            </div>

            {/* Suggestions List */}
            <div className="flex flex-col items-start gap-3 w-full">
              {resume.aiSuggestions.suggestions.map((suggestion, index) => (
                <div key={index} className="flex flex-row items-start gap-2 w-full">
                  {/* Warning Icon */}
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-inter font-normal text-xs md:text-sm leading-[17px] text-[#111827] flex-1">
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>

            {/* Apply Button */}
            <button 
              onClick={handleCTAClick}
              className="flex flex-row justify-center items-center w-full h-12 px-4 py-3 bg-[#0277BD] rounded-md hover:bg-primary-600 transition-colors"
            >
              <span className="font-inter font-semibold text-base leading-[19px] text-white">
                {resume.aiSuggestions.cta}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 