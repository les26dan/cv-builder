/**
 * English JD Optimization Text Configuration
 * Following OkBuddy development tenets - centralized text management
 * Optimized for international professional markets
 */

export const enJDOptimizationTexts = {
  // Prerequisite validation
  prerequisite: {
    ctaPrompt: "Want to tailor your CV to a job posting? Paste the job description to get AI suggestions.",
    ctaButton: "Optimize CV for Job",
    incompleteMessage: "Please complete your contact information and at least one work experience entry to use this feature.",
    completeTooltip: "Complete your CV to unlock JD optimization features"
  },

  // JD Input
  input: {
    placeholder: "Paste job description content (max 5000 characters)...",
    label: "Target Job Description",
    charLimit: "characters",
    submitButton: "Analyze & Generate Suggestions",
    viewButton: "View JD",
    removeButton: "Remove JD",
    changeButton: "Change JD"
  },

  // Processing states
  processing: {
    analyzing: "Analyzing job description and scanning your CV for optimizations...",
    generatingSuggestions: "Generating suggestions for each CV section...",
    completed: "Complete! Check the suggestions below."
  },

  // Error messages
  errors: {
    tooShort: "Job description too short. Please provide more details.",
    tooLong: "Job description exceeds 5000 characters. Please shorten.",
    invalid: "Invalid content. Please check and try again.",
    networkError: "Connection error. Please try again later.",
    analysisError: "Unable to analyze JD. Please try again.",
    retryButton: "Retry"
  },

  // Success messages
  success: {
    jdSubmitted: "Job description saved successfully",
    jdRemoved: "Job description removed",
    suggestionsGenerated: "Optimization suggestions generated"
  },

  // Guidance
  guidance: {
    optimalLength: "For best results, job description should be 200-2000 characters",
    includeDetails: "Include: skill requirements, experience, job responsibilities",
    privacyNote: "JD information is only used for suggestions and not stored"
  },

  // Section headers
  sections: {
    summary: "AI Suggestions for Resume Summary",
    workExperience: "AI Suggestions for Work Experience",
    skills: "AI Suggestions for Skills",
    education: "AI Suggestions for Education",
    noSuggestions: "No suggestions for this section"
  },

  // Apply actions
  apply: {
    individualButton: "Apply",
    allButton: "Apply All",
    applied: "Applied",
    applying: "Applying...",
    failed: "Apply Failed"
  }
} as const;

export type EnJDOptimizationTextKey = keyof typeof enJDOptimizationTexts; 