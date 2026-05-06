/**
 * Dynamic Text Loading System
 * Loads text based on language configuration with Vietnamese as default
 * Following CV Builder development tenets: centralized, configurable, scalable
 */

import { detectLanguage, type SupportedLanguage } from '../languageConfig';

// Text imports with proper fallbacks
const textModules = {
  en: {
    landingPage: () => import('./en/landingPage').then(m => m.landingPage),
    account: () => import('./en/account').then(m => m.account),
    workspace: () => import('./en/workspace').then(m => m.workspace),
    cvUpload: () => import('./en/cvUpload').then(m => m.cvUpload),
    cvEditor: () => import('./en/cvEditor').then(m => m.cvEditor),
    userDrawer: () => import('./en/userDrawer').then(m => m.userDrawer),
    feedback: () => import('./en/feedback').then(m => m.feedback),
    jdAnalysis: () => import('./en/jdAnalysis').then(m => m.jdAnalysisTexts),
    jdOptimization: () => import('./en/jdOptimization').then(m => m.enJDOptimizationTexts),
    workExperienceWizard: () => import('./en/workExperienceWizard').then(m => m.default),
    aiPrompts: () => import('./en/aiPrompts').then(m => m.enAIPrompts),
  },
  vi: {
    landingPage: () => import('./vi/landingPage').then(m => m.landingPage),
    account: () => import('./vi/account').then(m => m.account),
    workspace: () => import('./vi/workspace').then(m => m.workspace),
    cvUpload: () => import('./vi/cvUpload').then(m => m.cvUpload),
    cvEditor: () => import('./vi/cvEditor').then(m => m.cvEditor),
    userDrawer: () => import('./vi/userDrawer').then(m => m.userDrawer),
    feedback: () => import('./vi/feedback').then(m => m.feedback),
    jdAnalysis: () => import('./vi/jdAnalysis').then(m => m.jdAnalysisTexts),
    jdOptimization: () => import('./vi/jdOptimization').then(m => m.viJDOptimizationTexts),
    workExperienceWizard: () => import('./vi/workExperienceWizard').then(m => m.default),
    aiPrompts: () => import('./vi/aiPrompts').then(m => m.viAIPrompts),
  }
};

// Text cache to avoid repeated imports
const textCache = new Map<string, any>();

/**
 * Get text configuration for specific language and module
 */
export async function getTexts(
  module: keyof typeof textModules.en,
  language?: SupportedLanguage,
  context?: any
): Promise<any> {
  // Determine effective language
  const effectiveLanguage = language || detectLanguage(context).language;
  const cacheKey = `${effectiveLanguage}-${module}`;
  
  // Return cached version if available
  if (textCache.has(cacheKey)) {
    return textCache.get(cacheKey);
  }
  
  try {
    // Try to load the requested language
    if (textModules[effectiveLanguage] && textModules[effectiveLanguage][module]) {
      const texts = await textModules[effectiveLanguage][module]();
      textCache.set(cacheKey, texts);
      return texts;
    }
    
    // Fallback to Vietnamese if English module not found
    if (effectiveLanguage !== 'vi' && textModules.vi[module]) {
      const texts = await textModules.vi[module]();
      textCache.set(cacheKey, texts);
      return texts;
    }
    
    throw new Error(`Text module not found: ${module} for language: ${effectiveLanguage}`);
  } catch (error) {
    console.warn(`Failed to load text module ${module} for ${effectiveLanguage}:`, error);
    
    // Ultimate fallback - try Vietnamese if we weren't already trying Vietnamese
    if (effectiveLanguage !== 'vi') {
      try {
        const texts = await textModules.vi[module]();
        textCache.set(cacheKey, texts);
        return texts;
      } catch (fallbackError) {
        console.error(`Fallback to Vietnamese also failed for ${module}:`, fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

/**
 * Synchronous text getters for components (uses cached or default values)
 * These are the main exports that components will use
 */

// Default Vietnamese texts (synchronous access)
export { landingPage } from './vi/landingPage';
export { account } from './vi/account';
export { workspace } from './vi/workspace';
export { cvUpload } from './vi/cvUpload';
export { userDrawer } from './vi/userDrawer';
export { feedback } from './vi/feedback';
export { jdAnalysisTexts } from './vi/jdAnalysis';
export { viJDOptimizationTexts as jdOptimization } from './vi/jdOptimization';
export { default as workExperienceWizard } from './vi/workExperienceWizard';
export { viAIPrompts as aiPrompts } from './vi/aiPrompts';
export { mobileBlockingTexts } from './vi/mobileBlocking';

// Legacy export for backward compatibility (English)
export { cvUpload as cvUploadLegacy } from './en/cvUpload';

/**
 * Utility functions for text management
 */
export function clearTextCache(): void {
  textCache.clear();
}

export function getAvailableLanguages(): SupportedLanguage[] {
  return ['en', 'vi'];
}

export function isLanguageSupported(language: string): language is SupportedLanguage {
  return ['en', 'vi'].includes(language as SupportedLanguage);
} 