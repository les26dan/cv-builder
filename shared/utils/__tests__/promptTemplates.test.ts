import { describe, it, expect, beforeEach } from 'vitest';

describe('Prompt Templates Tests', () => {
  describe('Template Structure Validation', () => {
    it('should validate basic template properties', () => {
      const baseTemplate = {
        systemPrompt: 'You are a professional CV writing assistant.',
        userPromptTemplate: 'Please help me improve: {content}',
        language: 'en' as const,
        context: {
          role: 'assistant',
          expertise: 'CV writing',
          tone: 'professional'
        }
      };

      expect(typeof baseTemplate.systemPrompt).toBe('string');
      expect(typeof baseTemplate.userPromptTemplate).toBe('string');
      expect(['en', 'vi']).toContain(baseTemplate.language);
      expect(baseTemplate.context).toHaveProperty('role');
    });

    it('should validate Vietnamese template properties', () => {
      const viTemplate = {
        systemPrompt: 'Bạn là trợ lý viết CV chuyên nghiệp.',
        userPromptTemplate: 'Vui lòng giúp tôi cải thiện: {content}',
        language: 'vi' as const,
        context: {
          role: 'trợ lý',
          expertise: 'viết CV',
          tone: 'lịch sự'
        }
      };

      expect(typeof viTemplate.systemPrompt).toBe('string');
      expect(viTemplate.language).toBe('vi');
      expect(viTemplate.systemPrompt).toContain('chuyên nghiệp');
    });
  });

  describe('CV Summary Templates', () => {
    it('should generate English CV summary prompt', () => {
      const generateCVSummaryPrompt = (cvData: any, language: string) => {
        const templates = {
          en: {
            system: 'You are a professional CV writing expert. Create compelling, concise summaries.',
            user: `Based on this CV data, create a professional summary:
Name: ${cvData.personalInfo?.name || 'N/A'}
Experience: ${cvData.workExperience?.length || 0} positions
Skills: ${cvData.skills?.join(', ') || 'N/A'}

Requirements:
- 2-3 sentences maximum
- Highlight key achievements
- Include years of experience
- Professional tone`
          },
          vi: {
            system: 'Bạn là chuyên gia viết CV chuyên nghiệp. Tạo tóm tắt hấp dẫn và súc tích.',
            user: `Dựa trên dữ liệu CV này, tạo một bản tóm tắt chuyên nghiệp:
Tên: ${cvData.personalInfo?.name || 'Không có'}
Kinh nghiệm: ${cvData.workExperience?.length || 0} vị trí
Kỹ năng: ${cvData.skills?.join(', ') || 'Không có'}

Yêu cầu:
- Tối đa 2-3 câu
- Nêu bật thành tựu chính
- Bao gồm số năm kinh nghiệm
- Tông điệu chuyên nghiệp`
          }
        };
        return templates[language as keyof typeof templates];
      };

      const mockCVData = {
        personalInfo: { name: 'John Doe' },
        workExperience: [{ company: 'Tech Corp' }],
        skills: ['JavaScript', 'React']
      };

      const enPrompt = generateCVSummaryPrompt(mockCVData, 'en');
      const viPrompt = generateCVSummaryPrompt(mockCVData, 'vi');

      expect(enPrompt.system).toContain('professional CV writing expert');
      expect(enPrompt.user).toContain('John Doe');
      expect(enPrompt.user).toContain('JavaScript, React');

      expect(viPrompt.system).toContain('chuyên gia viết CV');
      expect(viPrompt.user).toContain('John Doe');
      expect(viPrompt.user).toContain('JavaScript, React');
    });
  });

  describe('Job Description Analysis Templates', () => {
    it('should generate job analysis prompt', () => {
      const generateJobAnalysisPrompt = (jobDescription: string, language: string) => {
        const templates = {
          en: {
            system: 'You are an expert in job market analysis. Extract key requirements and provide structured analysis.',
            user: `Analyze this job description and provide a structured response:

${jobDescription}

Please provide a JSON response with:
{
  "keyRequirements": ["requirement1", "requirement2"],
  "skillsNeeded": ["skill1", "skill2"],
  "experienceLevel": "Junior/Mid/Senior",
  "industryFocus": "industry",
  "matchingKeywords": ["keyword1", "keyword2"]
}`
          },
          vi: {
            system: 'Bạn là chuyên gia phân tích thị trường việc làm. Trích xuất yêu cầu chính và cung cấp phân tích có cấu trúc.',
            user: `Phân tích mô tả công việc này và cung cấp phản hồi có cấu trúc:

${jobDescription}

Vui lòng cung cấp phản hồi JSON với:
{
  "keyRequirements": ["yêu cầu1", "yêu cầu2"],
  "skillsNeeded": ["kỹ năng1", "kỹ năng2"],
  "experienceLevel": "Mới/Trung cấp/Cao cấp",
  "industryFocus": "ngành nghề",
  "matchingKeywords": ["từ khóa1", "từ khóa2"]
}`
          }
        };
        return templates[language as keyof typeof templates];
      };

      const jobDesc = 'Software Engineer position requiring React and Node.js experience';
      
      const enPrompt = generateJobAnalysisPrompt(jobDesc, 'en');
      const viPrompt = generateJobAnalysisPrompt(jobDesc, 'vi');

      expect(enPrompt.system).toContain('job market analysis');
      expect(enPrompt.user).toContain(jobDesc);
      expect(enPrompt.user).toContain('keyRequirements');

      expect(viPrompt.system).toContain('thị trường việc làm');
      expect(viPrompt.user).toContain(jobDesc);
      expect(viPrompt.user).toContain('keyRequirements');
    });
  });

  describe('Bullet Point Generation Templates', () => {
    it('should generate bullet point prompts', () => {
      const generateBulletPointPrompt = (experience: any, language: string) => {
        const templates = {
          en: {
            system: 'You are a professional CV writer specializing in impactful bullet points with quantifiable achievements.',
            user: `Transform these job responsibilities into powerful CV bullet points:

Company: ${experience.company}
Position: ${experience.position}
Responsibilities: ${experience.responsibilities?.join(', ')}

Requirements:
- Start with strong action verbs
- Include quantifiable results when possible
- 2-3 bullet points maximum
- Professional tone
- Focus on achievements, not just duties

Provide JSON response: {"bulletPoints": ["point1", "point2"]}`
          },
          vi: {
            system: 'Bạn là nhà viết CV chuyên nghiệp chuyên về các điểm nhấn có tác động với thành tựu có thể định lượng.',
            user: `Chuyển đổi các trách nhiệm công việc này thành các điểm nhấn CV mạnh mẽ:

Công ty: ${experience.company}
Vị trí: ${experience.position}
Trách nhiệm: ${experience.responsibilities?.join(', ')}

Yêu cầu:
- Bắt đầu bằng động từ hành động mạnh
- Bao gồm kết quả có thể định lượng khi có thể
- Tối đa 2-3 điểm nhấn
- Tông điệu chuyên nghiệp
- Tập trung vào thành tựu, không chỉ nhiệm vụ

Cung cấp phản hồi JSON: {"bulletPoints": ["điểm1", "điểm2"]}`
          }
        };
        return templates[language as keyof typeof templates];
      };

      const mockExperience = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        responsibilities: ['Developed applications', 'Led team meetings']
      };

      const enPrompt = generateBulletPointPrompt(mockExperience, 'en');
      const viPrompt = generateBulletPointPrompt(mockExperience, 'vi');

      expect(enPrompt.user).toContain('Tech Corp');
      expect(enPrompt.user).toContain('Software Engineer');
      expect(enPrompt.user).toContain('action verbs');

      expect(viPrompt.user).toContain('Tech Corp');
      expect(viPrompt.user).toContain('Software Engineer');
      expect(viPrompt.user).toContain('động từ hành động');
    });
  });

  describe('Content Improvement Templates', () => {
    it('should generate content improvement prompts', () => {
      const generateImprovementPrompt = (content: string, context: any, language: string) => {
        const templates = {
          en: {
            system: 'You are a CV optimization expert. Improve content to match job requirements and industry standards.',
            user: `Improve this CV content for better impact:

Original Content: ${content}
Target Role: ${context.targetRole || 'N/A'}
Industry Focus: ${context.industryFocus || 'N/A'}

Requirements:
- Enhance with relevant keywords
- Improve readability and impact
- Maintain professional tone
- Add quantifiable achievements where possible

Provide JSON response:
{
  "improvedContent": "enhanced version",
  "improvements": ["change1", "change2"]
}`
          },
          vi: {
            system: 'Bạn là chuyên gia tối ưu hóa CV. Cải thiện nội dung để phù hợp với yêu cầu công việc và tiêu chuẩn ngành.',
            user: `Cải thiện nội dung CV này để có tác động tốt hơn:

Nội dung gốc: ${content}
Vai trò mục tiêu: ${context.targetRole || 'Không có'}
Tập trung ngành: ${context.industryFocus || 'Không có'}

Yêu cầu:
- Tăng cường với từ khóa liên quan
- Cải thiện khả năng đọc và tác động
- Duy trì tông điệu chuyên nghiệp
- Thêm thành tựu có thể định lượng khi có thể

Cung cấp phản hồi JSON:
{
  "improvedContent": "phiên bản cải tiến",
  "improvements": ["thay đổi1", "thay đổi2"]
}`
          }
        };
        return templates[language as keyof typeof templates];
      };

      const content = 'Basic job description';
      const context = { targetRole: 'Software Engineer', industryFocus: 'Technology' };

      const enPrompt = generateImprovementPrompt(content, context, 'en');
      const viPrompt = generateImprovementPrompt(content, context, 'vi');

      expect(enPrompt.user).toContain('Basic job description');
      expect(enPrompt.user).toContain('Software Engineer');
      expect(enPrompt.user).toContain('Technology');

      expect(viPrompt.user).toContain('Basic job description');
      expect(viPrompt.user).toContain('Software Engineer');
      expect(viPrompt.user).toContain('Technology');
    });
  });

  describe('Template Variable Replacement', () => {
    it('should replace template variables correctly', () => {
      const replaceVariables = (template: string, variables: Record<string, any>) => {
        let result = template;
        Object.keys(variables).forEach(key => {
          const placeholder = `{${key}}`;
          result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
        return result;
      };

      const template = 'Hello {name}, you have {count} items in {location}';
      const variables = {
        name: 'John',
        count: 5,
        location: 'your cart'
      };

      const result = replaceVariables(template, variables);
      expect(result).toBe('Hello John, you have 5 items in your cart');
    });

    it('should handle missing variables gracefully', () => {
      const replaceVariables = (template: string, variables: Record<string, any>) => {
        let result = template;
        Object.keys(variables).forEach(key => {
          const placeholder = `{${key}}`;
          result = result.replace(new RegExp(placeholder, 'g'), variables[key] || 'N/A');
        });
        return result;
      };

      const template = 'Hello {name}, you work at {company}';
      const variables = { name: 'John' }; // missing company

      const result = replaceVariables(template, variables);
      expect(result).toContain('John');
      expect(result).toContain('{company}'); // Should remain unreplaced
    });
  });

  describe('Context Validation', () => {
    it('should validate required context fields', () => {
      const validateContext = (context: any, requiredFields: string[]) => {
        const missing = requiredFields.filter(field => !context[field]);
        return {
          valid: missing.length === 0,
          missingFields: missing
        };
      };

      const context = {
        targetRole: 'Software Engineer',
        industryFocus: 'Technology'
        // missing experienceLevel
      };

      const validation = validateContext(context, ['targetRole', 'industryFocus', 'experienceLevel']);
      
      expect(validation.valid).toBe(false);
      expect(validation.missingFields).toContain('experienceLevel');
      expect(validation.missingFields).not.toContain('targetRole');
    });
  });

  describe('Cultural Optimization', () => {
    it('should apply cultural context to templates', () => {
      const applyCulturalContext = (template: string, language: string) => {
        const culturalPatterns = {
          en: {
            achievements: 'Led team of {size} developers, increasing productivity by {percent}%',
            experience: '{years} years of experience in {field}',
            education: '{degree} from {institution}'
          },
          vi: {
            achievements: 'Lãnh đạo nhóm {size} nhà phát triển, tăng năng suất {percent}%',
            experience: '{years} năm kinh nghiệm trong lĩnh vực {field}',
            education: 'Bằng {degree} từ {institution}'
          }
        };

        return culturalPatterns[language as keyof typeof culturalPatterns] || culturalPatterns.en;
      };

      const enPatterns = applyCulturalContext('template', 'en');
      const viPatterns = applyCulturalContext('template', 'vi');

      expect(enPatterns.achievements).toContain('Led team');
      expect(enPatterns.experience).toContain('years of experience');

      expect(viPatterns.achievements).toContain('Lãnh đạo nhóm');
      expect(viPatterns.experience).toContain('năm kinh nghiệm');
    });
  });

  describe('Template Performance', () => {
    it('should measure template generation time', () => {
      const measureTemplateGeneration = (templateFn: Function, ...args: any[]) => {
        const startTime = Date.now();
        const result = templateFn(...args);
        const endTime = Date.now();
        
        return {
          result,
          generationTime: endTime - startTime
        };
      };

      const simpleTemplate = () => 'Generated template content';
      
      const { result, generationTime } = measureTemplateGeneration(simpleTemplate);
      
      expect(typeof result).toBe('string');
      expect(typeof generationTime).toBe('number');
      expect(generationTime).toBeGreaterThanOrEqual(0);
    });
  });
}); 