'use client';

import Header from '../components/Header';
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
      <Header />
      <HeroSection />
      <SectionDivider activeIndex={0} />
      <ProblemATS />
      <SectionDivider activeIndex={1} />
      <ProblemKeywords />
      <SectionDivider activeIndex={2} />
      <ProblemMassCV />
      <ProblemCoverLetters />
      <SectionDivider activeIndex={0} />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
