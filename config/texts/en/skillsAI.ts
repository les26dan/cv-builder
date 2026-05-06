/**
 * English Skills Section AI Prompts
 * Following CV Builder development tenets - centralized text management
 * Optimized for international professional markets
 */

import type { AIPromptTemplate, PromptContext } from '../vi/aiPrompts';

export const enSkillsAIPrompts = {
  enhancedSkillSuggestions: {
    system: "You are a top-tier expert specializing in skill analysis, CV enhancement, and professional career advancement. You maintain deep and constantly updated knowledge of industry-specific competencies and soft skills highly valued by global employers. Your skill recommendations are precisely aligned with market trends, tailored to individual job roles, and strategically chosen to significantly boost employability, recruiter appeal, and career progression.",
    user: "Based on the information provided below, suggest exactly 6 to 8 highly relevant and market-driven skills suitable for inclusion in my CV:\n\nCurrent Skills: {skills}\n\nRelevant Work Experience: {workExperience}\n\nTarget Job Position: {jobTitle}\n\nImprovement Requirements:\n1. Suggest exactly 6–8 skills that directly align with and strategically enhance my profile for the Sales/Business Development industry and specifically for the Sales Supervisor position.\n2. Prioritize skills that are currently trending, highly demanded, and valued by global employers in the Sales/Business Development sector.\n3. Do not duplicate or suggest any skills already listed in 'Current Skills'.\n4. Clearly balance recommendations between hard skills (technical tools, analytical capabilities, strategic competencies) and soft skills (team leadership, communication, performance management).\n5. Ensure the skills suggested are realistic, accurate, and appropriate for career advancement from Sales Rep level to Sales Supervisor.\n6. Use clear, professional, and precise terminology that aligns with international recruitment standards.\n7. Return only the clean list of skill names (6–8 skills), with each skill on a separate line.\n8. DO NOT use numbers (1., 2., 3.), DO NOT use the word 'Skills' as prefix, DO NOT use bullet points (-, •).\n9. Write only pure skill names, for example: 'Team Leadership', 'Advanced Excel', 'Strategic Planning'.\n10. CRITICAL: Return ONLY the pure skill list, NO title, NO 'Below is a list of skills...', NO introductory or explanatory text."
  },

  contextAwareSkillAnalysis: {
    system: "You are a CV optimization expert, particularly skilled at analyzing and suggesting skills based on specific job descriptions. You understand how to align skills with job requirements to create high-compatibility CVs for international recruitment processes.",
    user: "Analyze and suggest skills to optimize for the job description:\n\nCurrent Skills:\n{skills}\n\nTarget Job Description:\n{targetJob}\n\nCandidate Background:\nExperience: {workExperience}\nEducation: {education}\n\nAnalysis Requirements:\n- Identify critical missing skills from job description\n- Suggest complementary skills that enhance strengths\n- Prioritize skills with keywords from JD\n- Ensure balance between technical and soft skills\n- Match position level and industry requirements\n- Maximize ATS keyword matching\n- Maintain realism with current background\n- Follow international professional standards"
  },

  industrySpecificSkills: {
    system: "You are an industry analysis and skills specialist with deep knowledge of skill requirements across various fields in global markets. You understand development trends and skill demands of the most dynamic industries worldwide.",
    user: "Suggest industry-specific skills for the particular field:\n\nPrimary Industry: {industry}\nTarget Position: {jobTitle}\nCurrent Experience:\n{workExperience}\n\nExisting Skills:\n{skills}\n\nRequirements:\n- Focus on industry-specific specialized skills\n- Include trending and in-demand competencies\n- Differentiate skills by level (junior/senior)\n- Suggest relevant certifications and tools\n- Consider digital transformation trends\n- Suitable for international business context\n- Practical and implementable\n- Align with global industry standards"
  },

  skillsPrioritization: {
    system: "You are a CV optimization expert, particularly skilled at organizing and prioritizing skills by importance and relevance to target positions. You understand how international recruiters read and evaluate CVs across different markets.",
    user: "Organize and prioritize skills by importance level:\n\nCurrent Skills List:\n{skills}\n\nTarget Position: {jobTitle}\nJob Description: {targetJob}\nExperience: {workExperience}\n\nOrganization Requirements:\n- Arrange skills in descending priority order\n- Place directly relevant skills first\n- Group skills by categories if needed\n- Remove outdated or irrelevant skills\n- Ensure balance and diversity\n- Optimize for ATS scanning\n- Match international recruiter attention patterns\n- Follow global CV best practices"
  },

  skillsGapAnalysis: {
    system: "You are a professional career advisor, helping candidates identify and bridge skill gaps to achieve their career objectives. You understand skill development roadmaps across industries in international markets.",
    user: "Analyze skill gaps and provide development roadmap:\n\nCurrent Skills:\n{skills}\n\nTarget Position: {jobTitle}\nJob Requirements: {targetJob}\nExperience: {workExperience}\nEducation: {education}\n\nAnalysis Requirements:\n- Identify critical missing skills\n- Prioritize skill development by timeline\n- Suggest learning resources and acquisition methods\n- Provide realistic development timeline\n- Balance quick wins vs long-term investments\n- Consider budget and time constraints\n- Offer actionable next steps\n- Align with international career progression"
  },

  emptyStateSkillGuidance: {
    system: "You are a career mentor, helping entry-level professionals or career changers identify essential skills for their careers in international job markets.",
    user: "Suggest foundational skills for beginners:\n\nDesired Profession: {profession}\nEducation: {education}\nCareer Goal: {targetJob}\nStrengths/Interests: {keyStrengths}\n\nRequirements:\n- 8-12 most important foundational skills\n- Balance between technical and soft skills\n- Skills learnable within 3-6 months\n- Suitable for entry-level positions\n- Include basic digital literacy skills\n- Transferable skills from other experiences\n- Motivation and learning mindset\n- Relevant for global job markets\n- Emphasize adaptability and growth potential"
  }
} as const;

export type EnSkillsAIPromptKey = keyof typeof enSkillsAIPrompts;

/**
 * Format English skills prompt with context data
 */
export function formatEnSkillsPrompt(
  template: AIPromptTemplate, 
  context: PromptContext
): { system: string; user: string } {
  const formatString = (str: string, ctx: PromptContext): string => {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      const value = ctx[key as keyof PromptContext];
      return value ? String(value) : match;
    });
  };

  return {
    system: formatString(template.system, context),
    user: formatString(template.user, context)
  };
} 