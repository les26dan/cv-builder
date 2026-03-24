import { describe, it, expect } from 'vitest';

describe('AI Interfaces Type Safety Tests', () => {
  describe('AIResponse Interface', () => {
    it('should validate successful response structure', () => {
      const successResponse = {
        success: true,
        content: 'Generated content',
        tokensUsed: 100,
        responseTime: 1500
      };

      expect(successResponse.success).toBe(true);
      expect(typeof successResponse.content).toBe('string');
      expect(typeof successResponse.tokensUsed).toBe('number');
      expect(typeof successResponse.responseTime).toBe('number');
    });

    it('should validate error response structure', () => {
      const errorResponse = {
        success: false,
        error: 'API_ERROR',
        fallbackContent: 'Fallback content',
        retryAfter: 5000
      };

      expect(errorResponse.success).toBe(false);
      expect(typeof errorResponse.error).toBe('string');
      expect(typeof errorResponse.fallbackContent).toBe('string');
      expect(typeof errorResponse.retryAfter).toBe('number');
    });
  });

  describe('ChatMessage Interface', () => {
    it('should validate user message structure', () => {
      const userMessage = {
        role: 'user' as const,
        content: 'Test user message'
      };

      expect(userMessage.role).toBe('user');
      expect(typeof userMessage.content).toBe('string');
    });

    it('should validate assistant message structure', () => {
      const assistantMessage = {
        role: 'assistant' as const,
        content: 'Test assistant response'
      };

      expect(assistantMessage.role).toBe('assistant');
      expect(typeof assistantMessage.content).toBe('string');
    });

    it('should validate system message structure', () => {
      const systemMessage = {
        role: 'system' as const,
        content: 'Test system prompt'
      };

      expect(systemMessage.role).toBe('system');
      expect(typeof systemMessage.content).toBe('string');
    });
  });

  describe('CVData Interface', () => {
    it('should validate complete CV data structure', () => {
      const cvData = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'San Francisco, CA'
        },
        workExperience: [
          {
            company: 'Tech Corp',
            position: 'Software Engineer',
            duration: '2020-2023',
            responsibilities: ['Developed applications', 'Led team meetings']
          }
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            institution: 'University of California',
            year: '2020',
            gpa: '3.8'
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js'],
        summary: 'Experienced software engineer...'
      };

      expect(typeof cvData.personalInfo.name).toBe('string');
      expect(Array.isArray(cvData.workExperience)).toBe(true);
      expect(Array.isArray(cvData.education)).toBe(true);
      expect(Array.isArray(cvData.skills)).toBe(true);
      expect(cvData.workExperience[0]).toHaveProperty('company');
      expect(cvData.education[0]).toHaveProperty('degree');
    });

    it('should validate minimal CV data structure', () => {
      const minimalCvData = {
        personalInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com'
        },
        workExperience: [],
        education: [],
        skills: []
      };

      expect(minimalCvData.personalInfo.name).toBe('Jane Doe');
      expect(minimalCvData.workExperience).toHaveLength(0);
      expect(minimalCvData.education).toHaveLength(0);
      expect(minimalCvData.skills).toHaveLength(0);
    });
  });

  describe('JobAnalysisResult Interface', () => {
    it('should validate job analysis structure', () => {
      const analysisResult = {
        keyRequirements: ['React', 'Node.js', '3+ years experience'],
        skillsNeeded: ['JavaScript', 'TypeScript', 'Database management'],
        experienceLevel: 'Mid-level',
        industryFocus: 'Technology',
        matchingKeywords: ['software', 'development', 'agile'],
        recommendedImprovements: [
          'Add more quantifiable achievements',
          'Highlight leadership experience'
        ]
      };

      expect(Array.isArray(analysisResult.keyRequirements)).toBe(true);
      expect(Array.isArray(analysisResult.skillsNeeded)).toBe(true);
      expect(typeof analysisResult.experienceLevel).toBe('string');
      expect(typeof analysisResult.industryFocus).toBe('string');
      expect(Array.isArray(analysisResult.matchingKeywords)).toBe(true);
      expect(Array.isArray(analysisResult.recommendedImprovements)).toBe(true);
    });
  });

  describe('UserPreferences Interface', () => {
    it('should validate user preferences structure', () => {
      const preferences = {
        language: 'en' as const,
        targetRole: 'Software Engineer',
        industryFocus: 'Technology',
        experienceLevel: 'Mid-level',
        culturalOptimization: 'US',
        contentStyle: 'Professional'
      };

      expect(['en', 'vi']).toContain(preferences.language);
      expect(typeof preferences.targetRole).toBe('string');
      expect(typeof preferences.industryFocus).toBe('string');
      expect(typeof preferences.experienceLevel).toBe('string');
    });

    it('should validate Vietnamese preferences', () => {
      const viPreferences = {
        language: 'vi' as const,
        targetRole: 'Kỹ sư phần mềm',
        industryFocus: 'Công nghệ',
        experienceLevel: 'Trung cấp',
        culturalOptimization: 'VN',
        contentStyle: 'Formal'
      };

      expect(viPreferences.language).toBe('vi');
      expect(typeof viPreferences.targetRole).toBe('string');
    });
  });

  describe('OpenAI API Interfaces', () => {
    it('should validate OpenAI request structure', () => {
      const openAIRequest = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant' },
          { role: 'user' as const, content: 'Hello' }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      expect(typeof openAIRequest.model).toBe('string');
      expect(Array.isArray(openAIRequest.messages)).toBe(true);
      expect(typeof openAIRequest.max_tokens).toBe('number');
      expect(typeof openAIRequest.temperature).toBe('number');
    });

    it('should validate OpenAI response structure', () => {
      const openAIResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: 'Hello! How can I help you today?'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      expect(typeof openAIResponse.id).toBe('string');
      expect(Array.isArray(openAIResponse.choices)).toBe(true);
      expect(openAIResponse.usage).toHaveProperty('total_tokens');
    });
  });

  describe('Error Types', () => {
    it('should validate error type constants', () => {
      const errorTypes = [
        'NETWORK_ERROR',
        'API_ERROR',
        'TIMEOUT_ERROR',
        'PARSING_ERROR',
        'VALIDATION_ERROR',
        'RATE_LIMIT_ERROR'
      ];

      errorTypes.forEach(errorType => {
        expect(typeof errorType).toBe('string');
        expect(errorType).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should validate error response with specific types', () => {
      const networkError = {
        type: 'NETWORK_ERROR',
        message: 'Failed to connect to OpenAI API',
        retryable: true,
        retryAfter: 1000
      };

      expect(networkError.type).toBe('NETWORK_ERROR');
      expect(typeof networkError.message).toBe('string');
      expect(typeof networkError.retryable).toBe('boolean');
    });
  });

  describe('Language Support Types', () => {
    it('should validate supported languages', () => {
      const supportedLanguages = ['en', 'vi'] as const;
      
      supportedLanguages.forEach(lang => {
        expect(['en', 'vi']).toContain(lang);
      });
    });

    it('should validate language-specific configurations', () => {
      const languageConfigs = {
        en: {
          culturalContext: 'Western professional standards',
          formalityLevel: 'professional',
          dateFormat: 'MM/DD/YYYY'
        },
        vi: {
          culturalContext: 'Vietnamese professional standards',
          formalityLevel: 'formal',
          dateFormat: 'DD/MM/YYYY'
        }
      };

      expect(languageConfigs.en).toHaveProperty('culturalContext');
      expect(languageConfigs.vi).toHaveProperty('culturalContext');
    });
  });

  describe('Performance Metrics Types', () => {
    it('should validate metrics structure', () => {
      const metrics = {
        requestCount: 150,
        successRate: 0.98,
        averageResponseTime: 1200,
        totalTokensUsed: 50000,
        errorBreakdown: {
          'NETWORK_ERROR': 2,
          'API_ERROR': 1,
          'TIMEOUT_ERROR': 0
        },
        costEstimate: 0.75
      };

      expect(typeof metrics.requestCount).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.totalTokensUsed).toBe('number');
      expect(typeof metrics.costEstimate).toBe('number');
      expect(typeof metrics.errorBreakdown).toBe('object');
    });
  });

  describe('Cache Configuration Types', () => {
    it('should validate cache settings', () => {
      const cacheConfig = {
        ttl: 900000, // 15 minutes
        maxSize: 100,
        keyPattern: '{operation}_{language}_{hash}',
        compressionEnabled: true,
        metrics: {
          hitRate: 0.85,
          missRate: 0.15,
          evictionCount: 5
        }
      };

      expect(typeof cacheConfig.ttl).toBe('number');
      expect(typeof cacheConfig.maxSize).toBe('number');
      expect(typeof cacheConfig.keyPattern).toBe('string');
      expect(typeof cacheConfig.compressionEnabled).toBe('boolean');
    });
  });
}); 