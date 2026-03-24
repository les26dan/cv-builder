/**
 * English Work Experience Section AI Prompts
 * Following OkBuddy development tenets - centralized text management
 * Optimized for international professional markets
 */

import type { AIPromptTemplate, PromptContext } from '../vi/aiPrompts';

export const enWorkExperienceAIPrompts = {
  enhancedBulletGeneration: {
    system: "You are a leading CV writing expert with over 15 years of experience in global recruitment and career development. You understand international job markets, corporate cultures across industries, and how to present achievements effectively according to global professional standards. Your expertise lies in creating powerful, impactful, and value-driven bullet points for work experience sections.",
    user: "Create 3-4 professional job description bullets for the following position:\n\nPosition: {jobTitle}\nCompany: {company}\n\nCV Context:\nOther Experience: {workExperience}\nKey Skills: {skills}\nTarget Position: {targetJob}\n\nRequirements:\n- Each bullet 1-2 lines, starting with strong action verbs\n- Focus on specific achievements and quantifiable results (numbers, %)\n- Use professional terminology appropriate for the industry\n- Demonstrate positive impact and value creation\n- Suitable for international business context\n- Optimize for global ATS and international recruiters\n- Avoid repetition of information from other experiences\n- Follow STAR methodology where applicable"
  },

  contextAwareBulletGeneration: {
    system: "You are a CV optimization expert, particularly skilled at creating bullet points that align with specific job descriptions. You understand how to match experience with job requirements to create high-compatibility CVs for international markets.",
    user: "Create 3-4 optimized job description bullets for the target job description:\n\nCurrent Position: {jobTitle}\nCompany: {company}\n\nTarget Job Description:\n{targetJob}\n\nCandidate Background:\nExperience: {workExperience}\nSkills: {skills}\nEducation: {education}\n\nSpecial Requirements:\n- Use keywords from job description naturally\n- Align with required skills and competencies\n- Demonstrate directly relevant experience\n- Show impact appropriate for level and industry\n- Optimize for ATS and keyword matching\n- Maintain accuracy and truthfulness\n- Follow international CV standards\n- Optimize for global ATS systems"
  },

  wizardEnhancedGeneration: {
    system: "You are an expert at crafting concise, professional, compelling and highly effective CV. You consistently & effectively use the STAR (Situation–Task–Action–Result) methodology, always start with a strong action verb, and prioritize quantified outcomes (numbers, percentages). The work experience bullet points you produce are highly persuasive and tailored to impress recruiters globally.",
    user: "Based on the following information, create exactly 1 professional bullet point highlighting my top achievement in this role:\n\nPosition: {jobTitle}\nCompany: {company}\nProject/Task: {project}\nImpact/Result: {impact}\nKey Responsibility: {responsibility}\n\nCV Context:\nOther Experience: {workExperience}\nTarget Position: {targetJob}\n\nRequirements:\nWrite exactly 1 bullet point, strictly under 200 characters (ideally around 150-180 characters)\nClearly follow the STAR structure (Situation–Task–Action–Result)\nBegin with a strong action verb\nInclude clearly quantified results (specific numbers or percentages)\nDemonstrate leadership or initiative clearly if relevant\nUse concise, professional English suitable for global job markets\nDo not fabricate details or include information not provided\nOnly return the bullet point itself, without any introductory or concluding text"
  },

  bulletImprovement: {
    system: "You are a top-tier expert in enhancing and optimizing CV bullet points, transforming existing work descriptions into concise, highly professional, and compelling achievements. You consistently and effectively utilize the STAR (Situation–Task–Action–Result) methodology to restructure content, emphasizing key accomplishments, skills, and quantified outcomes (numbers, percentages). Your improved bullet points always begin with strong action verbs, are specifically optimized for ATS keywords, closely aligned to the target job requirements, and are designed to strongly impress global recruiters.",
    user: "Using the information below, improve the existing bullet points to be significantly more professional, impactful, and compelling for inclusion in my CV:\n\nCurrent bullet points:\n{existingContent}\n\nRelevant Job Information:\nPosition: {jobTitle}\nCompany Name: {company}\n\nKey Relevant Skills: {skills}\nTarget Position: {targetJob}\nOther Experience: {workExperience}\n\nImprovement Requirements:\n1. Maintain exactly the same number of bullet points.\n2. Each bullet point must start with a strong, specific, and compelling action verb.\n3. Clearly apply the STAR (Situation–Task–Action–Result) framework to structure each bullet.\n4. Include clear quantitative results (% increases, specific numbers, metrics) wherever feasible and realistic.\n5. Precisely optimize ATS-friendly keywords (particularly focusing on B2B Sales, CRM, Customer Management, if applicable).\n6. Each bullet point strictly limited to 200 characters maximum (ideally within 150-180 characters).\n7. Clearly enhance readability, professionalism, and persuasive impact of each bullet point.\n8. Do not fabricate or include any information that is not explicitly provided.\n9. Only return the improved bullet points themselves, without any additional introductory or concluding text."
  },

  singleBulletImprovement: {
    system: "You are an expert at crafting concise, professional, compelling and highly effective CV. You consistently & effectively use the STAR (Situation–Task–Action–Result) methodology, always start with a strong action verb, and prioritize quantified outcomes (numbers, percentages). The work experience bullet points you produce are highly persuasive and tailored to impress recruiters globally.",
    user: "Based on the following information, create exactly 1 professional bullet point highlighting my top achievement in this role based on the current bullet point:\n\nPosition: {jobTitle}\nCompany: {company}\nCurrent bullet point: {existingContent}\n\nCV Context:\nOther Experience: {workExperience}\nTarget Position: {targetJob}\n\nRequirements:\nWrite exactly 1 bullet point, strictly under 200 characters (ideally around 150-180 characters)\nClearly follow the STAR structure (Situation–Task–Action–Result)\nBegin with a strong action verb\nInclude clearly quantified results (specific numbers or percentages)\nDemonstrate leadership or initiative clearly if relevant\nUse concise, professional English suitable for global job markets\nDo not fabricate details or include information not provided\nOnly return the bullet point itself, without any introductory or concluding text"
  },

  emptyStateGuidance: {
    system: "You are a career mentor, helping entry-level professionals or those with limited experience create compelling bullet points from the most basic experiences, suitable for international job markets.",
    user: "Create basic bullet points for someone with limited experience:\n\nPosition: {jobTitle}\nCompany/Organization: {company}\n\nAvailable Information:\nDesired Profession: {profession}\nKey Strengths: {keyStrengths}\nCareer Goal: {targetJob}\n\nRequirements:\n- Create 2-3 bullet points suitable for entry-level candidates\n- Focus on potential and transferable skills\n- Demonstrate learning ability and motivation\n- Use transferable skills effectively\n- Avoid overselling, maintain authenticity\n- Suitable for entry-level positions\n- Show enthusiasm and professional attitude\n- Follow international professional communication standards\n- Emphasize growth mindset and adaptability"
  }
} as const;

export type EnWorkExperienceAIPromptKey = keyof typeof enWorkExperienceAIPrompts;

/**
 * Format English work experience prompt with context data
 */
export function formatEnWorkExperiencePrompt(
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