/**
 * Language Detection Utility
 * Smart language detection for AI prompt selection
 * Following CV Builder development tenets: modular, replaceable, adaptable
 */

export type SupportedLanguage = 'vi' | 'en';

export interface LanguageDetectionContext {
  userProfile?: {
    preferredLanguage?: string;
    locale?: string;
  };
  cvContent?: {
    summary?: string;
    experience?: any[];
    skills?: string[];
  };
  browserLocale?: string;
  manualSelection?: SupportedLanguage;
}

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  source: 'manual' | 'profile' | 'content' | 'browser' | 'default';
  fallback: SupportedLanguage;
}

/**
 * Vietnamese text detection patterns
 */
const VIETNAMESE_PATTERNS = [
  // Vietnamese-specific characters
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
  // Common Vietnamese words
  /\b(và|của|trong|với|từ|cho|để|này|đó|có|được|không|tại|về|theo|đã|sẽ|đang|các|một|những|nhiều|tốt|kinh nghiệm|công ty|dự án|phát triển|quản lý|tham gia|thực hiện|đạt được|chịu trách nhiệm)\b/i,
  // Vietnamese job titles
  /\b(chuyên viên|kỹ sư|quản lý|giám đốc|trưởng phòng|nhân viên|thực tập sinh|lập trình viên|thiết kế|kinh doanh|marketing|tài chính|nhân sự)\b/i
];

/**
 * English text detection patterns
 */
const ENGLISH_PATTERNS = [
  // Common English CV words
  /\b(experience|management|development|project|responsible|achieved|implemented|designed|collaborated|managed|led|created|developed|analyzed|improved|optimized|delivered|coordinated)\b/i,
  // English job titles
  /\b(manager|developer|engineer|analyst|specialist|coordinator|director|supervisor|executive|administrator|consultant|technician|designer|programmer|architect)\b/i,
  // English articles and prepositions
  /\b(the|and|of|in|to|for|with|at|by|from|on|as|is|was|were|are|have|has|had|will|would|should|could)\b/i
];

/**
 * Detect language from text content
 */
export function detectLanguageFromText(text: string): { language: SupportedLanguage; confidence: number } {
  if (!text || text.trim().length === 0) {
    return { language: 'vi', confidence: 0 }; // Default to Vietnamese
  }

  const textLower = text.toLowerCase();
  let viScore = 0;
  let enScore = 0;

  // Check Vietnamese patterns
  for (const pattern of VIETNAMESE_PATTERNS) {
    const matches = textLower.match(pattern);
    if (matches) {
      viScore += matches.length;
    }
  }

  // Check English patterns
  for (const pattern of ENGLISH_PATTERNS) {
    const matches = textLower.match(pattern);
    if (matches) {
      enScore += matches.length;
    }
  }

  // Calculate confidence and determine language
  const totalScore = viScore + enScore;
  if (totalScore === 0) {
    return { language: 'vi', confidence: 0 };
  }

  const viConfidence = viScore / totalScore;
  const enConfidence = enScore / totalScore;

  if (viConfidence > enConfidence) {
    return { language: 'vi', confidence: viConfidence };
  } else {
    return { language: 'en', confidence: enConfidence };
  }
}

/**
 * Detect language from CV content
 */
export function detectLanguageFromCV(cvContent: LanguageDetectionContext['cvContent']): { language: SupportedLanguage; confidence: number } {
  if (!cvContent) {
    return { language: 'vi', confidence: 0 };
  }

  let combinedText = '';

  // Combine summary text
  if (cvContent.summary) {
    combinedText += cvContent.summary + ' ';
  }

  // Combine experience descriptions
  if (cvContent.experience && cvContent.experience.length > 0) {
    cvContent.experience.forEach(exp => {
      if (exp.title) combinedText += exp.title + ' ';
      if (exp.company) combinedText += exp.company + ' ';
      if (exp.description) combinedText += exp.description + ' ';
      if (exp.bullets && Array.isArray(exp.bullets)) {
        combinedText += exp.bullets.join(' ') + ' ';
      }
    });
  }

  // Combine skills
  if (cvContent.skills && cvContent.skills.length > 0) {
    combinedText += cvContent.skills.join(' ') + ' ';
  }

  return detectLanguageFromText(combinedText);
}

/**
 * Parse browser locale to supported language
 */
export function parseLocaleToLanguage(locale: string): SupportedLanguage {
  if (!locale) return 'vi';
  
  const normalizedLocale = locale.toLowerCase();
  
  if (normalizedLocale.startsWith('vi') || normalizedLocale.includes('vietnam')) {
    return 'vi';
  }
  
  if (normalizedLocale.startsWith('en') || normalizedLocale.includes('english')) {
    return 'en';
  }
  
  // Default to Vietnamese for unsupported locales
  return 'vi';
}

/**
 * Main language detection function
 * Priority: Manual Selection > User Profile > CV Content > Browser Locale > Default (Vietnamese)
 */
export function detectLanguage(context: LanguageDetectionContext): LanguageDetectionResult {
  // 1. Manual selection has highest priority
  if (context.manualSelection) {
    return {
      detectedLanguage: context.manualSelection,
      confidence: 1.0,
      source: 'manual',
      fallback: 'vi'
    };
  }

  // 2. User profile preference
  if (context.userProfile?.preferredLanguage) {
    const profileLang = parseLocaleToLanguage(context.userProfile.preferredLanguage);
    return {
      detectedLanguage: profileLang,
      confidence: 0.9,
      source: 'profile',
      fallback: 'vi'
    };
  }

  // 3. CV content analysis
  if (context.cvContent) {
    const contentDetection = detectLanguageFromCV(context.cvContent);
    if (contentDetection.confidence > 0.6) {
      return {
        detectedLanguage: contentDetection.language,
        confidence: contentDetection.confidence,
        source: 'content',
        fallback: 'vi'
      };
    }
  }

  // 4. Browser locale
  if (context.browserLocale) {
    const browserLang = parseLocaleToLanguage(context.browserLocale);
    return {
      detectedLanguage: browserLang,
      confidence: 0.5,
      source: 'browser',
      fallback: 'vi'
    };
  }

  // 5. Default to Vietnamese
  return {
    detectedLanguage: 'vi',
    confidence: 0.3,
    source: 'default',
    fallback: 'vi'
  };
}

/**
 * Get browser locale safely
 */
export function getBrowserLocale(): string {
  if (typeof window === 'undefined') return 'vi-VN';
  
  return navigator.language || navigator.languages?.[0] || 'vi-VN';
}

/**
 * Persist language preference
 */
export function saveLanguagePreference(language: SupportedLanguage): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('okbuddy-language-preference', language);
  }
}

/**
 * Load saved language preference
 */
export function loadLanguagePreference(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem('okbuddy-language-preference');
  return (saved === 'vi' || saved === 'en') ? saved : null;
}

/**
 * Auto-detect language with full context
 */
export function autoDetectLanguage(context: Partial<LanguageDetectionContext> = {}): LanguageDetectionResult {
  const fullContext: LanguageDetectionContext = {
    ...context,
    browserLocale: context.browserLocale || getBrowserLocale(),
    manualSelection: context.manualSelection || loadLanguagePreference() || undefined
  };

  return detectLanguage(fullContext);
} 