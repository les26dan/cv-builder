/**
 * LLM-Based CV Parser Service
 * Following Product Spec: CV Parser with ChatGPT Integration
 * Replaces broken JD optimization service with functional CV parsing
 * 
 * Updated with Hybrid Parser approach for optimal token efficiency:
 * - Uses HybridCVParserService as primary parser
 * - Falls back to full ChatGPT parsing if hybrid fails
 */

import { type SupportedLanguage } from '../../utils/languageDetection';
import { languageConfig } from '../../config/languageConfig';
import { HybridCVParserService, type HybridCVParserResult } from './hybridCVParserService';

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
    location: string;
    graduationDate: string;
    description: string;
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

interface ChatGPTResult {
  content: string;
  tokens: number;
  cost: number;
}

/**
 * CV Parser Service using ChatGPT API
 * Following LLM specification for CV parsing and confidence scoring
 */
export class CVParserService {
  private static instance: CVParserService;
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  private cache = new Map<string, { data: CVParsingResponse; timestamp: number; tokens: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private costTracker = {
    totalRequests: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    sessionsToday: 0,
    lastResetDate: new Date().toDateString()
  }

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
   * Update cost tracking with daily reset functionality
   */
  private updateCostTracking(tokens: number, cost: number): void {
    const today = new Date().toDateString();
    
    // Reset daily counters if it's a new day
    if (this.costTracker.lastResetDate !== today) {
      this.costTracker.sessionsToday = 0;
      this.costTracker.lastResetDate = today;
    }
    
    this.costTracker.totalRequests += 1;
    this.costTracker.totalTokensUsed += tokens;
    this.costTracker.totalCost += cost;
    this.costTracker.sessionsToday += 1;
  }

  /**
   * Get current cost tracking statistics
   */
  public getCostStats() {
    return {
      ...this.costTracker,
      averageCostPerRequest: this.costTracker.totalRequests > 0 
        ? this.costTracker.totalCost / this.costTracker.totalRequests 
        : 0,
      averageTokensPerRequest: this.costTracker.totalRequests > 0
        ? this.costTracker.totalTokensUsed / this.costTracker.totalRequests
        : 0
    };
  }

  /**
   * Generate Vietnamese CV parsing prompt following LLM specification
   */
  private generateVietnamesePrompt(cvText: string): { system: string; user: string } {
    const system = `Bạn là chuyên gia hàng đầu về tuyển dụng, xử lý CV và trích xuất dữ liệu có cấu trúc từ file với hơn 15 năm kinh nghiệm tại Việt Nam. Bạn CHỈ TRÍCH XUẤT thông tin một cách chính xác và trung thực từ tài liệu được cung cấp. Bạn TUYỆT ĐỐI KHÔNG được suy đoán, tạo mới, viết lại, hay thêm vào bất kỳ thông tin nào không có sẵn rõ ràng trong văn bản gốc. Bạn chỉ sao chép và cấu trúc lại thông tin đã có. Nhiệm vụ của bạn là TRÍCH XUẤT HOÀN TOÀN và BẢO TỒN TẤT CẢ chi tiết, trách nhiệm, thành tích và số liệu từ CV gốc.`;

    const user = `Vui lòng kiểm tra kỹ văn bản CV dưới đây và thực hiện chính xác theo các bước sau:

Bước 1: Đánh giá khả năng (1-10) văn bản này có phải là một CV/hồ sơ ứng tuyển hay không.  
- (1 = chắc chắn KHÔNG phải CV, 10 = chắc chắn là CV).

Bước 2: CHỈ khi điểm đánh giá từ 5 trở lên, hãy TRÍCH XUẤT HOÀN TOÀN tất cả thông tin CV và điền đầy đủ vào JSON dưới đây:

QUAN TRỌNG: Đối với "work_experience" và "bullets":
- TRÍCH XUẤT TẤT CẢ bullet points, trách nhiệm, thành tích và số liệu từ CV gốc
- KHÔNG giới hạn số lượng bullets - thêm nhiều bullets tùy theo nội dung thực tế
- BẢO TỒN TẤT CẢ chi tiết, con số, phần trăm và thông tin cụ thể
- CHỈ sao chép nội dung gốc, KHÔNG viết lại hay tóm tắt

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
      "bullets": ["trích xuất TẤT CẢ bullets từ CV gốc", "bảo tồn TẤT CẢ chi tiết", "thêm bullets theo nội dung thực tế", "không giới hạn số lượng"]
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
  "skills": ["trích xuất TẤT CẢ skills từ CV gốc"]
}

Bước 3: Nếu điểm đánh giá DƯỚI 5, hãy trả về ĐÚNG nội dung JSON này (không thêm bất kỳ nội dung nào khác):

{
  "possibility_score": [điểm đánh giá],
  "error": "Tài liệu bạn vừa tải lên dường như không phải là CV hoặc hồ sơ ứng tuyển. Vui lòng tải lên đúng file CV hợp lệ để tiếp tục."
}

Văn bản CV cần phân tích:
${cvText}

Yêu cầu bắt buộc khi trả lời:
- CHỈ TRÍCH XUẤT: Tuyệt đối KHÔNG suy đoán, tạo mới, viết lại, tóm tắt hoặc thêm vào thông tin không có sẵn trong văn bản gốc.
- BẢO TỒN TẤT CẢ: Trích xuất HOÀN TOÀN tất cả trách nhiệm, thành tích, metrics và chi tiết từ mỗi công việc.
- KHÔNG GIỚI HẠN: Thêm tất cả bullets cần thiết để phản ánh đầy đủ nội dung CV gốc.
- Chỉ sử dụng đúng cấu trúc JSON như trên. KHÔNG thêm nội dung giải thích hay thông tin phụ nào khác ngoài JSON đã yêu cầu.`;

    return { system, user };
  }

  /**
   * Generate English CV parsing prompt following LLM specification
   */
  private generateEnglishPrompt(cvText: string): { system: string; user: string } {
    const system = `You are a top-tier expert in global recruitment, CV parsing, and structured data extraction, with over 15 years of experience. You ONLY EXTRACT information that is explicitly available in the provided document. You NEVER fabricate, infer, rewrite, summarize, or add any information that is not clearly present in the original text. Your role is to EXTRACT COMPLETELY and PRESERVE ALL details, responsibilities, achievements, and metrics from the original CV content. You simply copy and restructure existing information.`;

    const user = `Review the CV text below carefully. Then:

Step 1: Rate the likelihood (1-10) that the text is a CV or Resume.  
- (1 = definitely NOT a CV, 10 = definitely a CV).

Step 2: ONLY if your score is 5 or higher, EXTRACT COMPLETELY all CV information and structure it precisely into the following JSON format:

CRITICAL: For "work_experience" and "bullets":
- EXTRACT ALL bullet points, responsibilities, achievements, and metrics from the original CV
- DO NOT limit the number of bullets - add as many bullets as needed to reflect actual content
- PRESERVE ALL details, numbers, percentages, and specific information
- ONLY copy original content - DO NOT rewrite or summarize

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
      "bullets": ["extract ALL bullets from original CV", "preserve ALL details", "add bullets as needed for actual content", "no limit on number"]
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
  "skills": ["extract ALL skills from original CV"]
}

Step 3: If your score is BELOW 5, return EXACTLY this JSON (no other content):

{
  "possibility_score": [score],
  "error": "The uploaded document does not appear to be a CV or Resume. Please upload a valid CV to continue."
}

CV text to analyze:
${cvText}

Mandatory requirements for your response:
- ONLY EXTRACT: Do NOT fabricate, infer, rewrite, summarize, or add any data not explicitly stated in the original text.
- PRESERVE ALL: Extract COMPLETELY all responsibilities, achievements, metrics, and details from each job.
- NO LIMITS: Add all bullets necessary to fully reflect the original CV content.
- Use ONLY the provided JSON structures. Do NOT add explanations or any additional content beyond the JSON.`;

    return { system, user };
  }

  /**
   * Make ChatGPT API request with error handling and cost tracking
   */
  private async callChatGPT(messages: ChatMessage[], retryCount = 0): Promise<ChatGPTResult> {
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
          max_tokens: 6000, // Increased for comprehensive CV processing with all details preserved
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

      const result: OpenAIResponse = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      const usage = result.usage;
      const tokens = usage?.total_tokens || 0;
      const cost = tokens * 0.001; // gpt-4o-mini pricing: ~$0.001 per 1K tokens
      
      // Update cost tracking
      this.updateCostTracking(tokens, cost);
      
      console.log('✅ CV Parser: OpenAI response received', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...',
        tokensUsed: tokens,
        estimatedCost: `$${cost.toFixed(4)}`,
        totalCostToday: `$${this.costTracker.totalCost.toFixed(4)}`
      });
      
      return { content, tokens, cost };

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
   * Parse CV text using Hybrid approach for optimal token efficiency
   * Primary: HybridCVParserService (direct parsing + ChatGPT for work experience only)
   * Fallback: Full ChatGPT processing if hybrid fails
   * Following LLM specification with confidence scoring and language detection
   */
  async parseCV(cvText: string, userLanguage?: SupportedLanguage): Promise<CVParserResult> {
    console.log('🚀 CV Parser: Starting optimized hybrid parsing');
    
    try {
      const systemLanguage: SupportedLanguage = userLanguage || 'vi';
      
      // Step 1: Try Hybrid Parser (Primary approach)
      console.log('🔄 Step 1: Attempting hybrid parsing for token efficiency');
      
      const hybridParser = HybridCVParserService.getInstance();
      const hybridResult: HybridCVParserResult = await hybridParser.parseCV(cvText, systemLanguage);
      
      if (hybridResult.success && hybridResult.data) {
        console.log('✅ CV Parser: Hybrid parsing successful!', {
          processingTime: hybridResult.processingTime,
          tokensSaved: hybridResult.tokensSaved,
          source: hybridResult.source,
          possibility_score: hybridResult.data.possibility_score,
          hasContact: !!hybridResult.data.contact,
          hasWorkExperience: !!hybridResult.data.work_experience,
          hasEducation: !!hybridResult.data.education,
          hasSkills: !!hybridResult.data.skills
        });

        return {
          success: true,
          data: hybridResult.data,
          language: systemLanguage,
          source: hybridResult.source as 'api' | 'fallback' | 'cache'
        };
      }
      
      // Step 2: Fallback to Full ChatGPT Processing
      console.log('⚠️ Step 2: Hybrid parsing failed, falling back to full ChatGPT processing');
      console.log('🤖 CV Parser: Starting full CV processing with LLM');
      
      console.log('🌍 CV Parser: Full processing configuration', {
        systemLanguage,
        fullCvTextLength: cvText.length,
        estimatedTokens: Math.ceil(cvText.length / 1.33),
        cvTextPreview: cvText.substring(0, 200) + '...'
      });
      
      // Generate appropriate prompts based on system language using full CV text
      const prompts = systemLanguage === 'vi' 
        ? this.generateVietnamesePrompt(cvText)
        : this.generateEnglishPrompt(cvText);

      console.log('📝 CV Parser: Generated prompts (full CV processing)', {
        systemPromptLength: prompts.system.length,
        userPromptLength: prompts.user.length,
        totalPromptLength: prompts.system.length + prompts.user.length,
        fullCvTextLength: cvText.length
      });

      const messages: ChatMessage[] = [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ];

      // Check cache for full parsing (Buffer base64 supports UTF-8; btoa does not)
      const cacheKey = `cv_parse_full_${systemLanguage}_${Buffer.from(cvText.substring(0, 100), 'utf8').toString('base64')}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🎯 CV Parser: Using cached full parsing result');
        return {
          success: true,
          data: cached.data,
          language: systemLanguage,
          source: 'cache'
        };
      }

      // Call ChatGPT API for full parsing
      console.log('📞 CV Parser: Calling ChatGPT API for full parsing');
      const apiResult = await this.callChatGPT(messages);

      // Parse JSON response
      let parsedData: CVParsingResponse;
      try {
        // Clean response and extract JSON
        const cleanedResponse = apiResult.content.trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('✅ CV Parser: Successfully parsed AI response with full ChatGPT');
        console.log('🔍 Raw ChatGPT response content:', apiResult.content);
        console.log('🔍 Parsed data structure:', JSON.stringify(parsedData, null, 2));
      } catch (parseError) {
        console.error('❌ CV Parser: Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Cache successful result with token information
      this.cache.set(cacheKey, { 
        data: parsedData, 
        timestamp: Date.now(),
        tokens: apiResult.tokens
      });

      return {
        success: true,
        data: parsedData,
        language: systemLanguage,
        source: 'fallback'
      };

    } catch (error) {
      console.error('❌ CV Parser: Unexpected error in hybrid/fallback parsing', error);
      
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
      console.error('❌ CV Parser: No contact or work experience data found for conversion');
      return null;
    }

    console.log('🔄 CV Parser: Converting ChatGPT JSON to Guided Editing format');
    console.log('🔍 CV Parser: Input ChatGPT contact data:', JSON.stringify(parsedData.contact, null, 2));

    const result = {
      contact: {
        fullName: parsedData.contact?.full_name || '',
        email: parsedData.contact?.email || '',
        phone: parsedData.contact?.phone || '',
        location: parsedData.contact?.address || '',  // Fix: map address to location to match API interface
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
        items: parsedData.work_experience?.map((exp, index) => {
          // Handle "Present" or "hiện tại" end dates
          const isCurrentJob = exp.end_date && 
            (exp.end_date.toLowerCase().includes('present') || 
             exp.end_date.toLowerCase().includes('hiện tại'));
          
          console.log(`🔍 CV Parser: Experience ${index + 1} - Position: ${exp.position}, End Date: "${exp.end_date}", Is Current: ${isCurrentJob}`);
          
          return {
            id: `experience-${index}-${Date.now()}`,  // Add unique ID for React keys
            title: exp.position,  // Fix: map position to title to match WorkExperienceSection interface
            company: exp.company,
            location: exp.location,
            startDate: exp.start_date,
            endDate: isCurrentJob ? '' : exp.end_date,  // Clear end date if current job
            current: isCurrentJob,  // Fix: use 'current' instead of 'isCurrentJob' to match WorkExperienceSection interface
            bullets: exp.bullets.filter(bullet => bullet.trim().length > 0)
          };
        }) || []
      },
      education: {
        items: parsedData.education?.map((edu, index) => ({
          id: `education-${index}-${Date.now()}`,   // Add unique ID for React keys
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          graduationDate: edu.graduationDate,
          description: edu.description
        })) || []
      },
      skills: {
        items: parsedData.skills || []
      }
    };

    console.log('🔍 CV Parser: Converted contact data:', JSON.stringify(result.contact, null, 2));
    console.log('✅ CV Parser: Conversion completed successfully');

    return result;
  }
}

// Export singleton instance
export const cvParserService = CVParserService.getInstance();
export default CVParserService; 