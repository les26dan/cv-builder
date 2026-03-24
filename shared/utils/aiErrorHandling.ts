/**
 * Unified AI Error Handling - Cross-Project Error Management
 * Following OkBuddy tenets: modular, swappable, consistent error handling
 * Centralized error handling for all AI-related functionality
 */

import { AIError, SupportedLanguage, PromptContext } from '../types/aiInterfaces';
import { PromptTemplate } from './promptTemplates';
import { AIConfig } from '../config/aiConfig';

/**
 * AI Error Handler Class
 * Manages error categorization, logging, fallback responses, and user-friendly messages
 */
export class AIErrorHandler {
  private config: AIConfig;
  private errorCounts = new Map<string, number>();
  private lastErrorTime = new Map<string, number>();

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Handle AI service errors with appropriate responses
   */
  async handleError(
    error: Error,
    template: PromptTemplate,
    context: PromptContext,
    language: SupportedLanguage
  ): Promise<string> {
    const aiError = this.categorizeError(error);
    await this.logError(aiError, template, context);

    // Update error tracking
    this.updateErrorTracking(aiError.code);

    // Check if fallback is enabled
    if (!this.config.fallbackEnabled) {
      throw error;
    }

    // Generate fallback response
    return this.generateFallbackResponse(template, context, language, aiError);
  }

  /**
   * Categorize error into structured AIError
   */
  private categorizeError(error: Error): AIError {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        type: 'network',
        retryable: true,
        context: { originalError: error.name }
      };
    }

    // OpenAI API errors
    if (message.includes('openai') || message.includes('api')) {
      if (message.includes('401') || message.includes('unauthorized')) {
        return {
          code: 'AUTH_ERROR',
          message: 'Invalid API key or unauthorized access',
          type: 'api',
          retryable: false,
          context: { statusCode: 401 }
        };
      }

      if (message.includes('429') || message.includes('rate limit')) {
        return {
          code: 'RATE_LIMIT_ERROR',
          message: 'API rate limit exceeded',
          type: 'api',
          retryable: true,
          context: { statusCode: 429 }
        };
      }

      if (message.includes('500') || message.includes('502') || message.includes('503')) {
        return {
          code: 'SERVER_ERROR',
          message: 'OpenAI server error',
          type: 'api',
          retryable: true,
          context: { statusCode: 500 }
        };
      }
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        type: 'timeout',
        retryable: true,
        context: { timeout: this.config.timeout }
      };
    }

    // Parsing errors
    if (message.includes('json') || message.includes('parse')) {
      return {
        code: 'PARSING_ERROR',
        message: 'Failed to parse API response',
        type: 'parsing',
        retryable: false,
        context: { originalError: error.message }
      };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request or response format',
        type: 'validation',
        retryable: false,
        context: { originalError: error.message }
      };
    }

    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      type: 'api',
      retryable: false,
      context: { originalError: error.name }
    };
  }

  /**
   * Log error for monitoring and debugging
   */
  private async logError(
    aiError: AIError,
    template: PromptTemplate,
    context: PromptContext
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: aiError,
      template: {
        id: template.id,
        name: template.name
      },
      context: {
        hasJobDescription: !!context.jobDescription,
        hasWorkExperience: !!context.workExperience,
        hasTargetJob: !!context.targetJob,
        language: context.language
      },
      config: {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        timeout: this.config.timeout
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Service Error:', logEntry);
    }

    // In production, this would integrate with monitoring services
    // TODO: Integrate with monitoring service (DataDog, Sentry, etc.)
  }

  /**
   * Update error tracking for circuit breaker pattern
   */
  private updateErrorTracking(errorCode: string): void {
    const now = Date.now();
    const currentCount = this.errorCounts.get(errorCode) || 0;
    const lastError = this.lastErrorTime.get(errorCode) || 0;

    // Reset count if last error was more than 5 minutes ago
    if (now - lastError > 300000) { // 5 minutes
      this.errorCounts.set(errorCode, 1);
    } else {
      this.errorCounts.set(errorCode, currentCount + 1);
    }

    this.lastErrorTime.set(errorCode, now);
  }

  /**
   * Generate fallback response based on template and context
   */
  private generateFallbackResponse(
    template: PromptTemplate,
    context: PromptContext,
    language: SupportedLanguage,
    aiError: AIError
  ): string {
    const templateId = template.id;

    // Summary generation fallbacks
    if (templateId.includes('summary')) {
      return this.generateSummaryFallback(context, language);
    }

    // Bullet generation fallbacks
    if (templateId.includes('bullet')) {
      return this.generateBulletFallback(context, language);
    }

    // Job analysis fallbacks
    if (templateId.includes('job-analysis')) {
      return this.generateJobAnalysisFallback(context, language);
    }

    // Content improvement fallbacks
    if (templateId.includes('improvement')) {
      return this.generateImprovementFallback(context, language);
    }

    // Generic fallback
    return this.generateGenericFallback(language, aiError);
  }

  /**
   * Generate summary fallback response
   */
  private generateSummaryFallback(context: PromptContext, language: SupportedLanguage): string {
    if (language === 'vi') {
      const experience = context.workExperience ? 
        'với kinh nghiệm trong các lĩnh vực đa dạng' : 'mong muốn đóng góp và phát triển';
      
      return `Chuyên viên ${experience}, có khả năng làm việc nhóm tốt và mong muốn mang lại giá trị cho tổ chức. ` +
             `Có tinh thần học hỏi cao và sẵn sàng đối mặt với thử thách mới để phát triển bản thân và sự nghiệp.`;
    } else {
      const experience = context.workExperience ?
        'with diverse experience across multiple domains' : 'eager to contribute and grow';

      return `Professional ${experience}, demonstrating strong teamwork abilities and commitment to delivering value. ` +
             `Possesses a growth mindset and readiness to tackle new challenges for career advancement.`;
    }
  }

  /**
   * Generate bullet point fallback response
   */
  private generateBulletFallback(context: PromptContext, language: SupportedLanguage): string {
    const jobTitle = context.jobTitle || (language === 'vi' ? 'Chuyên viên' : 'Professional');
    const company = context.company || (language === 'vi' ? 'Công ty' : 'Company');

    if (language === 'vi') {
      return `• Thực hiện các nhiệm vụ chuyên môn tại ${company} với vai trò ${jobTitle}
• Phối hợp hiệu quả với đội ngũ để đạt được mục tiêu chung
• Tham gia các dự án quan trọng và đóng góp ý kiến xây dựng
• Học hỏi và áp dụng kiến thức mới để cải thiện hiệu suất công việc
• Hỗ trợ đồng nghiệp và duy trì môi trường làm việc tích cực`;
    } else {
      return `• Executed professional responsibilities in ${jobTitle} role at ${company}
• Collaborated effectively with cross-functional teams to achieve shared objectives
• Contributed to key projects and provided valuable insights for improvement
• Continuously learned and applied new skills to enhance work performance
• Supported colleagues and maintained a positive work environment`;
    }
  }

  /**
   * Generate job analysis fallback response
   */
  private generateJobAnalysisFallback(context: PromptContext, language: SupportedLanguage): string {
    if (language === 'vi') {
      return `PHÂN TÍCH CÔNG VIỆC:

1. TÓM TẮT: Vị trí này yêu cầu ứng viên có kỹ năng chuyên môn phù hợp và khả năng làm việc nhóm tốt.

2. YÊU CẦU: 
   - Bắt buộc: Kinh nghiệm liên quan, kỹ năng giao tiếp
   - Mong muốn: Bằng cấp phù hợp, kinh nghiệm dự án

3. KỸNĂNG: Thêm React, Node.js, TypeScript
4. TỪ KHÓA: Programming, Full-stack, Database
5. GỢI Ý: Cập nhật summary với các từ khóa chính

ENGLISH FALLBACK:
1. SUMMARY: Add specific technical keywords  
2. EXPERIENCE: Include quantified achievements
3. SKILLS: Add React, Node.js, TypeScript
4. KEYWORDS: Programming, Full-stack, Database  
5. RECOMMENDATIONS: Update summary with key terms`;
    } else {
      return `JOB ANALYSIS:

1. SUMMARY: Add technical keywords and professional achievements

2. EXPERIENCE: Highlight relevant experience and quantified results

3. SKILLS: Add React, Node.js, TypeScript

4. KEYWORDS: Programming, Full-stack, Database

5. RECOMMENDATIONS: Update summary with key terms from job description`;
    }
  }

  /**
   * Generate content improvement fallback response
   */
  private generateImprovementFallback(context: PromptContext, language: SupportedLanguage): string {
    const existingContent = context.existingContent || '';
    
    if (!existingContent) {
      return language === 'vi' ? 
        'Vui lòng cung cấp nội dung cần cải thiện.' :
        'Please provide content that needs improvement.';
    }

    // Simple improvement: capitalize first letter and add period if missing
    let improved = existingContent.trim();
    if (improved.length > 0) {
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
      if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
        improved += '.';
      }
    }

    return improved;
  }

  /**
   * Generate generic fallback response
   */
  private generateGenericFallback(language: SupportedLanguage, aiError: AIError): string {
    if (language === 'vi') {
      switch (aiError.type) {
        case 'network':
          return 'Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.';
        case 'timeout':
          return 'Yêu cầu xử lý quá lâu. Vui lòng thử lại.';
        case 'api':
          return 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.';
        default:
          return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      }
    } else {
      switch (aiError.type) {
        case 'network':
          return 'Unable to connect to AI service. Please try again later.';
        case 'timeout':
          return 'Request took too long to process. Please try again.';
        case 'api':
          return 'AI service temporarily unavailable. Please try again later.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(aiError: AIError, language: SupportedLanguage): string {
    if (language === 'vi') {
      switch (aiError.code) {
        case 'NETWORK_ERROR':
          return 'Không thể kết nối mạng. Vui lòng kiểm tra kết nối internet.';
        case 'AUTH_ERROR':
          return 'Lỗi xác thực dịch vụ AI. Vui lòng liên hệ hỗ trợ.';
        case 'RATE_LIMIT_ERROR':
          return 'Đã đạt giới hạn sử dụng. Vui lòng thử lại sau vài phút.';
        case 'TIMEOUT_ERROR':
          return 'Yêu cầu xử lý quá lâu. Vui lòng thử lại.';
        case 'SERVER_ERROR':
          return 'Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại sau.';
        default:
          return 'Đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ hỗ trợ.';
      }
    } else {
      switch (aiError.code) {
        case 'NETWORK_ERROR':
          return 'Network connection failed. Please check your internet connection.';
        case 'AUTH_ERROR':
          return 'AI service authentication error. Please contact support.';
        case 'RATE_LIMIT_ERROR':
          return 'Usage limit reached. Please try again in a few minutes.';
        case 'TIMEOUT_ERROR':
          return 'Request timed out. Please try again.';
        case 'SERVER_ERROR':
          return 'AI service temporarily unavailable. Please try again later.';
        default:
          return 'An error occurred. Please try again or contact support.';
      }
    }
  }

  /**
   * Check if circuit breaker should be triggered
   */
  shouldTriggerCircuitBreaker(errorCode: string): boolean {
    const errorCount = this.errorCounts.get(errorCode) || 0;
    const maxErrors = 5; // Trigger circuit breaker after 5 consecutive errors
    
    return errorCount >= maxErrors;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): { [errorCode: string]: number } {
    const stats: { [errorCode: string]: number } = {};
    this.errorCounts.forEach((count, code) => {
      stats[code] = count;
    });
    return stats;
  }

  /**
   * Reset error tracking
   */
  resetErrorTracking(): void {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    const aiError = this.categorizeError(error);
    return aiError.retryable && !this.shouldTriggerCircuitBreaker(aiError.code);
  }
} 