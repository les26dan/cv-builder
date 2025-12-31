/**
 * Unified ChatGPT Service - Cross-Project AI Integration
 * Following OkBuddy tenets: modular, swappable, no vendor lock-in
 * Centralized AI functionality for all OkBuddy projects with bilingual support
 */

import { AIResponse, ChatMessage, OpenAIRequest, OpenAIResponse } from '../types/aiInterfaces';
import { PromptTemplate, PromptContext } from '../utils/promptTemplates';
import { AIConfig } from '../config/aiConfig';
import { AIErrorHandler } from '../utils/aiErrorHandling';
import { AIUsageTracker } from '../monitoring/aiUsageTracker';
import { autoDetectLanguage, type SupportedLanguage } from '../../utils/languageDetection';

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  language: SupportedLanguage;
  source: 'api' | 'fallback';
}

// Specialized request interfaces
export interface CVSummaryRequest {
  cvData: {
    experience?: any[];
    skills?: string[];
    education?: any[];
    summary?: string;
  };
  targetJob?: string;
  language?: SupportedLanguage;
}

export interface JobAnalysisRequest {
  jobDescription: string;
  cvData?: any;
  analysisType?: 'basic' | 'comprehensive' | 'matching';
  language?: SupportedLanguage;
}

export interface BulletGenerationRequest {
  jobTitle: string;
  company: string;
  context?: {
    experience?: any[];
    skills?: string[];
    targetJob?: string;
  };
  type?: 'standard' | 'wizard' | 'improvement';
  language?: SupportedLanguage;
}

export interface ContentImprovementRequest {
  content: string;
  contentType: 'summary' | 'bullet' | 'skill' | 'education';
  context?: {
    cvData?: any;
    targetJob?: string;
  };
  language?: SupportedLanguage;
}

/**
 * Unified ChatGPT Service for all OkBuddy projects
 */
export class UnifiedChatGPTService {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private config: AIConfig;
  private errorHandler: AIErrorHandler;
  private usageTracker: AIUsageTracker;

  constructor(config: AIConfig) {
    this.config = config;
    this.errorHandler = new AIErrorHandler(config);
    this.usageTracker = new AIUsageTracker();
    this.setupCacheCleanup();
  }

  /**
   * Setup automatic cache cleanup
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Generate cache key for request deduplication
   */
  private generateCacheKey(method: string, request: any, language: SupportedLanguage): string {
    const requestHash = JSON.stringify(request);
    return `${method}:${language}:${btoa(requestHash).slice(0, 32)}`;
  }

  /**
   * Get cached response if available and valid
   */
  private getCachedResponse<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  /**
   * Set cached response with TTL
   */
  private setCachedResponse<T>(cacheKey: string, data: T, language: SupportedLanguage, source: 'api' | 'fallback' = 'api'): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL,
      language,
      source
    });
  }

  /**
   * Detect request language
   */
  private detectRequestLanguage(request: any): SupportedLanguage {
    if (request.language) return request.language;
    
    const content = JSON.stringify(request);
    const detection = autoDetectLanguage({ 
      cvContent: content,
      summary: request.summary || '',
      experience: request.workExperience || [],
      skills: request.skills || []
    });
    return detection.detectedLanguage;
  }

  /**
   * Make ChatGPT API request with error handling and retries
   */
  private async makeOpenAIRequest(messages: ChatMessage[], retryCount = 0): Promise<OpenAIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      this.usageTracker.trackRequest();

      const response = await fetch(this.config.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        } as OpenAIRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      this.usageTracker.trackSuccess({
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.usageTracker.trackError(error as Error);

      if (retryCount < this.config.retryAttempts) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeOpenAIRequest(messages, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Process OpenAI response
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
   * Core API request method with caching and error handling
   */
  async makeRequest(template: PromptTemplate, context: PromptContext): Promise<AIResponse<string>> {
    const language = this.detectRequestLanguage(context);
    const cacheKey = this.generateCacheKey('makeRequest', { template, context }, language);

    try {
      // Check cache first
      const cached = this.getCachedResponse<string>(cacheKey);
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
      const requestPromise = this.executeRequest(template, context, language);
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
      console.error('Unified ChatGPT Service Error:', error);
      
      // Fallback to error handler
      const fallbackResult = await this.errorHandler.handleError(error as Error, template, context, language);
      this.setCachedResponse(cacheKey, fallbackResult, language, 'fallback');
      
      return {
        success: true,
        data: fallbackResult,
        language,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute API request
   */
  private async executeRequest(template: PromptTemplate, context: PromptContext, language: SupportedLanguage): Promise<string> {
    const prompt = template.formatPrompt(context, language);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ];

    const response = await this.makeOpenAIRequest(messages);
    return this.processOpenAIResponse(response);
  }

  /**
   * Generate CV summary with context awareness
   */
  async generateCVSummary(request: CVSummaryRequest): Promise<AIResponse<string>> {
    const language = request.language || this.detectRequestLanguage(request);
    
    const template = PromptTemplate.getCVSummaryTemplate(language);
    const context: PromptContext = {
      workExperience: request.cvData.experience?.map(exp => 
        `${exp.title} ${language === 'vi' ? 'tại' : 'at'} ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
      ).join('\n') || '',
      skills: request.cvData.skills?.join(', ') || '',
      education: request.cvData.education?.map(edu => 
        `${edu.degree} ${language === 'vi' ? 'tại' : 'at'} ${edu.school}`
      ).join('\n') || '',
      targetJob: request.targetJob || '',
      existingContent: request.cvData.summary || ''
    };

    return this.makeRequest(template, context);
  }

  /**
   * Analyze job description and extract requirements
   */
  async analyzeJobDescription(request: JobAnalysisRequest): Promise<AIResponse<any>> {
    const language = request.language || this.detectRequestLanguage(request);
    
    const template = PromptTemplate.getJobAnalysisTemplate(language, request.analysisType || 'comprehensive');
    const context: PromptContext = {
      jobDescription: request.jobDescription,
      currentCV: JSON.stringify(request.cvData || {}),
      analysisType: request.analysisType || 'comprehensive'
    };

    const response = await this.makeRequest(template, context);
    
    if (response.success && response.data) {
      // Parse structured response
      try {
        const parsed = this.parseJobAnalysisResponse(response.data, language);
        return {
          ...response,
          data: parsed
        };
      } catch (error) {
        // Return raw response if parsing fails
        return response;
      }
    }

    return response;
  }

  /**
   * Generate bullet points for work experience
   */
  async generateBulletPoints(request: BulletGenerationRequest): Promise<AIResponse<string[]>> {
    const language = request.language || this.detectRequestLanguage(request);
    
    const template = PromptTemplate.getBulletGenerationTemplate(language, request.type || 'standard');
    const context: PromptContext = {
      jobTitle: request.jobTitle,
      company: request.company,
      workExperience: request.context?.experience?.map(exp => 
        `${exp.title} ${language === 'vi' ? 'tại' : 'at'} ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
      ).join('\n') || '',
      skills: request.context?.skills?.join(', ') || '',
      targetJob: request.context?.targetJob || ''
    };

    const response = await this.makeRequest(template, context);
    
    if (response.success && response.data) {
      // Parse bullet points from response
      const bullets = response.data.split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line: string) => line.length > 0);
        
      return {
        ...response,
        data: bullets
      };
    }

    return response as AIResponse<string[]>;
  }

  /**
   * Improve existing CV content
   */
  async improveCVContent(request: ContentImprovementRequest): Promise<AIResponse<string>> {
    const language = request.language || this.detectRequestLanguage(request);
    
    const template = PromptTemplate.getContentImprovementTemplate(language, request.contentType);
    const context: PromptContext = {
      existingContent: request.content,
      contentType: request.contentType,
      workExperience: request.context?.cvData?.experience?.map((exp: any) => 
        `${exp.title} ${language === 'vi' ? 'tại' : 'at'} ${exp.company}: ${exp.description || exp.bullets?.join(', ') || ''}`
      ).join('\n') || '',
      targetJob: request.context?.targetJob || ''
    };

    return this.makeRequest(template, context);
  }

  /**
   * Parse job analysis response into structured format
   */
  private parseJobAnalysisResponse(response: string, language: SupportedLanguage): any {
    // Implementation would parse the AI response into structured data
    // This is a simplified version - real implementation would be more robust
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      summary: lines.filter(line => line.includes(language === 'vi' ? 'TÓM TẮT' : 'SUMMARY')),
      requirements: lines.filter(line => line.includes(language === 'vi' ? 'YÊU CẦU' : 'REQUIREMENTS')),
      keywords: lines.filter(line => line.includes(language === 'vi' ? 'TỪ KHÓA' : 'KEYWORDS')),
      // Compatibility score removed - focus on keyword matching only
      recommendations: lines.filter(line => line.includes(language === 'vi' ? 'GỢI Ý' : 'RECOMMENDATIONS'))
    };
  }

  /**
   * Get cached response statistics
   */
  getCacheStatistics(): { size: number; hitRate: number; entries: number } {
    return {
      size: this.cache.size,
      hitRate: this.usageTracker.getCacheHitRate(),
      entries: this.cache.size
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics(): any {
    return this.usageTracker.getStatistics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate response quality
   */
  async validateResponse(response: any): Promise<boolean> {
    if (!response || typeof response !== 'string') return false;
    if (response.trim().length < 10) return false;
    if (response.includes('Error:') || response.includes('Failed:')) return false;
    return true;
  }
} 