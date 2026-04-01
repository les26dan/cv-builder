/**
 * Language Configuration System
 * Comprehensive language management for OkBuddy CV Guided Editing
 * Following OkBuddy development tenets: centralized, scalable, configurable
 */

export type SupportedLanguage = 'vi' | 'en';
export type LanguageSource = 'manual' | 'userProfile' | 'content' | 'browser' | 'default' | 'system';

export interface LanguagePreference {
  language: SupportedLanguage;
  source: LanguageSource;
  confidence: number;
  timestamp: string;
  userId?: string;
}

export interface LanguageDetectionRule {
  patterns: RegExp[];
  weight: number;
  minMatches: number;
}

export interface LanguageConfiguration {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  detectionThreshold: number;
  autoDetectionEnabled: boolean;
  userPreferenceEnabled: boolean;
  contentAnalysisEnabled: boolean;
  browserLocaleEnabled: boolean;
}

// Default configuration - optimized for Vietnamese market with Vietnamese as default
export const defaultLanguageConfig: LanguageConfiguration = {
  defaultLanguage: 'vi',
  fallbackLanguage: 'vi',
  detectionThreshold: 0.6,
  autoDetectionEnabled: true,
  userPreferenceEnabled: true,
  contentAnalysisEnabled: true,
  browserLocaleEnabled: true
};

// Enhanced Vietnamese detection patterns - more comprehensive
export const vietnameseDetectionRules: LanguageDetectionRule = {
  patterns: [
    // Vietnamese-specific characters (high weight)
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
    
    // Common Vietnamese words and phrases
    /\b(và|của|trong|với|từ|cho|để|này|đó|có|được|không|tại|về|theo|đã|sẽ|đang|các|một|những|nhiều|tốt|rất|nhất|cũng|phải|nên|như|bởi|thì|khi|nếu|mà|hay|hoặc|vì|nó|họ|chúng|chúng ta|bạn|tôi|anh|chị|em)\b/gi,
    
    // Vietnamese job titles and business terms
    /\b(chuyên viên|kỹ sư|quản lý|giám đốc|trưởng phòng|nhân viên|thực tập sinh|lập trình viên|thiết kế|kinh doanh|marketing|tài chính|nhân sự|bán hàng|phát triển|dự án|công ty|tổ chức|doanh nghiệp|khách hàng|sản phẩm|dịch vụ|thị trường)\b/gi,
    
    // Vietnamese work-related terms
    /\b(kinh nghiệm|trách nhiệm|nhiệm vụ|thành tựu|kết quả|hiệu quả|cải thiện|phát triển|thực hiện|tham gia|phối hợp|quản lý|lãnh đạo|đội ngũ|team|nhóm|dự án|mục tiêu|chiến lược|quy trình|hệ thống|công nghệ|kỹ năng|năng lực|chuyên môn)\b/gi,
    
    // Vietnamese education terms
    /\b(học vấn|bằng cấp|chứng chỉ|đại học|cao đẳng|trung cấp|tiến sĩ|thạc sĩ|cử nhân|kỹ sư|bác sĩ|giáo dục|đào tạo|học tập|nghiên cứu|khóa học|môn học|chuyên ngành|ngành học)\b/gi
  ],
  weight: 1.0,
  minMatches: 1
};

// Enhanced English detection patterns
export const englishDetectionRules: LanguageDetectionRule = {
  patterns: [
    // Common English CV and business words
    /\b(experience|management|development|project|responsible|achieved|implemented|designed|collaborated|managed|led|created|developed|analyzed|improved|optimized|delivered|coordinated|supervised|established|maintained|executed|facilitated|directed|organized|planned|streamlined)\b/gi,
    
    // English job titles
    /\b(manager|developer|engineer|analyst|specialist|coordinator|director|supervisor|executive|administrator|consultant|technician|designer|programmer|architect|lead|senior|junior|assistant|associate)\b/gi,
    
    // English articles, prepositions, and common words
    /\b(the|and|of|in|to|for|with|at|by|from|on|as|is|was|were|are|have|has|had|will|would|should|could|this|that|these|those|what|which|who|when|where|why|how)\b/gi,
    
    // English business and work terms
    /\b(company|organization|business|enterprise|corporation|firm|team|department|division|branch|office|client|customer|market|product|service|sales|revenue|profit|growth|strategy|process|system|technology|software|application|solution|platform)\b/gi,
    
    // English education terms
    /\b(education|degree|certificate|university|college|school|bachelor|master|doctorate|phd|diploma|training|course|program|study|research|major|field|subject|academic|graduation)\b/gi
  ],
  weight: 1.0,
  minMatches: 1
};

/**
 * Language Configuration Manager
 * Handles user preferences, detection rules, and system settings
 */
export class LanguageConfigManager {
  private static instance: LanguageConfigManager;
  private config: LanguageConfiguration;
  private userPreference: LanguagePreference | null = null;

  private constructor() {
    this.config = { ...defaultLanguageConfig };
    this.loadUserPreference();
  }

  public static getInstance(): LanguageConfigManager {
    if (!LanguageConfigManager.instance) {
      LanguageConfigManager.instance = new LanguageConfigManager();
    }
    return LanguageConfigManager.instance;
  }

  /**
   * Get current language configuration
   */
  getConfig(): LanguageConfiguration {
    return { ...this.config };
  }

  /**
   * Update language configuration
   */
  updateConfig(updates: Partial<LanguageConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Get user language preference
   */
  getUserPreference(): LanguagePreference | null {
    return this.userPreference;
  }

  /**
   * Set user language preference
   */
  setUserPreference(language: SupportedLanguage, source: LanguageSource = 'manual'): void {
    this.userPreference = {
      language,
      source,
      confidence: source === 'manual' ? 1.0 : 0.9,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId()
    };
    this.saveUserPreference();
  }

  /**
   * Clear user language preference
   */
  clearUserPreference(): void {
    this.userPreference = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('okbuddy_language');
      localStorage.removeItem('okbuddy-language-preference');
      localStorage.removeItem('okbuddy-language-preference-meta');
    }
  }

  /**
   * Detect language from content with enhanced context
   */
  detectLanguageFromContent(content: {
    text?: string;
    jobTitle?: string;
    company?: string;
    project?: string;
    impact?: string;
    responsibility?: string;
    workExperience?: any[];
    skills?: string[];
    existingCV?: any;
  }): { language: SupportedLanguage; confidence: number; matches: { vi: number; en: number } } {
    if (!this.config.contentAnalysisEnabled) {
      return { 
        language: this.config.defaultLanguage, 
        confidence: 0, 
        matches: { vi: 0, en: 0 } 
      };
    }

    // Combine all available text content
    const combinedText = [
      content.text || '',
      content.jobTitle || '',
      content.company || '',
      content.project || '',
      content.impact || '',
      content.responsibility || '',
      content.workExperience?.map(exp => `${exp.title} ${exp.company} ${exp.bullets?.join(' ') || ''}`)?.join(' ') || '',
      content.skills?.join(' ') || '',
      content.existingCV ? JSON.stringify(content.existingCV) : ''
    ].join(' ').toLowerCase();

    if (!combinedText.trim()) {
      return { 
        language: this.config.defaultLanguage, 
        confidence: 0, 
        matches: { vi: 0, en: 0 } 
      };
    }

    // Count matches for Vietnamese
    let viMatches = 0;
    for (const pattern of vietnameseDetectionRules.patterns) {
      const matches = combinedText.match(pattern);
      if (matches) {
        viMatches += matches.length;
      }
    }

    // Count matches for English
    let enMatches = 0;
    for (const pattern of englishDetectionRules.patterns) {
      const matches = combinedText.match(pattern);
      if (matches) {
        enMatches += matches.length;
      }
    }

    // Calculate confidence and determine language
    const totalMatches = viMatches + enMatches;
    if (totalMatches === 0) {
      return { 
        language: this.config.defaultLanguage, 
        confidence: 0, 
        matches: { vi: viMatches, en: enMatches } 
      };
    }

    const viConfidence = viMatches / totalMatches;
    const enConfidence = enMatches / totalMatches;

    // Determine language with bias towards Vietnamese (default market)
    // Use strict greater than (>) so Vietnamese wins when scores are equal
    const detectedLanguage: SupportedLanguage = enConfidence > viConfidence ? 'en' : 'vi';
    const confidence = Math.max(viConfidence, enConfidence);

    return {
      language: detectedLanguage,
      confidence,
      matches: { vi: viMatches, en: enMatches }
    };
  }

  /**
   * Get effective language with priority order
   * Priority: Manual Selection > User Profile > Content Analysis > Browser Locale > Default
   */
  getEffectiveLanguage(context?: {
    content?: any;
    browserLocale?: string;
    manualOverride?: SupportedLanguage;
  }): { language: SupportedLanguage; source: LanguageSource; confidence: number; debug?: any } {
    const debug: any = { checks: [] };

    // 1. Manual override (highest priority)
    if (context?.manualOverride) {
      debug.checks.push({ source: 'manual', result: context.manualOverride, confidence: 1.0 });
      return { language: context.manualOverride, source: 'manual', confidence: 1.0, debug };
    }

    // 2. User preference
    if (this.config.userPreferenceEnabled && this.userPreference) {
      debug.checks.push({ source: 'userProfile', result: this.userPreference.language, confidence: this.userPreference.confidence });
      return { 
        language: this.userPreference.language, 
        source: 'userProfile', 
        confidence: this.userPreference.confidence,
        debug 
      };
    }

    // 3. Content analysis
    if (this.config.contentAnalysisEnabled && context?.content) {
      const contentDetection = this.detectLanguageFromContent(context.content);
      debug.checks.push({ source: 'content', result: contentDetection.language, confidence: contentDetection.confidence, matches: contentDetection.matches });
      
      if (contentDetection.confidence >= this.config.detectionThreshold) {
        return { 
          language: contentDetection.language, 
          source: 'content', 
          confidence: contentDetection.confidence,
          debug 
        };
      }
    }

    // 4. Browser locale
    if (this.config.browserLocaleEnabled && context?.browserLocale) {
      const browserLang = this.parseLocaleToLanguage(context.browserLocale);
      debug.checks.push({ source: 'browser', result: browserLang, confidence: 0.5 });
      return { language: browserLang, source: 'browser', confidence: 0.5, debug };
    }

    // 5. Default fallback
    debug.checks.push({ source: 'default', result: this.config.defaultLanguage, confidence: 0.3 });
    return { 
      language: this.config.defaultLanguage, 
      source: 'default', 
      confidence: 0.3,
      debug 
    };
  }

  /**
   * Parse browser locale to supported language
   */
  private parseLocaleToLanguage(locale: string): SupportedLanguage {
    if (!locale) return this.config.defaultLanguage;
    
    const normalizedLocale = locale.toLowerCase();
    
    if (normalizedLocale.startsWith('vi') || normalizedLocale.includes('vietnam')) {
      return 'vi';
    }
    
    if (normalizedLocale.startsWith('en') || normalizedLocale.includes('english')) {
      return 'en';
    }
    
    return this.config.defaultLanguage;
  }

  /**
   * Get browser locale safely
   */
  getBrowserLocale(): string {
    if (typeof window === 'undefined') return 'en-US';
    return navigator.language || navigator.languages?.[0] || 'en-US';
  }

  /**
   * Load user preference from storage
   */
  private loadUserPreference(): void {
    if (typeof window === 'undefined') return;

    try {
      // First check for the UI-level preference (okbuddy_language)
      const uiLanguage = localStorage.getItem('okbuddy_language');
      if (uiLanguage && ['vi', 'en'].includes(uiLanguage)) {
        this.userPreference = {
          language: uiLanguage as SupportedLanguage,
          source: 'manual',
          confidence: 1.0,
          timestamp: new Date().toISOString(),
          userId: this.getCurrentUserId()
        };
        return;
      }

      // Fallback to the system-level preference
      const stored = localStorage.getItem('okbuddy-language-preference');
      const meta = localStorage.getItem('okbuddy-language-preference-meta');

      if (stored && meta) {
        const preference = JSON.parse(stored);
        const metadata = JSON.parse(meta);

        // Validate stored preference
        if (preference && ['vi', 'en'].includes(preference) && metadata?.timestamp) {
          this.userPreference = {
            language: preference as SupportedLanguage,
            source: metadata.source || 'userProfile',
            confidence: metadata.confidence || 0.9,
            timestamp: metadata.timestamp,
            userId: metadata.userId
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
      this.clearUserPreference();
    }
  }

  /**
   * Save user preference to storage
   */
  private saveUserPreference(): void {
    if (typeof window === 'undefined' || !this.userPreference) return;

    try {
      // Save to both UI-level and system-level keys for consistency
      localStorage.setItem('okbuddy_language', this.userPreference.language);
      localStorage.setItem('okbuddy-language-preference', JSON.stringify(this.userPreference.language));
      localStorage.setItem('okbuddy-language-preference-meta', JSON.stringify({
        source: this.userPreference.source,
        confidence: this.userPreference.confidence,
        timestamp: this.userPreference.timestamp,
        userId: this.userPreference.userId
      }));
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('okbuddy-language-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save language config:', error);
    }
  }

  /**
   * Get current user ID (placeholder for future auth integration)
   */
  private getCurrentUserId(): string | undefined {
    try {
      const userData = localStorage.getItem('okbuddy_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.email || undefined;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...defaultLanguageConfig };
    this.clearUserPreference();
    this.saveConfig();
  }
}

// Export singleton instance
export const languageConfig = LanguageConfigManager.getInstance();

/**
 * Convenience functions for easy access
 */
export function detectLanguage(context?: {
  content?: any;
  browserLocale?: string;
  manualOverride?: SupportedLanguage;
}): { language: SupportedLanguage; source: LanguageSource; confidence: number } {
  return languageConfig.getEffectiveLanguage(context);
}

export function setUserLanguagePreference(language: SupportedLanguage): void {
  languageConfig.setUserPreference(language, 'manual');
}

export function getUserLanguagePreference(): SupportedLanguage | null {
  const preference = languageConfig.getUserPreference();
  return preference?.language || null;
}

export function getBrowserLocale(): string {
  return languageConfig.getBrowserLocale();
} 