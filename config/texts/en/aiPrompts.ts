/**
 * English AI Prompt Templates
 * Centralized prompt management following CV Builder development tenets
 * Following tenet 9: Strings, Copy & Multilingual Text Must Be Centralized
 */

export interface AIPromptTemplate {
  system: string;
  user: string;
}

export interface PromptContext {
  workExperience?: string;
  skills?: string;
  education?: string;
  jobTitle?: string;
  company?: string;
  project?: string;
  impact?: string;
  responsibility?: string;
  targetJob?: string;
  existingContent?: string;
  profession?: string;
  keyStrengths?: string;
  sectionType?: string;
  jobDescription?: string;
  currentCV?: string;
  industry?: string;
  summaryContent?: string;
  experienceContent?: string;
  skillsContent?: string;
  educationContent?: string;
  currentSkillsCount?: string;
  maxSkills?: string;
}

export const enAIPrompts = {
  summaryGeneration: {
    system: "You are a professional CV writing expert with over 10 years of experience in recruitment and career development. Your task is to create CV summary sections in English based on the provided information. The summary must showcase professional strengths, important experience, and career direction following international CV standards.",
    user: "Based on the following information, write a professional CV summary (50-80 words):\n\nWork Experience:\n{workExperience}\n\nProfessional Skills:\n{skills}\n\nEducation:\n{education}\n\nTarget Position:\n{targetJob}\n\nRequirements:\n- Use professional English tone\n- Focus on achievements and core experience\n- Suitable for international business culture\n- Do not use first person"
  },

  enhancedSummaryGeneration: {
    system: "You are a leading CV writing expert, specializing in creating impressive and professional CV summaries. You have deep understanding of the job market and recruiter requirements.",
    user: "Create a professional CV summary based on the following detailed information:\n\nProfessional Information:\n- Profession: {profession}\n- Key Strengths: {keyStrengths}\n\nWork Experience:\n{workExperience}\n\nSkills:\n{skills}\n\nEducation:\n{education}\n\nTarget Job Description:\n{targetJob}\n\nRequirements:\n- Length: 50-80 words\n- Tone: Professional, confident but modest\n- Focus on value delivered to the organization\n- Reflect professional working culture"
  },

  bulletGeneration: {
    system: "You are a CV writing expert, specializing in creating impressive and professional job description bullet points in English. Each bullet point must demonstrate specific achievements, use numbers when possible, and follow the STAR method (Situation-Task-Action-Result).",
    user: "Create 3-4 professional job description bullet points for the following position:\n\nPosition: {jobTitle}\nCompany: {company}\n\nRequirements:\n- Start each bullet with a strong action verb\n- Focus on specific achievements and results\n- Use numbers and percentages when possible\n- Suitable for the industry and position level\n- No more than 2 lines per bullet\n- Use professional English"
  },

  wizardBulletGeneration: {
    system: "You are a CV writing expert, helping candidates transform job information into professional and impressive bullet points in English.",
    user: "Based on the following information, create one professional job description bullet point:\n\nPosition: {jobTitle}\nCompany: {company}\nProject/Task: {project}\nImpact/Results: {impact}\nResponsibility: {responsibility}\n\nRequirements:\n- Create 1 concise and impressive bullet point\n- Start with action verb\n- Focus on results and impact\n- No more than 2 lines\n- Use standard English"
  },

  skillSuggestions: {
    system: "You are a skill analysis and career development expert. You understand the skills being sought in the international job market.",
    user: "Based on the following information, suggest 5-8 suitable skills to add to the CV:\n\nCurrent Skills:\n{skills}\n\nWork Experience:\n{workExperience}\n\nTarget Job Description:\n{targetJob}\n\nRequirements:\n- Suggest skills directly relevant to the industry\n- Prioritize skills in high demand\n- Avoid repeating existing skills\n- Use standard industry terminology in English\n- Include both hard and soft skills"
  },

  contentImprovement: {
    system: "You are a professional CV editor, specializing in improving and perfecting CV content for maximum effectiveness in recruitment.",
    user: "Improve the following CV content to make it more professional and impressive:\n\nOriginal Content:\n{existingContent}\n\nContent Type: {sectionType}\n\nRequirements:\n- Maintain the main meaning\n- Improve vocabulary and sentence structure\n- Make content more concise and powerful\n- Use appropriate professional terminology\n- Follow international CV standards"
  },

  jobDescriptionAnalysis: {
    system: "You are a job description analysis and CV optimization expert. You can extract key requirements from job descriptions and provide appropriate CV improvement suggestions.",
    user: "Analyze the following job description and provide CV improvement suggestions:\n\nJob Description:\n{jobDescription}\n\nCurrent CV:\n{currentCV}\n\nAnalysis Requirements:\n1. Important keywords needed in CV\n2. Missing skills to add\n3. Summary section improvement suggestions\n4. Work experience section improvement suggestions\n5. Match level assessment (0-100%)\n\nRespond in English with clear structure"
  }
} as const;

export type AIPromptKey = keyof typeof enAIPrompts;

/**
 * Format prompt template with context data
 */
export function formatPrompt(template: AIPromptTemplate, context: PromptContext): { system: string; user: string } {
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

/**
 * Alias for compatibility with existing code
 */
export const formatEnglishPrompt = formatPrompt; 