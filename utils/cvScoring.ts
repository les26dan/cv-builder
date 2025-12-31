interface CVData {
  contact: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  summary: {
    content: string;
  };
  experience: {
    items: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      startDate: string;
      endDate: string;
      current: boolean;
      bullets: string[];
    }>;
  };
  skills: {
    items: string[];
  };
  education: {
    items: Array<{
      id: string;
      degree: string;
      institution: string;
      location: string;
      graduationDate: string;
      description?: string;
    }>;
  };
  aiUsage?: {
    [sectionId: string]: boolean;
  };
}

export function calculateCvScore(cvData: CVData): number {
  const sections = [
    { id: 'contact', weight: 20, scorer: scoreContactSection },
    { id: 'summary', weight: 20, scorer: scoreSummarySection },
    { id: 'experience', weight: 20, scorer: scoreExperienceSection },
    { id: 'skills', weight: 20, scorer: scoreSkillsSection },
    { id: 'education', weight: 20, scorer: scoreEducationSection },
  ];

  let totalScore = 0;
  const maxManualScore = 80; // Manual completion caps at 80%
  
  for (const section of sections) {
    const sectionScore = section.scorer(cvData);
    const sectionContribution = (sectionScore * section.weight) / 100;
    
    // Apply manual cap
    const cappedContribution = (sectionContribution * maxManualScore) / 100;
    totalScore += cappedContribution;
  }

  // AI bonus: if any section used AI, allow up to 100%
  const hasAIUsage = cvData.aiUsage && Object.values(cvData.aiUsage).some(used => used);
  
  if (hasAIUsage && totalScore >= maxManualScore) {
    // Calculate how much AI usage unlocks additional score
    const aiSections = cvData.aiUsage ? Object.values(cvData.aiUsage).filter(used => used).length : 0;
    const totalSections = sections.length;
    const aiBonus = (aiSections / totalSections) * 20; // Up to 20% bonus
    
    totalScore = Math.min(100, maxManualScore + aiBonus);
  }

  return Math.round(totalScore);
}

function scoreContactSection(cvData: CVData): number {
  const contact = cvData.contact;
  const requiredFields = ['fullName', 'email', 'phone', 'location'];
  
  let filledFields = 0;
  requiredFields.forEach(field => {
    const value = contact[field as keyof typeof contact];
    if (value && typeof value === 'string' && value.trim()) {
      filledFields++;
    }
  });

  return (filledFields / requiredFields.length) * 100;
}

function scoreSummarySection(cvData: CVData): number {
  const summary = cvData.summary.content;
  if (!summary || !summary.trim()) return 0;
  
  // Basic scoring based on content length and quality
  const wordCount = summary.trim().split(/\s+/).length;
  if (wordCount < 10) return 30; // Too short
  if (wordCount >= 50 && wordCount <= 150) return 100; // Ideal length
  if (wordCount > 150) return 80; // Too long
  return 70; // Decent length
}

function scoreExperienceSection(cvData: CVData): number {
  const items = cvData.experience.items;
  if (!items || items.length === 0) return 0;

  let totalScore = 0;
  for (const item of items) {
    let itemScore = 0;
    
    // Title and company are essential
    if (item.title && item.title.trim()) itemScore += 25;
    if (item.company && item.company.trim()) itemScore += 25;
    
    // Dates
    if (item.startDate && item.startDate.trim()) itemScore += 20;
    if (item.current || (item.endDate && item.endDate.trim())) itemScore += 10;
    
    // Bullets/achievements
    const validBullets = item.bullets.filter(b => b && b.trim());
    if (validBullets.length >= 2) itemScore += 20;
    else if (validBullets.length === 1) itemScore += 10;
    
    totalScore += itemScore;
  }

  return Math.min(100, totalScore / items.length);
}

function scoreSkillsSection(cvData: CVData): number {
  const skills = cvData.skills.items;
  if (!skills || skills.length === 0) return 0;
  
  const validSkills = skills.filter(skill => skill && skill.trim());
  if (validSkills.length >= 5) return 100;
  if (validSkills.length >= 3) return 80;
  if (validSkills.length >= 1) return 60;
  return 0;
}

function scoreEducationSection(cvData: CVData): number {
  const items = cvData.education.items;
  if (!items || items.length === 0) return 0;

  let totalScore = 0;
  for (const item of items) {
    let itemScore = 0;
    
    if (item.degree && item.degree.trim()) itemScore += 40;
    if (item.institution && item.institution.trim()) itemScore += 40;
    if (item.graduationDate && item.graduationDate.trim()) itemScore += 20;
    
    totalScore += itemScore;
  }

  return Math.min(100, totalScore / items.length);
} 