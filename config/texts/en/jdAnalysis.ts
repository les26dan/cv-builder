/**
 * JD Analysis Text Configuration
 * Centralized strings for JD Analysis and CV Optimization features
 * Following tenet #9: All UI strings must be centralized
 */

export const jdAnalysisTexts = {
  // Section Headers
  sectionTitle: 'JD Analysis & Optimization',
  sectionSubtitle: 'Optimize CV based on target job description',
  
  // Input Labels
  jobDescriptionLabel: 'Target job description',
  jobDescriptionPlaceholder: 'Paste job description here to get AI-powered suggestions for optimizing your CV...',
  
  // Buttons
  analyzeButton: 'Analyze JD',
  analyzingButton: 'Analyzing...',
  reAnalyzeButton: '🔄 Re-analyze',
  applyButton: 'Apply',
  applyAllButton: 'Apply All',
  applyAllButtonPro: 'Apply All',
  proLabel: 'PRO',
  
  // Progress Indicators
  progressLabel: 'Optimization progress',
  progressApplying: (current: number, total: number) => `Applying (${current}/${total})`,
  progressApplied: (current: number, total: number) => `${current}/${total} suggestions applied`,
  suggestionsCount: (count: number) => `${count} total suggestions`,
  sectionSuggestions: (count: number) => `${count} suggestions`,
  
  // AI Suggestions
  aiSuggestionsTitle: 'AI Optimization Suggestions',
  aiSuggestionsSubtitle: 'Improve your CV based on JD analysis',
  suggestionsPrompt: 'Apply all suggestions to optimize your CV',
  suggestionsBySection: 'Suggestions by section',
  
  // Section Names
  sectionNames: {
    summary: 'Profile Summary',
    experience: 'Work Experience',
    skills: 'Skills',
    education: 'Education',
    other: 'Other'
  },
  
  // Section Icons (emojis)
  sectionIcons: {
    summary: '👤',
    experience: '💼',
    skills: '🛠️',
    education: '🎓',
    other: '📝'
  },
  
  // Priority Labels
  priorityLabels: {
    high: 'Important',
    medium: 'Medium',
    low: 'Low'
  },
  
  // Missing Keywords
  missingKeywordsTitle: 'Important missing keywords',
  keywordMoreCount: (count: number) => `+${count} more`,
  
  // Apply suggestions
  
  // Error Messages
  errors: {
    emptyJobDescription: 'Please enter job description to analyze',
    jobDescriptionTooLong: 'Job description too long (max 3000 characters)',
    analysisGeneral: 'An error occurred while analyzing JD. Please try again.',
    applyAllGeneral: 'An error occurred while applying suggestions. Please try again.'
  },
  
  // Character Count
  characterCount: (current: number, max: number) => `${current}/${max}`,
  
  // Boost Indicators
  scoreBoost: (boost: number) => `+${boost}%`,
  
  // Loading States
  loadingStates: {
    analyzing: 'Analyzing...',
    applying: 'Applying...',
    applyingProgress: (current: number, total: number) => `Apply all (${current}/${total})`
  },
  
  // Monetization
  monetization: {
    premiumOnly: 'Premium',
    upgradeRequired: 'Upgrade to use',
    creditsRemaining: (count: number) => `${count} uses remaining`,
    noCreditsLeft: 'No uses left',
    useCredit: 'Use 1 credit',
    applyAllPremium: 'Apply all (Premium)',
    premiumFeature: 'Premium Feature',
    limitedAccess: 'Limited access for free plan',
    upgradeModal: {
      title: 'Upgrade to Premium',
      subtitle: 'Unlock advanced features to optimize CV more effectively',
      upgradeNow: 'Upgrade Now',
      later: 'Later'
    }
  }
} as const;

export type JDAnalysisTexts = typeof jdAnalysisTexts; 