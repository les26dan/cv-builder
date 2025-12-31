"use client";

import React from 'react';
import { landingPage } from '../config/texts/vi/landingPage';
import { handlePrimaryCTA, trackCTAClick } from '../utils/navigation';

const ProblemMassCV: React.FC = () => {
  const { problems } = landingPage;
  const { massCV } = problems;

  const handleCTAClick = async () => {
    trackCTAClick('problem_mass_cv');
    await handlePrimaryCTA();
  };

  return (
    <section className="flex flex-row justify-center items-center px-4 md:px-[120px] py-[60px] pb-[80px] gap-8 md:gap-16 w-full min-h-[500px] bg-[#E0F7FA]">
      {/* Content */}
      <div className="flex flex-col items-start gap-6 w-full md:w-[500px]">
        {/* Section Label */}
        <div className="flex flex-row justify-center items-center px-3 h-7 bg-[#0288D1] rounded-[14px]">
          <span className="font-inter font-semibold text-sm leading-[17px] text-white">
            {massCV.label}
          </span>
        </div>

        {/* Problem Title */}
        <h2 className="font-inter font-bold text-2xl md:text-[32px] leading-tight md:leading-[38px] text-[#111827] w-full">
          {massCV.title}
          </h2>

        {/* Problem Description */}
        <p className="font-inter font-normal text-lg leading-[22px] text-[#374151] w-full">
          {massCV.description}
        </p>

        {/* CTA Button */}
        <button 
          onClick={handleCTAClick}
          className="flex flex-row justify-center items-center w-[280px] h-14 bg-[#0288D1] shadow-[0px_4px_12px_rgba(2,136,209,0.125)] rounded-lg hover:bg-[#0277BD] transition-colors"
        >
          <span className="font-inter font-semibold text-lg leading-[22px] text-white">
            {massCV.cta}
          </span>
        </button>
      </div>

      {/* Image Container */}
      <div className="flex flex-row justify-center items-center w-full md:w-[500px] h-[360px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-xl">
        {/* Mass Application UI */}
        <div className="flex flex-col items-start p-6 gap-4 w-full max-w-[400px] h-[320px] bg-white border border-[#B2EBF2] rounded-lg">
          {/* Header */}
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="font-inter font-bold text-xl leading-6 text-[#111827] w-full">
              {massCV.massApplication.title}
            </h3>
            <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
              {massCV.massApplication.subtitle}
            </p>
          </div>

          {/* Job List */}
          <div className="flex flex-col items-start gap-3 w-full flex-1 overflow-y-auto">
            {massCV.massApplication.jobs.map((job, index) => (
              <div key={index} className="flex flex-col items-start p-3 gap-3 w-full bg-[#E1F5FE] rounded-lg">
                {/* Job Header */}
                <div className="flex flex-row justify-between items-center gap-2 w-full">
                  <span className="font-inter font-semibold text-base leading-[19px] text-[#111827] flex-1">
                    {job.title}
                  </span>
                  
                  {/* Match Badge */}
                  <div className={`flex flex-row justify-center items-center px-2 h-6 rounded-xl ${
                    parseInt(job.match) >= 90 ? 'bg-[#ECFDF5]' : 
                    parseInt(job.match) >= 80 ? 'bg-[#ECFDF5]' : 'bg-[#FFF8E1]'
                  }`}>
                    <span className={`font-inter font-semibold text-xs leading-[14px] ${
                      parseInt(job.match) >= 90 ? 'text-[#10B981]' : 
                      parseInt(job.match) >= 80 ? 'text-[#10B981]' : 'text-[#FFA000]'
                    }`}>
                      {job.match}
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <button 
                  onClick={handleCTAClick}
                  className="flex flex-row justify-center items-center w-full h-9 bg-[#0288D1] rounded-md hover:bg-[#0277BD] transition-colors"
                >
                  <span className="font-inter font-semibold text-sm leading-[17px] text-white">
                    {job.cta}
                  </span>
            </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemMassCV; 