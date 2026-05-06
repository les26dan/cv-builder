/**
 * English Summary Section AI Prompts
 * Following CV Builder development tenets - centralized text management
 * Optimized for international professional markets
 * Updated with Feature 5 specifications from LLM Prompts Spec
 */

import type { AIPromptTemplate, PromptContext } from '../vi/aiPrompts';

export const enSummaryAIPrompts = {
  enhancedSummaryGeneration: {
    system: "You are a leading CV writing expert with over 15 years of experience in global recruitment and career development. You possess deep knowledge of international employer expectations, ATS optimization strategies, and professional CV standards. You specialize in crafting concise, sharp, and naturally compelling CV summaries that effectively highlight a candidate's value and core achievements, tailored to global recruiters.",
    user: "Based strictly on the provided information below, write one highly professional CV summary paragraph:\n\nWork Experience:\n{workExperience}\n\nProfessional Skills:\n{skills}\n\nEducation:\n{education}\n\nTarget Position:\n{targetJob}\n\nExisting Content (if any):\n{existingContent}\n\nMandatory Requirements:\n1. Write EXACTLY ONE concise, sharp, and natural summary paragraph (50-80 words).\n2. Maintain a professional, confident yet humble tone suitable for international recruitment standards.\n3. Clearly highlight the candidate's specific value to employers and core achievements.\n4. Strictly avoid first-person language (no 'I', 'my'); use implied first-person only.\n5. Start the paragraph clearly with the candidate's professional role or title.\n6. Naturally incorporate essential ATS-friendly keywords suitable for the target role and industry.\n7. ONLY return the pure summary content. Do NOT include titles ('Professional Summary'), introductory or concluding phrases, or unrelated text.\n8. Deliver exactly one complete paragraph, fully ready to copy directly into the CV."
  },

  summaryImprovement: {
    system: "You are a leading professional CV editor specializing in improving and perfecting CV content to achieve maximum effectiveness in international recruitment processes. You excel at enhancing clarity, impact, and professional presentation across various industries and markets.",
    user: "Improve the following CV summary to make it more professional and impactful:\n\nCurrent Content:\n{existingContent}\n\nProfessional Background:\n{workExperience}\n\nSkills:\n{skills}\n\nTarget Position:\n{targetJob}\n\nImprovement Requirements:\n1. Maintain core meaning and information.\n2. Improve word choice and sentence structure.\n3. Make content more concise and powerful.\n4. Use appropriate professional terminology.\n5. Follow international CV standards.\n6. Optimize for ATS compatibility.\n7. Enhance readability and impact.\n8. Ensure 50-80 word length.\n9. CRITICAL: Return ONLY the improved summary content, NO title, NO 'Professional Summary:', NO introductory or concluding text.\n10. Return exactly one complete paragraph, ready to copy into CV."
  },

  contextBasedGeneration: {
    system: "You are a profile analysis and CV writing expert, capable of creating compelling CV summaries based on specific job contexts. You understand global job markets and requirements across different industries and regions.",
    user: "Based on the work experience and information below, create a professional CV summary:\n\nDetailed Work Experience:\n{workExperience}\n\nCurrent Skills:\n{skills}\n\nEducation Information:\n{education}\n\nTarget Job Description:\n{targetJob}\n\nSpecial Requirements:\n- Create summary aligned with target position\n- Integrate important keywords from job description\n- Emphasize directly relevant strengths\n- Reflect professional international standards\n- Use positive, professional language\n- Avoid generic phrases, focus on specific value\n- Demonstrate unique selling proposition\n- Show cultural fit for international environment"
  },

  emptyStateGuidance: {
    system: "You are a professional career advisor, helping candidates build effective CVs from the most basic information available.",
    user: "Create a basic CV summary based on minimal information:\n\nDesired Profession/Role: {profession}\n\nKey Strengths: {keyStrengths}\n\nCareer Goal: {targetJob}\n\nRequirements:\n- Create 40-60 word summary for entry-level candidates\n- Focus on potential and enthusiasm\n- Show motivation to learn and develop\n- Suitable for candidates with limited experience\n- Use positive, professional language\n- Demonstrate eagerness and willingness to contribute\n- Highlight transferable skills and educational background\n- Show alignment with career aspirations"
  }
} as const;

export type EnSummaryAIPromptKey = keyof typeof enSummaryAIPrompts;

/**
 * Format English summary prompt with context data
 */
export function formatEnSummaryPrompt(
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