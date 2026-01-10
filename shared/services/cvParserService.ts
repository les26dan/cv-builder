/**
 * LLM-Based CV Parser Service
 * Following Product Spec: CV Parser with ChatGPT Integration
 * Replaces broken JD optimization service with functional CV parsing
 */

import { type SupportedLanguage } from '../../utils/languageDetection';
import { languageConfig } from '../../config/languageConfig';

// Response interfaces following LLM specification
export interface CVParsingResponse {
  possibility_score: number;
  contact?: {
    full_name: string;
    address: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  summary?: string;
  work_experience?: Array<{
    position: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    bullets: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
    details: string;
  }>;
  skills?: string[];
  error?: string;
}

export interface CVParserResult {
  success: boolean;
  data?: CVParsingResponse;
  error?: string;
  language: SupportedLanguage;
  source: 'api' | 'fallback' | 'cache';
}

// ChatGPT API interfaces
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * CV Parser Service using ChatGPT API
 * Following LLM specification for CV parsing and confidence scoring
 */
export class CVParserService {
  private static instance: CVParserService;
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  private cache = new Map<string, { data: CVParsingResponse; timestamp: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Use the same OpenAI API key configuration as other services
    this.openaiApiKey = process.env.OPENAI_API_KEY || '[REDACTED_OPENAI_KEY]';
    console.log('🔧 CV Parser Service initialized with OpenAI API key:', this.openaiApiKey ? 'configured' : 'missing');
  }

  static getInstance(): CVParserService {
    if (!CVParserService.instance) {
      CVParserService.instance = new CVParserService();
    }
    return CVParserService.instance;
  }

  /**
   * Generate Vietnamese CV parsing prompt following LLM specification
   */
  private generateVietnamesePrompt(cvText: string): { system: string; user: string } {
    const system = `Bạn là chuyên gia hàng đầu về tuyển dụng, xử lý CV và trích xuất dữ liệu có cấu trúc từ file với hơn 15 năm kinh nghiệm tại Việt Nam. Bạn luôn trích xuất thông tin một cách chính xác, tuyệt đối trung thực từ tài liệu được cung cấp. Bạn KHÔNG suy đoán, tạo mới hay thêm vào bất kỳ thông tin nào không rõ ràng trong file đính kèm. Thông tin được trích xuất sẽ theo đúng cấu trúc JSON định sẵn.`;

    const user = `Vui lòng kiểm tra kỹ văn bản CV dưới đây và thực hiện chính xác theo các bước sau:

Bước 1: Đánh giá khả năng (1-10) văn bản này có phải là một CV/hồ sơ ứng tuyển hay không.  
- (1 = chắc chắn KHÔNG phải CV, 10 = chắc chắn là CV).

Bước 2: CHỈ khi điểm đánh giá từ 5 trở lên, hãy trích xuất thông tin CV và điền đầy đủ vào JSON dưới đây:

{
  "possibility_score": [điểm đánh giá],
  "contact": {
    "full_name": "",
    "address": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "summary": "",
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["", "", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "start_date": "",
      "end_date": "",
      "details": ""
    }
  ],
  "skills": ["", "", "", ""]
}

Bước 3: Nếu điểm đánh giá DƯỚI 5, hãy trả về ĐÚNG nội dung JSON này (không thêm bất kỳ nội dung nào khác):

{
  "possibility_score": [điểm đánh giá],
  "error": "Tài liệu bạn vừa tải lên dường như không phải là CV hoặc hồ sơ ứng tuyển. Vui lòng tải lên đúng file CV hợp lệ để tiếp tục."
}

Văn bản CV cần phân tích:
${cvText}

Yêu cầu bắt buộc khi trả lời:
- Tuyệt đối KHÔNG suy đoán, tạo mới hoặc thêm vào thông tin không rõ ràng từ văn bản.
- Chỉ sử dụng đúng cấu trúc JSON như trên. KHÔNG thêm nội dung giải thích hay thông tin phụ nào khác ngoài JSON đã yêu cầu.`;

    return { system, user };
  }

  /**
   * Generate English CV parsing prompt following LLM specification
   */
  private generateEnglishPrompt(cvText: string): { system: string; user: string } {
    const system = `You are a top-tier expert in global recruitment, CV parsing, and structured data extraction, with over 15 years of experience. You accurately and quickly parse CV or resume documents provided by users. You NEVER fabricate, infer, or add any information that is not explicitly available in the provided document. Extracted data is structured exactly as requested. If certain data is not explicitly available, leave the corresponding fields empty ("") or as empty arrays ([]).`;

    const user = `Review the CV text below carefully. Then:

Step 1: Rate the likelihood (1-10) that the text is a CV or Resume.  
- (1 = definitely NOT a CV, 10 = definitely a CV).

Step 2: ONLY if your score is 5 or higher, extract and structure the CV information precisely into the following JSON format:

{
  "possibility_score": [score],
  "contact": {
    "full_name": "",
    "address": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "summary": "",
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["", "", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "start_date": "",
      "end_date": "",
      "details": ""
    }
  ],
  "skills": ["", "", "", ""]
}

Step 3: If your score is BELOW 5, return EXACTLY this JSON (no other content):

{
  "possibility_score": [score],
  "error": "The uploaded document does not appear to be a CV or Resume. Please upload a valid CV to continue."
}

CV text to analyze:
${cvText}

Mandatory requirements for your response:
- Do NOT fabricate, infer, or add any data not explicitly stated in the text.
- Use ONLY the provided JSON structures. Do NOT add explanations or any additional content beyond the JSON.`;

    return { system, user };
  }

  /**
   * Make ChatGPT API request with error handling
   */
  private async callChatGPT(messages: ChatMessage[], retryCount = 0): Promise<string> {
    const maxRetries = 2;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏱️ CV Parser: OpenAI API call timed out after 45 seconds');
      controller.abort();
    }, 45000); // Reduced to 45 second timeout

    console.log('🔄 CV Parser: Making OpenAI API call...', {
      model: 'gpt-4o-mini',
      messageCount: messages.length,
      apiKeyConfigured: !!this.openaiApiKey,
      retryAttempt: retryCount + 1,
      maxRetries: maxRetries + 1
    });

    try {
      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 2000, // Reduced from 4000 to 2000 for faster response
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 CV Parser: Received OpenAI response', {
        status: response.status,
        statusText: response.statusText,
        retryAttempt: retryCount + 1
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ CV Parser: OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      
      console.log('✅ CV Parser: OpenAI response received', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });
      
      return content;

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`❌ CV Parser: OpenAI API call failed (attempt ${retryCount + 1}):`, error.message);

      // Retry logic for non-abort errors
      if (retryCount < maxRetries && !error.message.includes('abort') && !error.message.includes('400')) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`🔄 CV Parser: Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callChatGPT(messages, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Smart preprocessing to extract key sections and reduce prompt size
   * Reduces ~6,800 character CV to ~2,000 characters for faster processing
   */
  private smartPreprocessCV(cvText: string): string {
    console.log('🧠 Smart preprocessing CV text:', {
      originalLength: cvText.length,
      originalPreview: cvText.substring(0, 100) + '...'
    });

    // Extract contact information (first 500 chars typically contain contact details)
    const contactSection = cvText.substring(0, 500);
    
    // Extract experience section (look for common patterns)
    const experiencePatterns = [
      /experience|work history|employment|professional|career/i,
      /\d{4}.*?(?:present|current|\d{4})/gi, // Date patterns
      /(?:manager|engineer|developer|analyst|director|lead|senior)/gi
    ];
    
    let experienceText = '';
    experiencePatterns.forEach(pattern => {
      const matches = cvText.match(pattern);
      if (matches) {
        const startIndex = cvText.search(pattern);
        if (startIndex !== -1) {
          experienceText += cvText.substring(startIndex, Math.min(startIndex + 800, cvText.length)) + '\n';
        }
      }
    });
    
    // Extract skills section
    const skillsPatterns = [
      /skills|technologies|proficiencies|competencies/i,
      /(?:javascript|python|react|node|sql|aws|docker|kubernetes)/gi
    ];
    
    let skillsText = '';
    skillsPatterns.forEach(pattern => {
      const matches = cvText.match(pattern);
      if (matches) {
        const startIndex = cvText.search(pattern);
        if (startIndex !== -1) {
          skillsText += cvText.substring(startIndex, Math.min(startIndex + 300, cvText.length)) + '\n';
        }
      }
    });
    
    // Extract education section
    const educationPatterns = [
      /education|university|college|degree|bachelor|master|phd/i,
      /\d{4}.*?(?:university|college|institute)/gi
    ];
    
    let educationText = '';
    educationPatterns.forEach(pattern => {
      const matches = cvText.match(pattern);
      if (matches) {
        const startIndex = cvText.search(pattern);
        if (startIndex !== -1) {
          educationText += cvText.substring(startIndex, Math.min(startIndex + 300, cvText.length)) + '\n';
        }
      }
    });
    
    // Combine preprocessed sections
    const processedText = [
      '=== CONTACT INFO ===',
      contactSection,
      '\n=== EXPERIENCE ===',
      experienceText || 'No specific experience patterns found',
      '\n=== SKILLS ===', 
      skillsText || 'No specific skills patterns found',
      '\n=== EDUCATION ===',
      educationText || 'No specific education patterns found'
    ].join('\n').substring(0, 2000); // Hard limit to 2000 chars
    
    console.log('✨ Smart preprocessing completed:', {
      originalLength: cvText.length,
      processedLength: processedText.length,
      reductionRatio: Math.round((1 - processedText.length / cvText.length) * 100) + '%',
      processedPreview: processedText.substring(0, 150) + '...'
    });
    
    return processedText;
  }

  /**
   * Parse CV text using ChatGPT API
   * Following LLM specification with confidence scoring and language detection
   */
  async parseCV(cvText: string, userLanguage?: SupportedLanguage): Promise<CVParserResult> {
    console.log('🤖 CV Parser: Starting LLM-based CV parsing');
    
    try {
      // Detect system language (user preference for UI/system)
      const systemLanguage: SupportedLanguage = userLanguage || 'en';
      
      console.log('🌍 CV Parser: Language configuration', {
        systemLanguage,
        cvTextLength: cvText.length,
        cvTextPreview: cvText.substring(0, 200) + '...'
      });
      
      // Apply smart preprocessing to reduce prompt size and improve speed
      const processedCvText = this.smartPreprocessCV(cvText);
      
      // Generate appropriate prompts based on system language using processed text
      const prompts = systemLanguage === 'vi' 
        ? this.generateVietnamesePrompt(processedCvText)
        : this.generateEnglishPrompt(processedCvText);

      console.log('📝 CV Parser: Generated prompts', {
        systemPromptLength: prompts.system.length,
        userPromptLength: prompts.user.length,
        totalPromptLength: prompts.system.length + prompts.user.length
      });

      const messages: ChatMessage[] = [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ];

      // Check cache
      const cacheKey = `cv_parse_${systemLanguage}_${btoa(cvText.substring(0, 100))}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🎯 CV Parser: Using cached result');
        return {
          success: true,
          data: cached.data,
          language: systemLanguage,
          source: 'cache'
        };
      }

      // Call ChatGPT API
      console.log('📞 CV Parser: Calling ChatGPT API');
      const response = await this.callChatGPT(messages);

      // Parse JSON response
      let parsedData: CVParsingResponse;
      try {
        // Clean response and extract JSON
        const cleanedResponse = response.trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('✅ CV Parser: Successfully parsed AI response');
      } catch (parseError) {
        console.error('❌ CV Parser: Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Cache successful result
      this.cache.set(cacheKey, { data: parsedData, timestamp: Date.now() });

      return {
        success: true,
        data: parsedData,
        language: systemLanguage,
        source: 'api'
      };

    } catch (error) {
      console.error('❌ CV Parser: Parsing failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        language: userLanguage || 'vi',
        source: 'fallback'
      };
    }
  }

  /**
   * Convert parsed CV data to CV Guided Editing format
   * Following the acceptance criteria structure
   */
  convertToGuidedEditingFormat(parsedData: CVParsingResponse): any {
    if (!parsedData.contact && !parsedData.work_experience) {
      return null;
    }

    return {
      contact: {
        fullName: parsedData.contact?.full_name || '',
        email: parsedData.contact?.email || '',
        phone: parsedData.contact?.phone || '',
        address: parsedData.contact?.address || '',
        linkedin: parsedData.contact?.linkedin || ''
      },
      summary: {
        content: typeof parsedData.summary === 'string' 
          ? parsedData.summary 
          : Array.isArray(parsedData.summary) 
            ? (parsedData.summary as string[]).join(' ') 
            : ''
      },
      experience: {
        items: parsedData.work_experience?.map(exp => ({
          position: exp.position,
          company: exp.company,
          location: exp.location,
          startDate: exp.start_date,
          endDate: exp.end_date,
          bullets: exp.bullets.filter(bullet => bullet.trim().length > 0)
        })) || []
      },
      education: {
        items: parsedData.education?.map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          startDate: edu.start_date,
          endDate: edu.end_date,
          details: edu.details
        })) || []
      },
      skills: {
        items: parsedData.skills || []
      }
    };
  }
}

// Export singleton instance
export const cvParserService = CVParserService.getInstance();
export default CVParserService; 