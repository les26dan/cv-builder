/**
 * AI Service Tests
 * Comprehensive test suite for ChatGPT API integration
 * Following OkBuddy development tenet 5: Relentless, Rigorous Testing & Code Health
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiService, type AIResponse, type SummaryGenerationRequest, type EnhancedSummaryGenerationRequest, type BulletGenerationRequest, type WizardBulletGenerationRequest, type SkillSuggestionRequest, type ContentImprovementRequest, type JobAnalysisRequest } from '../aiService';
import { autoDetectLanguage } from '../languageDetection';

// Mock dependencies
vi.mock('../languageDetection');
vi.mock('../../config/environment', () => ({
  environmentConfig: {
    ai: {
      openaiApiKey: 'test-key',
      openaiApiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      maxTokens: 2048,
      temperature: 0.7,
      enableCaching: true,
      cacheTTL: 3600000,
      retryAttempts: 3,
      timeout: 30000
    }
  }
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any cached data
    (aiService as any).cache.clear();
    (aiService as any).requestQueue.clear();
    
    // Mock language detection to return Vietnamese by default
    vi.mocked(autoDetectLanguage).mockReturnValue({
      detectedLanguage: 'vi',
      confidence: 0.8,
      source: 'content',
      fallback: 'vi'
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateSummary', () => {
    const mockRequest: SummaryGenerationRequest = {
      workExperience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp',
          description: 'Developed web applications'
        }
      ],
      existingContent: '',
      targetJobDescription: 'Senior developer position'
    };

    test('should generate summary with Vietnamese prompts', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Lập trình viên phần mềm với kinh nghiệm phát triển ứng dụng web tại Tech Corp. Có khả năng làm việc độc lập và tham gia các dự án quan trọng.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Lập trình viên phần mềm');
      expect(result.language).toBe('vi');
      expect(result.source).toBe('api');
    });

    test('should handle English language detection', async () => {
      vi.mocked(autoDetectLanguage).mockReturnValueOnce({
        detectedLanguage: 'en',
        confidence: 0.9,
        source: 'content',
        fallback: 'en'
      });

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Experienced software developer with expertise in web application development at Tech Corp.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Experienced software developer');
      expect(result.language).toBe('en');
    });

    test('should return cached response on second call', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Cached summary response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      // First call
      const result1 = await aiService.generateSummary(mockRequest);
      
      // Second call (should be cached)
      const result2 = await aiService.generateSummary(mockRequest);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.source).toBe('cache');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateEnhancedSummary', () => {
    const mockRequest: EnhancedSummaryGenerationRequest = {
      workExperience: [
        {
          title: 'Senior Developer',
          company: 'Tech Inc',
          description: 'Led development team'
        }
      ],
      skills: ['JavaScript', 'React'],
      education: [
        {
          degree: 'Computer Science',
          institution: 'University'
        }
      ],
      existingContent: ''
    };

    test('should generate enhanced summary with full context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Tôi là một Senior Developer có kinh nghiệm quản lý nhóm phát triển tại Tech Inc với kỹ năng JavaScript và React.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 150, completion_tokens: 60, total_tokens: 210 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateEnhancedSummary(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Senior Developer');
      expect(result.data).toContain('JavaScript');
    });

    test('should handle empty experience gracefully', async () => {
      const requestWithoutExperience = {
        ...mockRequest,
        workExperience: []
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Ứng viên mới tốt nghiệp ngành Khoa học máy tính với kỹ năng JavaScript và React.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateEnhancedSummary(requestWithoutExperience);

      expect(result.success).toBe(true);
      expect(result.data).toContain('tốt nghiệp');
    });
  });

  describe('generateBulletPoints', () => {
    const mockRequest: BulletGenerationRequest = {
      jobTitle: 'Frontend Developer',
      company: 'StartupXYZ',
      existingBullets: [],
      targetJobDescription: 'React developer role'
    };

    test('should generate bullet points', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '• Phát triển ứng dụng React với hiệu suất cao\n• Tối ưu hóa trải nghiệm người dùng\n• Tham gia code review và đảm bảo chất lượng code'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 120, completion_tokens: 80, total_tokens: 200 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateBulletPoints(mockRequest);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0]).toContain('Phát triển ứng dụng React');
    });

    test('should handle existing bullets and avoid duplication', async () => {
      const requestWithExisting = {
        ...mockRequest,
        existingBullets: ['Developed React components']
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: '• Tối ưu hóa hiệu suất ứng dụng\n• Triển khai testing tự động\n• Mentoring junior developers'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 140, completion_tokens: 60, total_tokens: 200 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateBulletPoints(requestWithExisting);

      expect(result.success).toBe(true);
      expect(result.data).not.toContain('Developed React components');
    });
  });

  describe('generateBulletFromWizard', () => {
    const mockRequest: WizardBulletGenerationRequest = {
      project: 'E-commerce platform',
      impact: 'Increased conversion rate by 25%',
      responsibility: 'Frontend development and optimization',
      jobTitle: 'Frontend Developer',
      company: 'TechCorp'
    };

    test('should generate bullet from wizard inputs', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '• Phát triển và tối ưu hóa nền tảng thương mại điện tử, góp phần tăng tỷ lệ chuyển đổi 25% thông qua cải thiện giao diện và trải nghiệm người dùng'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 130, completion_tokens: 70, total_tokens: 200 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateBulletFromWizard(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toContain('thương mại điện tử');
      expect(result.data).toContain('25%');
      expect(result.data).toContain('tối ưu hóa');
    });

    test('should handle missing impact gracefully', async () => {
      const requestWithoutImpact = {
        ...mockRequest,
        impact: ''
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: '• Phát triển nền tảng thương mại điện tử, đảm nhận vai trò frontend development và tối ưu hóa hiệu suất hệ thống'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 120, completion_tokens: 50, total_tokens: 170 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateBulletFromWizard(requestWithoutImpact);

      expect(result.success).toBe(true);
      expect(result.data).toContain('nền tảng thương mại điện tử');
    });
  });

  describe('suggestSkills', () => {
    const mockRequest: SkillSuggestionRequest = {
      currentSkills: ['JavaScript', 'React'],
      workExperience: [
        {
          title: 'Frontend Developer',
          company: 'Tech Co',
          description: 'Worked with modern frameworks'
        }
      ],
      targetJobDescription: 'Full stack developer position requiring Node.js and databases'
    };

    test('should suggest relevant skills', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Node.js, MongoDB, Express.js, TypeScript, Git, Docker, AWS, Redux'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 130, completion_tokens: 30, total_tokens: 160 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.suggestSkills(mockRequest);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeLessThanOrEqual(8);
      expect(result.data).toContain('Node.js');
      expect(result.data).not.toContain('JavaScript'); // Should not include existing skills
    });

    test('should handle empty target job description', async () => {
      const requestWithoutJD = {
        ...mockRequest,
        targetJobDescription: ''
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'TypeScript, Vue.js, Angular, Webpack, Jest, Cypress, SCSS, Redux'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 25, total_tokens: 125 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.suggestSkills(requestWithoutJD);

      expect(result.success).toBe(true);
      expect(result.data).toContain('TypeScript');
    });
  });

  describe('analyzeJobDescription', () => {
    const mockRequest: JobAnalysisRequest = {
      jobDescription: 'We are looking for a senior React developer with Node.js experience. Must have 5+ years experience in JavaScript and modern frameworks.',
      currentCV: {
        summary: 'Frontend developer',
        skills: ['React', 'JavaScript']
      }
    };

    test('should analyze job description and provide suggestions', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: `Phân tích mô tả công việc:

1. Từ khóa quan trọng:
- React
- Node.js
- JavaScript
- Senior developer

2. Kỹ năng thiếu:
- Node.js backend development
- 5+ years experience emphasis

3. Đánh giá mức độ phù hợp: 75%

4. Gợi ý cải thiện:
- Bổ sung kinh nghiệm Node.js
- Nhấn mạnh số năm kinh nghiệm`
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.analyzeJobDescription(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('keywords');
      expect(result.data).toHaveProperty('compatibility');
      expect(result.data!.compatibility).toBe(75);
    });

    test('should handle empty job description', async () => {
      const requestWithoutJD = {
        ...mockRequest,
        jobDescription: ''
      };

      const result = await aiService.analyzeJobDescription(requestWithoutJD);

      expect(result.success).toBe(true);
      expect(result.source).toBe('fallback');
    });
  });

  describe('Error Handling', () => {
    const mockRequest: SummaryGenerationRequest = {
      workExperience: [],
      existingContent: '',
      targetJobDescription: ''
    };

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      });

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.source).toBe('fallback');
      expect(result.error).toBeDefined();
    });

    test('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          choices: [] // Empty choices array
        })
      });

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.source).toBe('fallback');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.source).toBe('fallback');
      expect(result.error).toContain('Network error');
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await aiService.generateSummary(mockRequest);

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.source).toBe('fallback');
    });
  });

  describe('Caching System', () => {
    const mockRequest: SummaryGenerationRequest = {
      workExperience: [
        {
          title: 'Developer',
          company: 'Test Corp',
          description: 'Test description'
        }
      ],
      existingContent: '',
      targetJobDescription: ''
    };

    test('should cache successful responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test summary response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      // First call - should hit API
      const result1 = await aiService.generateSummary(mockRequest);
      expect(result1.source).toBe('api');

      // Second call - should use cache
      const result2 = await aiService.generateSummary(mockRequest);
      expect(result2.source).toBe('cache');
      expect(result2.data).toBe(result1.data);

      // Should only call fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should handle cache expiration', async () => {
      // Mock short TTL for testing
      const originalTTL = (aiService as any).cacheTTL;
      (aiService as any).cacheTTL = 10; // 10ms

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      // First call
      await aiService.generateSummary(mockRequest);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      // Second call should hit API again
      await aiService.generateSummary(mockRequest);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore original TTL
      (aiService as any).cacheTTL = originalTTL;
    });
  });

  describe('Request Deduplication', () => {
    const mockRequest: SummaryGenerationRequest = {
      workExperience: [
        {
          title: 'Test Developer',
          company: 'Test Corp',
          description: 'Test work'
        }
      ],
      existingContent: '',
      targetJobDescription: ''
    };

    test('should deduplicate concurrent requests', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Concurrent test response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      // Simulate slow API response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse)
          }), 100)
        )
      );

      // Make concurrent requests
      const [result1, result2, result3] = await Promise.all([
        aiService.generateSummary(mockRequest),
        aiService.generateSummary(mockRequest),
        aiService.generateSummary(mockRequest)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.data).toBe(result2.data);
      expect(result2.data).toBe(result3.data);

      // Should only call fetch once despite 3 concurrent requests
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Language Detection Integration', () => {
    test('should use detected language for prompts', async () => {
      vi.mocked(autoDetectLanguage).mockReturnValueOnce({
        detectedLanguage: 'en',
        confidence: 0.9,
        source: 'content',
        fallback: 'en'
      });

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'English language response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateSummary({
        workExperience: [],
        existingContent: '',
        targetJobDescription: ''
      });

      expect(result.language).toBe('en');
    });

         test('should fall back to Vietnamese for uncertain language detection', async () => {
       vi.mocked(autoDetectLanguage).mockReturnValueOnce({
         detectedLanguage: 'vi',
         confidence: 0.3,
         source: 'default',
         fallback: 'vi'
       });

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Vietnamese fallback response'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await aiService.generateSummary({
        workExperience: [],
        existingContent: '',
        targetJobDescription: ''
      });

      expect(result.language).toBe('vi');
    });
  });
}); 