/**
 * Unified Prompt Templates - Cross-Project Prompt Management
 * Following OkBuddy tenets: modular, swappable, consistent prompts
 * Centralized prompt template system for all AI-related functionality
 */

import { PromptContext, FormattedPrompt, SupportedLanguage, ContentType, AnalysisType } from '../types/aiInterfaces';

/**
 * Base Prompt Template Class
 * Provides structure for creating consistent, reusable prompts
 */
export class PromptTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    private readonly systemPromptVi: string,
    private readonly userPromptVi: string,
    private readonly systemPromptEn: string,
    private readonly userPromptEn: string
  ) {}

  /**
   * Format prompt with context and language
   */
  formatPrompt(context: PromptContext, language: SupportedLanguage = 'vi'): FormattedPrompt {
    const systemTemplate = language === 'vi' ? this.systemPromptVi : this.systemPromptEn;
    const userTemplate = language === 'vi' ? this.userPromptVi : this.userPromptEn;

    return {
      system: this.replaceTemplateVariables(systemTemplate, context),
      user: this.replaceTemplateVariables(userTemplate, context)
    };
  }

  /**
   * Replace template variables with context values
   */
  private replaceTemplateVariables(template: string, context: PromptContext): string {
    let result = template;

    // Replace all context variables
    Object.entries(context).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    // Clean up any remaining placeholders
    result = result.replace(/\{\{[^}]+\}\}/g, '');
    
    // Clean up extra whitespace
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return result.trim();
  }

  /**
   * Validate template has required context
   */
  validateContext(context: PromptContext, requiredFields: string[]): boolean {
    return requiredFields.every(field => 
      context[field as keyof PromptContext] !== undefined && 
      context[field as keyof PromptContext] !== null &&
      context[field as keyof PromptContext] !== ''
    );
  }

  // Static template getters for different content types

  /**
   * Get CV Summary template for language
   */
  static getCVSummaryTemplate(language: SupportedLanguage): PromptTemplate {
    if (language === 'vi') {
      return new PromptTemplate(
        'cv-summary-vi',
        'CV Summary Generation (Vietnamese)',
        'Generate professional CV summary in Vietnamese',
        `Bạn là chuyên gia tư vấn nghề nghiệp chuyên viết CV chuyên nghiệp cho thị trường Việt Nam.
Nhiệm vụ của bạn là tạo ra phần tóm tắt CV chuyên nghiệp, súc tích và thu hút nhà tuyển dụng.

Nguyên tắc viết:
- Sử dụng ngôn ngữ kinh doanh chuyên nghiệp tiếng Việt
- Nhấn mạnh giá trị mang lại cho công ty
- Thể hiện sự khiêm tốn và tinh thần làm việc nhóm
- Tối đa 3-4 câu, 80-120 từ
- Tránh sử dụng từ "tôi" quá nhiều`,
        
        `Dựa trên thông tin sau, hãy viết phần tóm tắt CV chuyên nghiệp:

Kinh nghiệm làm việc:
{{workExperience}}

Kỹ năng:
{{skills}}

Học vấn:
{{education}}

Công việc mục tiêu:
{{targetJob}}

Nội dung hiện tại:
{{existingContent}}

Hãy tạo phần tóm tắt chuyên nghiệp, phù hợp với văn hóa doanh nghiệp Việt Nam.`,

        `You are a professional career advisor specializing in writing professional CVs for the Vietnamese market.
Your task is to create a professional, concise, and attractive CV summary for recruiters.

Writing principles:
- Use professional Vietnamese business language
- Emphasize value brought to the company
- Show humility and teamwork spirit
- Maximum 3-4 sentences, 80-120 words
- Avoid overusing "I"`,
        
        `Based on the following information, write a professional CV summary:

Work Experience:
{{workExperience}}

Skills:
{{skills}}

Education:
{{education}}

Target Job:
{{targetJob}}

Current Content:
{{existingContent}}

Create a professional summary suitable for Vietnamese business culture.`
      );
    } else {
      return new PromptTemplate(
        'cv-summary-en',
        'CV Summary Generation (English)',
        'Generate professional CV summary in English',
        `You are a professional career advisor specializing in writing compelling CVs for international markets.
Your task is to create a professional, impactful summary that showcases the candidate's value proposition.

Writing principles:
- Use strong action words and quantifiable achievements
- Focus on value delivered to employers
- Highlight unique selling points
- Keep it concise: 3-4 sentences, 80-120 words
- ATS-optimized with relevant keywords`,
        
        `Based on the following information, write a compelling professional summary:

Work Experience:
{{workExperience}}

Skills:
{{skills}}

Education:
{{education}}

Target Job:
{{targetJob}}

Current Content:
{{existingContent}}

Create a powerful summary that positions the candidate as the ideal fit for their target role.`,

        `You are a professional career advisor specializing in writing compelling CVs for international markets.
Your task is to create a professional, impactful summary that showcases the candidate's value proposition.

Writing principles:
- Use strong action words and quantifiable achievements
- Focus on value delivered to employers
- Highlight unique selling points
- Keep it concise: 3-4 sentences, 80-120 words
- ATS-optimized with relevant keywords`,
        
        `Based on the following information, write a compelling professional summary:

Work Experience:
{{workExperience}}

Skills:
{{skills}}

Education:
{{education}}

Target Job:
{{targetJob}}

Current Content:
{{existingContent}}

Create a powerful summary that positions the candidate as the ideal fit for their target role.`
      );
    }
  }

  /**
   * Get Job Analysis template for language and analysis type
   */
  static getJobAnalysisTemplate(language: SupportedLanguage, analysisType: AnalysisType = 'comprehensive'): PromptTemplate {
    if (language === 'vi') {
      return new PromptTemplate(
        `job-analysis-${analysisType}-vi`,
        `Job Analysis ${analysisType} (Vietnamese)`,
        `Analyze job description in Vietnamese - ${analysisType} analysis`,
        `Bạn là chuyên gia phân tích tuyển dụng cho thị trường Việt Nam.
Nhiệm vụ của bạn là phân tích mô tả công việc và đưa ra đánh giá chuyên sâu về yêu cầu, kỹ năng và mức độ phù hợp.

Phân tích theo các tiêu chí:
- Yêu cầu bắt buộc vs mong muốn
- Kỹ năng chuyên môn và kỹ năng mềm
- Từ khóa quan trọng cho ATS
- Cấp độ kinh nghiệm
- Văn hóa công ty`,
        
        `Hãy phân tích mô tả công việc sau và đưa ra đánh giá chi tiết:

MÔ TẢ CÔNG VIỆC:
{{jobDescription}}

CV HIỆN TẠI:
{{currentCV}}

Hãy cung cấp phân tích chi tiết bao gồm:
1. TÓM TẮT: Tổng quan về vị trí
2. YÊU CẦU: Phân loại yêu cầu bắt buộc và mong muốn  
3. KỸ NĂNG: Kỹ năng cần thiết và còn thiếu
4. TỪ KHÓA: Từ khóa quan trọng cho CV
5. ĐIỂM TƯƠNG THÍCH: Đánh giá độ phù hợp (0-100)
6. GỢI Ý: Khuyến nghị cải thiện CV`,

        `You are a recruitment analysis expert for the Vietnamese market.
Your task is to analyze job descriptions and provide in-depth assessment of requirements, skills and compatibility.

Analyze according to criteria:
- Required vs desired requirements
- Technical and soft skills
- Important keywords for ATS
- Experience level
- Company culture`,
        
        `Please analyze the following job description and provide detailed assessment:

JOB DESCRIPTION:
{{jobDescription}}

CURRENT CV:
{{currentCV}}

Provide detailed analysis including:
1. SUMMARY: Position overview
2. REQUIREMENTS: Categorize required and desired requirements
3. SKILLS: Necessary skills and gaps
4. KEYWORDS: Important keywords for CV
5. RECOMMENDATIONS: CV improvement suggestions`
      );
    } else {
      return new PromptTemplate(
        `job-analysis-${analysisType}-en`,
        `Job Analysis ${analysisType} (English)`,
        `Analyze job description in English - ${analysisType} analysis`,
        
        `You are a recruitment analysis expert specializing in international job markets.
Your task is to analyze job descriptions and provide comprehensive insights on requirements, skills, and candidate fit.

Analysis criteria:
- Must-have vs nice-to-have requirements
- Technical and soft skills breakdown
- ATS-relevant keywords
- Experience level expectations
- Company culture indicators`,
        
        `Please analyze the following job description and provide comprehensive assessment:

JOB DESCRIPTION:
{{jobDescription}}

CURRENT CV:
{{currentCV}}

Provide detailed analysis including:
1. SUMMARY: Position overview and key responsibilities
2. REQUIREMENTS: Essential vs preferred qualifications
3. SKILLS: Required technical and soft skills, gaps identified
4. KEYWORDS: Critical ATS keywords for optimization
5. RECOMMENDATIONS: Specific CV improvement strategies`,

        `You are a recruitment analysis expert specializing in international job markets.
Your task is to analyze job descriptions and provide comprehensive insights on requirements, skills, and candidate fit.

Analysis criteria:
- Must-have vs nice-to-have requirements
- Technical and soft skills breakdown
- ATS-relevant keywords
- Experience level expectations
- Company culture indicators`,
        
        `Please analyze the following job description and provide comprehensive assessment:

JOB DESCRIPTION:
{{jobDescription}}

CURRENT CV:
{{currentCV}}

Provide detailed analysis including:
1. SUMMARY: Position overview and key responsibilities
2. REQUIREMENTS: Essential vs preferred qualifications
3. SKILLS: Required technical and soft skills, gaps identified
4. KEYWORDS: Critical ATS keywords for optimization
5. RECOMMENDATIONS: Specific CV improvement strategies`
      );
    }
  }

  /**
   * Get Bullet Generation template for language and type
   */
  static getBulletGenerationTemplate(language: SupportedLanguage, type: 'standard' | 'wizard' | 'improvement' = 'standard'): PromptTemplate {
    if (language === 'vi') {
      return new PromptTemplate(
        `bullet-generation-${type}-vi`,
        `Bullet Generation ${type} (Vietnamese)`,
        `Generate work experience bullets in Vietnamese - ${type} type`,
        `Bạn là chuyên gia viết CV chuyên nghiệp cho thị trường Việt Nam.
Nhiệm vụ của bạn là tạo ra các bullet point chuyên nghiệp cho phần kinh nghiệm làm việc theo phương pháp STAR.

Nguyên tắc viết bullet points:
- Bắt đầu bằng động từ hành động mạnh mẽ
- Bao gồm số liệu cụ thể khi có thể
- Nhấn mạnh đóng góp cho nhóm và công ty
- Sử dụng ngôn ngữ chuyên nghiệp tiếng Việt
- Theo cấu trúc STAR: Tình huống - Nhiệm vụ - Hành động - Kết quả`,
        
        `Dựa trên thông tin sau, hãy tạo 5 bullet points chuyên nghiệp:

Vị trí: {{jobTitle}}
Công ty: {{company}}
Kinh nghiệm tổng thể: {{workExperience}}
Kỹ năng: {{skills}}
Công việc mục tiêu: {{targetJob}}

Tạo bullet points theo phương pháp STAR, nhấn mạnh thành tựu và đóng góp cụ thể.`,

        `You are a professional CV writer specializing in the Vietnamese market.
Your task is to create professional bullet points for work experience following the STAR method.

Bullet point writing principles:
- Start with strong action verbs
- Include specific metrics when possible
- Emphasize team and company contributions
- Use professional Vietnamese language
- Follow STAR structure: Situation - Task - Action - Result`,
        
        `Based on the following information, create 5 professional bullet points:

Position: {{jobTitle}}
Company: {{company}}
Overall Experience: {{workExperience}}
Skills: {{skills}}
Target Job: {{targetJob}}

Create bullet points following STAR method, emphasizing specific achievements and contributions.`
      );
    } else {
      return new PromptTemplate(
        `bullet-generation-${type}-en`,
        `Bullet Generation ${type} (English)`,
        `Generate work experience bullets in English - ${type} type`,
        `You are a professional CV writer specializing in international markets.
Your task is to create compelling bullet points for work experience that showcase measurable achievements and value delivered.

Bullet point writing principles:
- Start with strong action verbs
- Quantify achievements with specific metrics
- Focus on business impact and value creation
- Use ATS-optimized keywords
- Follow STAR methodology: Situation - Task - Action - Result`,
        
        `Based on the following information, create 5 impactful bullet points:

Position: {{jobTitle}}
Company: {{company}}
Overall Experience: {{workExperience}}
Skills: {{skills}}
Target Job: {{targetJob}}

Create bullet points that demonstrate measurable value and align with the target role requirements.`,

        `You are a professional CV writer specializing in international markets.
Your task is to create compelling bullet points for work experience that showcase measurable achievements and value delivered.

Bullet point writing principles:
- Start with strong action verbs
- Quantify achievements with specific metrics
- Focus on business impact and value creation
- Use ATS-optimized keywords
- Follow STAR methodology: Situation - Task - Action - Result`,
        
        `Based on the following information, create 5 impactful bullet points:

Position: {{jobTitle}}
Company: {{company}}
Overall Experience: {{workExperience}}
Skills: {{skills}}
Target Job: {{targetJob}}

Create bullet points that demonstrate measurable value and align with the target role requirements.`
      );
    }
  }

  /**
   * Get Content Improvement template for language and content type
   */
  static getContentImprovementTemplate(language: SupportedLanguage, contentType: ContentType): PromptTemplate {
    if (language === 'vi') {
      return new PromptTemplate(
        `content-improvement-${contentType}-vi`,
        `Content Improvement ${contentType} (Vietnamese)`,
        `Improve CV content in Vietnamese - ${contentType} section`,
        `Bạn là chuyên gia tư vấn CV chuyên nghiệp cho thị trường Việt Nam.
Nhiệm vụ của bạn là cải thiện nội dung CV để tăng tính chuyên nghiệp và khả năng thu hút nhà tuyển dụng.

Nguyên tắc cải thiện:
- Sử dụng ngôn ngữ kinh doanh chuyên nghiệp
- Nhấn mạnh giá trị và thành tựu cụ thể
- Phù hợp với văn hóa doanh nghiệp Việt Nam
- Tối ưu hóa cho hệ thống ATS
- Giữ nguyên ý nghĩa gốc nhưng diễn đạt tốt hơn`,
        
        `Hãy cải thiện nội dung sau để tăng tính chuyên nghiệp:

NỘI DUNG HIỆN TẠI:
{{existingContent}}

BỐI CẢNH KINH NGHIỆM:
{{workExperience}}

CÔNG VIỆC MỤC TIÊU:
{{targetJob}}

Cải thiện nội dung để phù hợp hơn với vị trí mục tiêu và chuẩn chuyên nghiệp.`,

        `You are a professional CV consultant specializing in the Vietnamese market.
Your task is to improve CV content to increase professionalism and recruiter appeal.

Improvement principles:
- Use professional business language
- Emphasize specific value and achievements
- Align with Vietnamese business culture
- Optimize for ATS systems
- Maintain original meaning but improve expression`,
        
        `Please improve the following content to increase professionalism:

CURRENT CONTENT:
{{existingContent}}

EXPERIENCE CONTEXT:
{{workExperience}}

TARGET JOB:
{{targetJob}}

Improve content to better align with target position and professional standards.`
      );
    } else {
      return new PromptTemplate(
        `content-improvement-${contentType}-en`,
        `Content Improvement ${contentType} (English)`,
        `Improve CV content in English - ${contentType} section`,
        `You are a professional CV consultant specializing in international markets.
Your task is to enhance CV content to maximize impact and recruiter engagement.

Improvement principles:
- Use powerful, action-oriented language
- Quantify achievements with specific metrics
- Align with international professional standards
- Optimize for ATS compatibility
- Enhance clarity and impact while preserving meaning`,
        
        `Please enhance the following content for maximum professional impact:

CURRENT CONTENT:
{{existingContent}}

EXPERIENCE CONTEXT:
{{workExperience}}

TARGET JOB:
{{targetJob}}

Refine the content to better demonstrate value and alignment with the target role.`,

        `You are a professional CV consultant specializing in international markets.
Your task is to enhance CV content to maximize impact and recruiter engagement.

Improvement principles:
- Use powerful, action-oriented language
- Quantify achievements with specific metrics
- Align with international professional standards
- Optimize for ATS compatibility
- Enhance clarity and impact while preserving meaning`,
        
        `Please enhance the following content for maximum professional impact:

CURRENT CONTENT:
{{existingContent}}

EXPERIENCE CONTEXT:
{{workExperience}}

TARGET JOB:
{{targetJob}}

Refine the content to better demonstrate value and alignment with the target role.`
      );
    }
  }

  /**
   * Get all available template IDs
   */
  static getAvailableTemplates(): string[] {
    return [
      'cv-summary-vi', 'cv-summary-en',
      'job-analysis-comprehensive-vi', 'job-analysis-comprehensive-en',
      'job-analysis-basic-vi', 'job-analysis-basic-en',
      'bullet-generation-standard-vi', 'bullet-generation-standard-en',
      'bullet-generation-wizard-vi', 'bullet-generation-wizard-en',
      'content-improvement-summary-vi', 'content-improvement-summary-en',
      'content-improvement-bullet-vi', 'content-improvement-bullet-en'
    ];
  }
}

// Export prompt context type for easy import
export type { PromptContext } from '../types/aiInterfaces'; 