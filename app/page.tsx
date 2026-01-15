'use client';

import SharedHeader from '../components/SharedHeader';
import HeroSection from '../components/HeroSection';
import SectionDivider from '../components/SectionDivider';
import ProblemATS from '../components/ProblemATS';
import ProblemKeywords from '../components/ProblemKeywords';
import ProblemMassCV from '../components/ProblemMassCV';
import ProblemCoverLetters from '../components/ProblemCoverLetters';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SharedHeader variant="landing" />
      <HeroSection />
      <SectionDivider activeIndex={0} />
      <ProblemATS />
      <SectionDivider activeIndex={1} />
      <ProblemKeywords />
      <SectionDivider activeIndex={2} />
      <ProblemMassCV />
      {/* ProblemCoverLetters section hidden per UI polish requirements */}
      <div style={{ display: 'none' }}>
        <ProblemCoverLetters />
      </div>
      <SectionDivider activeIndex={0} />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
