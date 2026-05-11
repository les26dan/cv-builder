/**
 * AI Service - Real ChatGPT API Integration
 * Following CV Builder tenets: modular, swappable, no vendor lock-in
 * Centralized AI functionality for CV editing with bilingual support
 */

import { environmentConfig } from '../config/environment';
import { viAIPrompts, formatPrompt, type AIPromptTemplate, type PromptContext } from '../config/texts/vi/aiPrompts';
import { enAIPrompts, formatEnglishPrompt } from '../config/texts/en/aiPrompts';
import { viSummaryAIPrompts, formatViSummaryPrompt } from '../config/texts/vi/summaryAI';
import { enSummaryAIPrompts, formatEnSummaryPrompt } from '../config/texts/en/summaryAI';
import { viWorkExperienceAIPrompts, formatViWorkExperiencePrompt } from '../config/texts/vi/workExperienceAI';
import { viSkillsAIPrompts, formatViSkillsPrompt } from '../config/texts/vi/skillsAI';
import { enSkillsAIPrompts, formatEnSkillsPrompt } from '../config/texts/en/skillsAI';
import { viJDAnalysisAIPrompts, formatViJDAnalysisPrompt } from '../config/texts/vi/jdAnalysisAI';
import { enJDAnalysisAIPrompts, formatEnJDAnalysisPrompt } from '../config/texts/en/jdAnalysisAI';
import { type SupportedLanguage, type LanguageDetectionContext } from './languageDetection';
import { detectLanguage, languageConfig } from '../config/languageConfig';

// Response interfaces
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  language?: SupportedLanguage;
  source?: 'api' | 'cache' | 'fallback';
}

// Request interfaces
export interface SummaryGenerationRequest {
  workExperience?: any[];
  existingContent?: string;
  targetJobDescription?: string;
  language?: SupportedLanguage;
}

export interface BulletGenerationRequest {
  jobTitle: string;
  company: string;
  existingBullets?: string[];
  targetJobDescription?: string;
  language?: SupportedLanguage;
}

export interface WizardBulletGenerationRequest {
  jobTitle: string;
  company: string;
  project: string;
  impact: string;
  responsibility?: string;
  targetJobDescription?: string;
  language?: SupportedLanguage;
}

export interface EnhancedSummaryGenerationRequest {
  workExperience?: any[];
  skills?: string[];
  education?: any[];
  targetJobDescription?: string;
  existingContent?: string;
  userAnswers?: {
    profession?: string;
    keyStrengths?: string;
  };
  language?: SupportedLanguage;
}

export interface SkillSuggestionRequest {
  currentSkills: string[];
  workExperience?: any[];
  targetJobDescription?: string;
  language?: SupportedLanguage;
  maxSkillsToSuggest?: number;
}

export interface JobAnalysisRequest {
  jobDescription: string;
  currentCV?: any;
  language?: SupportedLanguage;
}

export interface JobAnalysisResponse {
  summary?: string[];
  workExperience?: string[];
  skills?: string[];
  education?: string[];
  keywords?: string[];
}

export interface ContentImprovementRequest {
  content: string;
  sectionType: 'summary' | 'bullets' | 'education' | 'custom';
  context?: any;
  language?: SupportedLanguage;
}

// ChatGPT API interfaces
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  language: SupportedLanguage;
}

class AIService {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();

  constructor() {
    // Initialize cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Setup periodic cache cleanup
   */
  private setupCacheCleanup(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanExpiredCache();
      }, 5 * 60 * 1000); // Clean every 5 minutes
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const ttl = environmentConfig.ai.cacheTTL;

    // Convert entries to array to avoid iteration issues
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(method: string, request: any, language: SupportedLanguage): string {
    return `${method}-${language}-${JSON.stringify(request)}`;
  }

  /**
   * Get cached response
   */
  private getCachedResponse<T>(cacheKey: string): T | null {
    if (!environmentConfig.ai.enableCaching) return null;

    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > environmentConfig.ai.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached response
   */
  private setCachedResponse<T>(cacheKey: string, data: T, language: SupportedLanguage): void {
    if (!environmentConfig.ai.enableCaching) return;

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      language
    });
  }

  /**
   * Detect language for request with enhanced context.
   * Priority: explicit request > user's saved UI preference > content detection > default.
   * User's saved preference (okbuddy_language) wins over content so that e.g. pasting English JD
   * into wizard still produces Vietnamese output when user has chosen Vietnamese UI.
   */
  private detectRequestLanguage(request: any, context?: LanguageDetectionContext): SupportedLanguage {
    if (request.language) {
      return request.language;
    }

    // User's explicit UI language preference (okbuddy_language) - if set, use for output language.
    const savedUiLanguage = typeof window !== 'undefined' ? (localStorage.getItem('okbuddy_language') as SupportedLanguage) : null;
    if (savedUiLanguage === 'vi' || savedUiLanguage === 'en') {
      return savedUiLanguage;
    }

    // Default to Vietnamese when no preference set (Vietnamese market). Avoid content-based
    // detection which returns 'en' when bullets/CV are in English, causing English output.
    if (typeof window !== 'undefined') {
      return 'vi';
    }

    const content = {
      text: request.content || '',
      jobTitle: request.jobTitle || '',
      company: request.company || '',
      project: request.project || '',
      impact: request.impact || '',
      responsibility: request.responsibility || '',
      workExperience: request.workExperience || [],
      skills: request.skills || [],
      existingCV: request.cvData || context?.cvContent || {}
    };

    // Content-based detection: when user has typed substantial content and NO saved preference
    const combinedLength = [content.text, content.jobTitle, content.company, content.project, content.impact, content.responsibility]
      .filter(Boolean)
      .join(' ').trim().length;

    if (combinedLength >= 15) {
      const contentResult = languageConfig.detectLanguageFromContent(content);
      if (contentResult.confidence >= 0.5) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🌐 Language Detection (content):', {
            detected: contentResult.language,
            confidence: contentResult.confidence
          });
        }
        return contentResult.language;
      }
    }

    // Fallback: standard priority (manual override > user preference > content > browser > default)
    const detectionContext = {
      content,
      browserLocale: languageConfig.getBrowserLocale(),
      manualOverride: request.manualLanguage
    };

    const result = detectLanguage(detectionContext);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Language Detection:', {
        detected: result.language,
        source: result.source,
        confidence: result.confidence,
        context: detectionContext.content
      });
    }

    return result.language;
  }

  /** All AI prompts use Vietnamese (repo default for Vietnamese market). */
  private static readonly PROMPT_LANGUAGE: SupportedLanguage = 'vi';

  /**
   * Get prompt templates - always Vietnamese for this repo
   */
  private getPromptTemplates(_language?: SupportedLanguage) {
    return viAIPrompts;
  }

  /**
   * Get section-specific prompt templates - always Vietnamese
   */
  private getSummaryPromptTemplates(_language?: SupportedLanguage) {
    return viSummaryAIPrompts;
  }

  /**
   * Get work experience prompt templates - always Vietnamese
   */
  private getWorkExperiencePromptTemplates(_language?: SupportedLanguage) {
    return viWorkExperienceAIPrompts;
  }

  /**
   * Get skills prompt templates - always Vietnamese
   */
  private getSkillsPromptTemplates(_language?: SupportedLanguage) {
    return viSkillsAIPrompts;
  }

  /**
   * Get JD analysis prompt templates - always Vietnamese
   */
  private getJDAnalysisPromptTemplates(_language?: SupportedLanguage) {
    return viJDAnalysisAIPrompts;
  }

  /**
   * Format prompt for language
   */
  private formatPromptForLanguage(
    templateKey: string,
    context: PromptContext,
    _language?: SupportedLanguage
  ): { system: string; user: string } {
    // All prompts use Vietnamese templates (repo default)
    const summaryKeys = ['enhancedSummaryGeneration', 'summaryImprovement', 'contextBasedGeneration', 'emptyStateGuidance'];
    if (summaryKeys.includes(templateKey)) {
      const summaryTemplates = this.getSummaryPromptTemplates();
      const template = summaryTemplates[templateKey as keyof typeof summaryTemplates] as AIPromptTemplate;
      if (!template) throw new Error(`Summary template '${templateKey}' not found`);
      return formatViSummaryPrompt(template, context);
    }

    const workExperienceKeys = ['enhancedBulletGeneration', 'contextAwareBulletGeneration', 'wizardEnhancedGeneration', 'bulletImprovement'];
    if (workExperienceKeys.includes(templateKey)) {
      const workExperienceTemplates = this.getWorkExperiencePromptTemplates();
      const template = workExperienceTemplates[templateKey as keyof typeof workExperienceTemplates] as AIPromptTemplate;
      if (!template) throw new Error(`Work experience template '${templateKey}' not found`);
      return formatViWorkExperiencePrompt(template, context);
    }

    const skillsKeys = ['enhancedSkillSuggestions', 'contextAwareSkillAnalysis', 'industrySpecificSkills', 'skillsGapAnalysis'];
    if (skillsKeys.includes(templateKey)) {
      const skillsTemplates = this.getSkillsPromptTemplates();
      const template = skillsTemplates[templateKey as keyof typeof skillsTemplates] as AIPromptTemplate;
      if (!template) throw new Error(`Skills template '${templateKey}' not found`);
      return formatViSkillsPrompt(template, context);
    }

    const jdAnalysisKeys = ['comprehensiveJobAnalysis', 'keywordExtractionAnalysis', 'sectionSpecificOptimization', 'competitiveAnalysis', 'industrySpecificAnalysis'];
    if (jdAnalysisKeys.includes(templateKey)) {
      const jdAnalysisTemplates = this.getJDAnalysisPromptTemplates();
      const template = jdAnalysisTemplates[templateKey as keyof typeof jdAnalysisTemplates] as AIPromptTemplate;
      if (!template) throw new Error(`JD Analysis template '${templateKey}' not found`);
      return formatViJDAnalysisPrompt(template, context);
    }

    const templates = this.getPromptTemplates();
    const template = templates[templateKey as keyof typeof templates] as AIPromptTemplate;
    if (!template) throw new Error(`Template '${templateKey}' not found`);
    return formatPrompt(template, context);
  }

  /**
   * Make ChatGPT API request with error handling and retries
   */
  private async makeOpenAIRequest(messages: ChatMessage[], retryCount = 0): Promise<OpenAIResponse> {
    const config = environmentConfig.ai;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        } as OpenAIRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (retryCount < config.retryAttempts) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeOpenAIRequest(messages, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Process ChatGPT response
   */
  private processOpenAIResponse(response: OpenAIResponse): string {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received from OpenAI');
    }

    const choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    return choice.message.content.trim();
  }

  /**
   * Generate AI response with caching and deduplication
   */
  private async generateAIResponse<T>(
    method: string,
    request: any,
    templateKey: string,
    context: PromptContext,
    language: SupportedLanguage,
    processor?: (content: string) => T,
    extraSystemInstruction?: string
  ): Promise<AIResponse<T>> {
    try {
      const cacheKey = this.generateCacheKey(method, request, language);

      // Check cache first
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          language,
          source: 'cache'
        };
      }

      // Check if request is already in progress (deduplication)
      if (this.requestQueue.has(cacheKey)) {
        const result = await this.requestQueue.get(cacheKey);
        return {
          success: true,
          data: result,
          language,
          source: 'api'
        };
      }

      // Create new request
      const requestPromise = this.executeAIRequest(templateKey, context, language, processor, extraSystemInstruction);
      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        this.setCachedResponse(cacheKey, result, language);
        
        return {
          success: true,
          data: result,
          language,
          source: 'api'
        };
      } finally {
        this.requestQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error(`AI Service Error (${method}):`, error);
      
      // Fallback to mock implementation
      const fallbackResult = await this.getFallbackResponse<T>(method, request, language);
      return {
        success: true,
        data: fallbackResult,
        language,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /** Appended to every system prompt so output is always Vietnamese. */
  private static readonly VIETNAMESE_ONLY_INSTRUCTION =
    '\n\nQUY TẮC BẮT BUỘC: Bạn PHẢI trả lời 100% bằng tiếng Việt. KHÔNG được dùng tiếng Anh trong câu trả lời. Mọi nội dung output phải là tiếng Việt.';
  /** Appended to every user message to reinforce Vietnamese-only output. */
  private static readonly VIETNAMESE_ONLY_USER_SUFFIX =
    '\n\n[QUAN TRỌNG: Chỉ trả lời bằng tiếng Việt. Không dùng tiếng Anh trong bất kỳ câu nào.]';

  /** Instruction asking LLM to return 4 distinct alternatives as JSON. */
  private static readonly FOUR_ALTERNATIVES_INSTRUCTION =
    '\n\nYÊU CẦU OUTPUT: Hãy tạo 4 phương án KHÁC NHAU về phong cách (1: động từ hành động mạnh + số liệu định lượng, 2: nhấn mạnh tác động kinh doanh, 3: ngắn gọn ≤100 ký tự, 4: chi tiết kỹ thuật ≤180 ký tự). KHÔNG bịa số liệu không có trong dữ liệu gốc. Trả về JSON đúng định dạng: {"alternatives": ["phương án 1", "phương án 2", "phương án 3", "phương án 4"]}';

  /** Parse 4-alternatives output from LLM. Tolerates JSON, fenced JSON,
   *  JSON-mixed-with-prose (Claude habit), or newline list. */
  private static parseAlternatives(content: string): string[] {
    const trimmed = content.trim();
    const candidates: string[] = [];

    // 1. JSON inside ```json ... ``` fence
    const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedJson) candidates.push(fencedJson[1].trim());

    // 2. First {...} object containing "alternatives"
    const objMatch = trimmed.match(/\{[\s\S]*?"alternatives"[\s\S]*?\]\s*\}/i);
    if (objMatch) candidates.push(objMatch[0]);

    // 3. Whole string with fences stripped
    candidates.push(trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());

    for (const cand of candidates) {
      try {
        const parsed = JSON.parse(cand);
        if (Array.isArray(parsed?.alternatives)) {
          const alts = parsed.alternatives
            .filter((s: any) => typeof s === 'string' && s.trim())
            .map((s: string) => s.trim());
          if (alts.length > 0) return alts;
        }
        if (Array.isArray(parsed)) {
          const alts = parsed
            .filter((s: any) => typeof s === 'string' && s.trim())
            .map((s: string) => s.trim());
          if (alts.length > 0) return alts;
        }
      } catch {
        // try next candidate
      }
    }

    // Last-ditch fallback: newline-separated, strip bullet/number prefixes
    const lines = trimmed
      .split('\n')
      .map(l => l.replace(/^\s*[-•*]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(l => l.length > 0);
    if (lines.length > 0) return lines;
    return [trimmed];
  }

  /**
   * Execute AI request. Prompt language is always Vietnamese (repo default).
   */
  private async executeAIRequest<T>(
    templateKey: string,
    context: PromptContext,
    _language: SupportedLanguage,
    processor?: (content: string) => T,
    extraSystemInstruction?: string
  ): Promise<T> {
    const prompt = this.formatPromptForLanguage(templateKey, context, 'vi');
    const systemContent =
      prompt.system +
      AIService.VIETNAMESE_ONLY_INSTRUCTION +
      (extraSystemInstruction ? '\n\n' + extraSystemInstruction : '');
    const userContent = prompt.user + AIService.VIETNAMESE_ONLY_USER_SUFFIX;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ];

    let content: string;
    try {
      const response = await this.makeOpenAIRequest(messages);
      content = this.processOpenAIResponse(response);
    } catch (err) {
      // Local Claude CLI fallback — server-only, gated by LOCAL_CLAUDE_FALLBACK=1.
      // We use an opaque eval'd require so webpack does NOT try to bundle
      // child_process for the browser. This keeps aiService.ts safe for client use.
      const isServer = typeof window === 'undefined';
      const fallbackOn = typeof process !== 'undefined' && process.env?.LOCAL_CLAUDE_FALLBACK === '1';
      if (isServer && fallbackOn) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const mod = (eval('require') as NodeRequire)('../lib/localClaudeFallback') as typeof import('../lib/localClaudeFallback');
          console.warn('[aiService] OpenAI failed, falling back to local Claude:', (err as any)?.message);
          content = await mod.runLocalClaude(`${systemContent}\n\n${userContent}`, { timeoutMs: 60_000 });
        } catch (fallbackErr) {
          console.error('[aiService] local Claude fallback failed:', fallbackErr);
          throw err;
        }
      } else {
        throw err;
      }
    }

    return processor ? processor(content) : (content as unknown as T);
  }

  /**
   * Get fallback response for failed API calls
   */
  private async getFallbackResponse<T>(method: string, request: any, language: SupportedLanguage): Promise<T> {
    // Implement basic fallback responses based on method
    switch (method) {
      case 'generateSummary':
        return this.generateSummaryFallback(request, language) as unknown as T;
      case 'generateBulletPoints':
        return this.generateBulletPointsFallback(request, language) as unknown as T;
      case 'generateEnhancedSummary':
        return this.generateEnhancedSummaryFallback(request, language) as unknown as T;
      case 'generateBulletFromWizard':
        return this.generateBulletFromWizardFallback(request, language) as unknown as T;
      case 'suggestSkills':
        return this.suggestSkillsFallback(request, language) as unknown as T;
      case 'improveSummary':
        return this.improveSummaryFallback(request, language) as unknown as T;
      case 'analyzeJobDescription':
        return this.analyzeJobDescriptionFallback(request, language) as unknown as T;
      default:
        throw new Error(`No fallback available for method: ${method}`);
    }
  }

  /**
   * Generate professional summary
   */
  async generateSummary(request: SummaryGenerationRequest & { cvData?: any }): Promise<AIResponse<string>> {
    // Enhanced request with content for language detection
    const enhancedRequest = {
      ...request,
      content: request.existingContent || '',
      workExperience: request.workExperience || [],
      cvData: request.cvData
    };

    const language = this.detectRequestLanguage(enhancedRequest);
    
    // Format work experience based on detected language
    const workExperienceText = language === 'vi'
      ? request.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';
    
    const context: PromptContext = {
      workExperience: workExperienceText,
      targetJob: request.targetJobDescription || '',
      existingContent: request.existingContent || ''
    };

    return this.generateAIResponse(
      'generateSummary',
      request,
      'summaryGeneration',
      context,
      language
    );
  }

  /**
   * Generate enhanced summary with full context
   */
  async generateEnhancedSummary(request: EnhancedSummaryGenerationRequest): Promise<AIResponse<string[]>> {
    const language = this.detectRequestLanguage(request);
    
    // Prepare work experience string based on language
    const workExperienceText = language === 'vi' 
      ? request.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';

    // Prepare education string based on language  
    const educationText = language === 'vi'
      ? request.education?.map(edu => 
          `${edu.degree} tại ${edu.school}`
        ).join('\n') || ''
      : request.education?.map(edu => 
          `${edu.degree} at ${edu.school}`
        ).join('\n') || '';
    
    const context: PromptContext = {
      profession: request.userAnswers?.profession || '',
      keyStrengths: request.userAnswers?.keyStrengths || '',
      workExperience: workExperienceText,
      skills: request.skills?.join(', ') || '',
      education: educationText,
      targetJob: request.targetJobDescription || '',
      existingContent: request.existingContent || ''
    };

    return this.generateAIResponse(
      'generateEnhancedSummary',
      request,
      'enhancedSummaryGeneration',
      context,
      language,
      AIService.parseAlternatives,
      AIService.FOUR_ALTERNATIVES_INSTRUCTION
    );
  }

  /**
   * Generate bullet points for work experience with enhanced context
   */
  async generateBulletPoints(request: BulletGenerationRequest & { 
    cvData?: any; 
    workExperience?: any[]; 
    skills?: string[]; 
    education?: any[] 
  }): Promise<AIResponse<string[]>> {
    const language = this.detectRequestLanguage(request);
    
    // Prepare enhanced context with full CV data
    const workExperienceText = language === 'vi'
      ? request.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';

    const context: PromptContext = {
      jobTitle: request.jobTitle,
      company: request.company,
      workExperience: workExperienceText,
      skills: request.skills?.join(', ') || '',
      targetJob: request.targetJobDescription || ''
    };

    return this.generateAIResponse(
      'generateBulletPoints',
      request,
      'enhancedBulletGeneration',
      context,
      language,
      (content: string) => {
        // Parse bullet points from response
        return content.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    );
  }

  /**
   * Generate bullet from wizard data with enhanced context
   */
  async generateBulletFromWizard(request: WizardBulletGenerationRequest & { 
    cvData?: any; 
    workExperience?: any[]; 
    skills?: string[]; 
    education?: any[]
  }): Promise<AIResponse<string[]>> {
    // Enhanced request with all wizard content for accurate language detection
    const enhancedRequest = {
      ...request,
      // Include all wizard input content for language detection
      content: `${request.project} ${request.impact} ${request.responsibility || ''} ${request.jobTitle} ${request.company}`,
      workExperience: request.workExperience || [],
      skills: request.skills || [],
      cvData: request.cvData
    };

    const language = this.detectRequestLanguage(enhancedRequest);
    
    // Prepare enhanced context with full CV data
    const workExperienceText = language === 'vi'
      ? request.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';
    
    const context: PromptContext = {
      jobTitle: request.jobTitle,
      company: request.company,
      project: request.project,
      impact: request.impact,
      responsibility: request.responsibility || '',
      workExperience: workExperienceText,
      targetJob: request.targetJobDescription || ''
    };

    return this.generateAIResponse(
      'generateBulletFromWizard',
      request,
      'wizardEnhancedGeneration',
      context,
      language,
      AIService.parseAlternatives,
      AIService.FOUR_ALTERNATIVES_INSTRUCTION
    );
  }

  /**
   * Suggest skills based on experience and job description with enhanced context
   */
  async suggestSkills(request: SkillSuggestionRequest & { 
    education?: any[]; 
    industry?: string;
    jobTitle?: string;
  }): Promise<AIResponse<string[]>> {
    const language = this.detectRequestLanguage(request);
    
    // Prepare enhanced context with full CV data
    const workExperienceText = language === 'vi'
      ? request.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';

    // Prepare education string based on language  
    const educationText = language === 'vi'
      ? request.education?.map(edu => 
          `${edu.degree} tại ${edu.school}`
        ).join('\n') || ''
      : request.education?.map(edu => 
          `${edu.degree} at ${edu.school}`
        ).join('\n') || '';
    
    const context: PromptContext = {
      skills: request.currentSkills.join(', '),
      workExperience: workExperienceText,
      education: educationText,
      targetJob: request.targetJobDescription || '',
      industry: request.industry || '',
      jobTitle: request.jobTitle || '',
      currentSkillsCount: request.currentSkills.length.toString(),
      maxSkills: (request.maxSkillsToSuggest || 8).toString()
    };

    return this.generateAIResponse(
      'suggestSkills',
      request,
      'enhancedSkillSuggestions',
      context,
      language,
      (content: string) => {
        // Parse skills from response
        const maxSkills = request.maxSkillsToSuggest || 8;
        return content.split(/[,\n]/)
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0 && !request.currentSkills.some(existing => 
            existing.toLowerCase() === skill.toLowerCase()
          ))
          .slice(0, maxSkills); // Limit to requested number of suggestions
      }
    );
  }

  /**
   * Improve bullet points for work experience
   */
  async improveBulletPoints(bullets: string[], context?: { 
    jobTitle?: string; 
    company?: string; 
    cvData?: any; 
    workExperience?: any[]; 
    skills?: string[]; 
    targetJob?: string; 
    language?: SupportedLanguage 
  }): Promise<AIResponse<string[]>> {
    const language = context?.language || this.detectRequestLanguage(context || {});
    
    // Prepare enhanced context with full CV data
    const workExperienceText = language === 'vi'
      ? context?.workExperience?.map(exp => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : context?.workExperience?.map(exp => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';
    
    const promptContext: PromptContext = {
      existingContent: bullets.join('\n'),
      jobTitle: context?.jobTitle || '',
      company: context?.company || '',
      workExperience: workExperienceText,
      skills: context?.skills?.join(', ') || '',
      targetJob: context?.targetJob || ''
    };

    return this.generateAIResponse(
      'improveBulletPoints',
      { bullets, context },
      'bulletImprovement',
      promptContext,
      language,
      (content: string) => {
        // Parse improved bullet points from response
        return content.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    );
  }

  /**
   * Improve existing content with enhanced context
   */
  async improveSummary(request: ContentImprovementRequest): Promise<AIResponse<string[]>> {
    const language = this.detectRequestLanguage(request);
    
    // Prepare work experience string based on language
    const workExperienceText = language === 'vi' 
      ? request.context?.workExperience?.map((exp: any) => 
          `${exp.title} tại ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || ''
      : request.context?.workExperience?.map((exp: any) => 
          `${exp.title} at ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
        ).join('\n') || '';

    // Prepare skills and other context
    const skillsText = request.context?.skills?.join(', ') || '';
    const targetJobText = request.context?.targetJob || '';
    
    const context: PromptContext = {
      existingContent: request.content,
      workExperience: workExperienceText,
      skills: skillsText,
      targetJob: targetJobText,
      sectionType: request.sectionType || 'summary'
    };

    // Use summary-specific improvement template
    return this.generateAIResponse(
      'improveSummary',
      request,
      'summaryImprovement',
      context,
      language,
      AIService.parseAlternatives,
      AIService.FOUR_ALTERNATIVES_INSTRUCTION
    );
  }

  /**
   * Analyze job description and provide comprehensive CV optimization suggestions
   */
  async analyzeJobDescription(request: JobAnalysisRequest & {
    summaryContent?: string;
    experienceContent?: string;
    skillsContent?: string;
    educationContent?: string;
    industry?: string;
  }): Promise<AIResponse<JobAnalysisResponse>> {
    const language = this.detectRequestLanguage(request);
    
    // Prepare comprehensive context with CV section details
    const context: PromptContext = {
      jobDescription: request.jobDescription,
      currentCV: JSON.stringify(request.currentCV || {}),
      summaryContent: request.summaryContent || '',
      experienceContent: request.experienceContent || '',
      skillsContent: request.skillsContent || '',
      educationContent: request.educationContent || '',
      industry: request.industry || ''
    };

    return this.generateAIResponse(
      'analyzeJobDescription',
      request,
      'comprehensiveJobAnalysis',
      context,
      language,
      (content: string) => {
        // Enhanced parsing for structured response
        try {
          const lines = content.split('\n').filter(line => line.trim());
          const result: JobAnalysisResponse = {
            summary: [],
            workExperience: [],
            skills: [],
            education: [],
            keywords: []
          };

          let currentSection = '';
          // let inRoadmap = false; // TODO: Implement roadmap functionality
          
          for (const line of lines) {
            const trimmed = line.trim();
            

            
            // Section identification (more robust)
            if (trimmed.includes('TÓM TẮT') || trimmed.includes('SUMMARY')) {
              currentSection = 'summary';
              continue;
            } else if (trimmed.includes('KINH NGHIỆM') || trimmed.includes('EXPERIENCE')) {
              currentSection = 'workExperience';
              continue;
            } else if (trimmed.includes('KỸ NĂNG') || trimmed.includes('SKILLS')) {
              currentSection = 'skills';
              continue;
            } else if (trimmed.includes('HỌC VẤN') || trimmed.includes('EDUCATION')) {
              currentSection = 'education';
              continue;
            } else if (trimmed.includes('TỪ KHÓA') || trimmed.includes('KEYWORDS')) {
              currentSection = 'keywords';
              continue;
            } else if (trimmed.includes('ROADMAP') || trimmed.includes('ACTION')) {
              // inRoadmap = true; // TODO: Implement roadmap functionality
              continue;
            }
            
            // Extract content items
            if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
              let item = trimmed.replace(/^[-•*]\s*/, '').trim();
              
              // Clean up common prefixes
              item = item.replace(/^(Keywords cần incorporate|Missing critical skills|Bullet points cần adjust):\s*/i, '');
              
              if (item && currentSection && result[currentSection as keyof JobAnalysisResponse] instanceof Array) {
                (result[currentSection as keyof JobAnalysisResponse] as string[]).push(item);
              }
            }
          }

          // Ensure minimum content
          if (result.summary && result.summary.length === 0) {
            result.summary.push('Tối ưu hóa tóm tắt với từ khóa từ job description');
          }
          if (result.skills && result.skills.length === 0) {
            result.skills.push('Bổ sung kỹ năng phù hợp với vị trí');
          }

          return result;
        } catch (error) {
          console.error('Error parsing JD analysis response:', error);
          // Enhanced fallback
          return {
            summary: ['Tối ưu hóa tóm tắt để phù hợp với job description'],
            workExperience: ['Điều chỉnh bullet points để align với requirements'],
            skills: ['Bổ sung kỹ năng missing từ job description'],
            education: ['Highlight relevant qualifications'],
            keywords: this.extractBasicKeywords(request.jobDescription)
          };
        }
      }
    );
  }

  /**
   * Extract basic keywords as fallback
   */
  private extractBasicKeywords(jobDescription: string): string[] {
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'java', 'sql', 'aws', 'docker',
      'agile', 'scrum', 'management', 'leadership', 'communication', 'teamwork'
    ];
    
    const text = jobDescription.toLowerCase();
    return commonSkills.filter(skill => text.includes(skill)).slice(0, 10);
  }

  /**
   * Fallback implementations
   */
  private async generateSummaryFallback(request: SummaryGenerationRequest, language: SupportedLanguage): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (language === 'vi') {
      return request.workExperience && request.workExperience.length > 0
        ? `Chuyên viên với kinh nghiệm làm việc tại ${request.workExperience[0]?.company || 'các công ty hàng đầu'}. Có khả năng ${request.workExperience[0]?.title || 'thực hiện công việc chuyên môn'} và tham gia các dự án quan trọng.`
        : 'Chuyên viên năng động với kinh nghiệm trong lĩnh vực chuyên môn, tìm kiếm cơ hội phát triển trong môi trường năng động.';
    } else {
      return request.workExperience && request.workExperience.length > 0
        ? `Professional with experience working at ${request.workExperience[0]?.company || 'leading companies'}. Capable of ${request.workExperience[0]?.title || 'performing professional duties'} and participating in important projects.`
        : 'Dynamic professional with experience in specialized field, seeking development opportunities in a dynamic environment.';
    }
  }

  private async generateBulletPointsFallback(request: BulletGenerationRequest, language: SupportedLanguage): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (language === 'vi') {
      return [
        `Thực hiện công việc ${request.jobTitle} tại ${request.company}`,
        `Tham gia các dự án quan trọng và đạt được kết quả tích cực`,
        `Phối hợp với team để hoàn thành mục tiêu công ty`,
        `Cải thiện quy trình làm việc và nâng cao hiệu quả`
      ];
    } else {
      return [
        `Performed ${request.jobTitle} duties at ${request.company}`,
        `Participated in important projects and achieved positive results`,
        `Collaborated with team to accomplish company objectives`,
        `Improved work processes and increased efficiency`
      ];
    }
  }

  private async generateEnhancedSummaryFallback(request: EnhancedSummaryGenerationRequest, language: SupportedLanguage): Promise<string[]> {
    const single = await this.generateSummaryFallback({
      workExperience: request.workExperience,
      existingContent: request.existingContent,
      targetJobDescription: request.targetJobDescription
    }, language);
    return [single];
  }

  private async generateBulletFromWizardFallback(request: WizardBulletGenerationRequest, language: SupportedLanguage): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (language === 'vi') {
      const base = `${request.responsibility ? request.responsibility + ' để' : 'Thực hiện'} ${request.project}, đạt được ${request.impact}.`;
      return [base];
    } else {
      const base = `${request.responsibility ? request.responsibility + ' to' : 'Executed'} ${request.project}, achieving ${request.impact}.`;
      return [base];
    }
  }

  private async suggestSkillsFallback(request: SkillSuggestionRequest, language: SupportedLanguage): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (language === 'vi') {
      return ['Giao tiếp', 'Làm việc nhóm', 'Quản lý thời gian', 'Giải quyết vấn đề', 'Tư duy phản biện'];
    } else {
      return ['Communication', 'Teamwork', 'Time Management', 'Problem Solving', 'Critical Thinking'];
    }
  }

  private async improveSummaryFallback(request: ContentImprovementRequest, _language: SupportedLanguage): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [request.content]; // Return original content as fallback
  }

  private async analyzeJobDescriptionFallback(request: JobAnalysisRequest, language: SupportedLanguage): Promise<JobAnalysisResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (language === 'vi') {
      return {
        summary: ['Cải thiện phần tóm tắt để phù hợp với vị trí'],
        workExperience: ['Bổ sung kinh nghiệm liên quan đến công việc'],
        skills: ['Thêm kỹ năng chuyên môn'],
        education: ['Cập nhật thông tin học vấn'],
        keywords: ['kỹ năng', 'kinh nghiệm', 'chuyên môn']
      };
    } else {
      return {
        summary: ['Improve summary section to match the position'],
        workExperience: ['Add relevant work experience'],
        skills: ['Include professional skills'],
        education: ['Update education information'],
        keywords: ['skills', 'experience', 'professional']
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Types are exported inline with their declarations 