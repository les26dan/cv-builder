'use client';

import React, { useState, useEffect } from 'react';
import SharedHeader from '@/components/SharedHeader';
import { detectLanguage } from '@/config/languageConfig';
import { career as careerEN } from '@/config/texts/en/career';
import { career as careerVI } from '@/config/texts/vi/career';

export default function CareerPage() {
  const [texts, setTexts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTexts = () => {
      try {
        const language = detectLanguage().language;
        const careerTexts = language === 'vi' ? careerVI : careerEN;
        setTexts(careerTexts);
      } catch (error) {
        console.warn('Failed to load career texts:', error);
        // Fallback to English
        setTexts(careerEN);
      } finally {
        setLoading(false);
      }
    };

    loadTexts();
  }, []);

  const scrollToApplySection = () => {
    const applySection = document.getElementById('ready-to-join-section');
    if (applySection) {
      applySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading || !texts) {
    return (
      <div className="min-h-screen bg-[#E0F7FA]">
        <SharedHeader 
          variant="app" 
          showBackButton={true}
          backButtonTitle="Quay lại trang trước"
        />
        <div className="flex justify-center items-center h-96">
          <div className="text-lg text-[#374151]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0F7FA]">
      <SharedHeader 
        variant="app" 
        showBackButton={true}
        backButtonTitle="Quay lại trang trước"
      />
      
      <main className="flex-1 flex justify-center px-4 sm:px-6 lg:px-10 py-12">
        <div className="w-full max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              {texts.pageTitle}
            </h1>
            <p className="text-xl text-[#374151] max-w-3xl mx-auto mb-8">
              {texts.pageSubtitle}
            </p>
          </div>

          {/* Mission Banner */}
          <div className="bg-white rounded-lg p-8 mb-12 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
            <p className="text-lg text-[#374151] leading-relaxed text-center">
              {texts.missionText}
            </p>
          </div>

          {/* Open Positions */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#111827] mb-6">{texts.openPositionsTitle}</h2>
            
            {/* Position 1: Growth Hacker/Content Marketer */}
            <div className="bg-white rounded-lg p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                {texts.positions.growthHacker.title}
              </h3>
              <p className="text-[#374151] mb-6 text-lg">
                {texts.positions.growthHacker.description}
              </p>
              <div className="space-y-3 mb-6">
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.skills}</strong> {texts.positions.growthHacker.skills}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.experience}</strong> {texts.positions.growthHacker.experience}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.mindset}</strong> {texts.positions.growthHacker.mindset}
                </p>
              </div>
              <button 
                onClick={scrollToApplySection}
                className="bg-[#0277BD] hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {texts.labels.applyNow}
              </button>
            </div>

            {/* Position 2: Software Engineer */}
            <div className="bg-white rounded-lg p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                {texts.positions.softwareEngineer.title}
              </h3>
              <p className="text-[#374151] mb-6 text-lg">
                {texts.positions.softwareEngineer.description}
              </p>
              <div className="space-y-3 mb-6">
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.skills}</strong> {texts.positions.softwareEngineer.skills}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.experience}</strong> {texts.positions.softwareEngineer.experience}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.mindset}</strong> {texts.positions.softwareEngineer.mindset}
                </p>
              </div>
              <button 
                onClick={scrollToApplySection}
                className="bg-[#0277BD] hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {texts.labels.applyNow}
              </button>
            </div>

            {/* Position 3: Business Developer/Sales */}
            <div className="bg-white rounded-lg p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
              <h3 className="text-2xl font-bold text-[#111827] mb-4">
                {texts.positions.businessDeveloper.title}
              </h3>
              <p className="text-[#374151] mb-6 text-lg">
                {texts.positions.businessDeveloper.description}
              </p>
              <div className="space-y-3 mb-6">
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.skills}</strong> {texts.positions.businessDeveloper.skills}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.experience}</strong> {texts.positions.businessDeveloper.experience}
                </p>
                <p className="text-[#374151]">
                  <strong className="text-[#111827]">{texts.labels.mindset}</strong> {texts.positions.businessDeveloper.mindset}
                </p>
              </div>
              <button 
                onClick={scrollToApplySection}
                className="bg-[#0277BD] hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {texts.labels.applyNow}
              </button>
            </div>
          </div>

          {/* Why Join Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-[#111827] mb-8 text-center">{texts.whyJoinTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              
              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.impactAtScale.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.impactAtScale.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">🔥</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.thinkDifferently.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.thinkDifferently.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.thinkBold.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.thinkBold.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.velocity.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.velocity.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">📢</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.silentFailure.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.silentFailure.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.shipToLearn.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.shipToLearn.description}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.063)] md:col-span-2">
                <div className="text-4xl mb-4">💨</div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{texts.whyJoin.failFast.title}</h3>
                <p className="text-[#374151]">
                  {texts.whyJoin.failFast.description}
                </p>
              </div>
            </div>
          </div>

          {/* Application Section */}
          <div id="ready-to-join-section" className="mt-16 bg-white rounded-lg p-8 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.063)]">
            <h2 className="text-3xl font-bold text-[#111827] mb-6">
              {texts.readyToJoinTitle}
            </h2>
            <p className="text-lg text-[#374151] mb-6">
              <strong className="font-bold">{texts.application.sendCvText}</strong>
            </p>
            <div className="mb-6">
              <a 
                href={`mailto:${texts.application.email}`} 
                className="inline-block bg-[#0277BD] hover:bg-blue-700 text-white font-bold text-xl py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📧 {texts.application.email}
              </a>
            </div>
            <div className="bg-[#E0F7FA] rounded-lg p-6 border border-[#B2EBF2] mb-6">
              <p className="text-[#374151]">
                <strong>💡 {texts.application.proTip}</strong>
              </p>
            </div>
            <p className="text-lg text-[#374151] font-medium">
              {texts.application.closingText}{' '}
              <span className="text-[#0277BD] font-bold">{texts.application.closingCta}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
