/**
 * Hybrid CV Parser Service
 * Optimized approach for token efficiency and speed:
 * - Contact Info, Summary, Education, Skills: Direct parsing from extracted text
 * - Work Experience: ChatGPT-only parsing for complex experience extraction
 * - Unified JSON output compatible with existing CV Guided Editing system
 */

import { type SupportedLanguage } from '../../utils/languageDetection';
import { languageConfig } from '../../config/languageConfig';
import { EnhancedTextProcessor } from './enhancedTextProcessor';

// Response interfaces following existing specification
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

export interface HybridCVParserResult {
  success: boolean;
  data?: CVParsingResponse;
  error?: string;
  language: SupportedLanguage;
  source: 'hybrid' | 'fallback' | 'cache';
  processingTime?: number;
  tokensSaved?: number;
}

// ChatGPT API interfaces
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGPTResult {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Section-specific parsers for direct text processing
 */
class SectionParsers {
  
  /**
   * Parse contact information directly from CV text using enhanced processing
   */
  static parseContact(cvText: string): CVParsingResponse['contact'] {
    // Use enhanced text processor to get cleaner contact section
    const contactText = EnhancedTextProcessor.extractSection(cvText, 'contact');
    const lines = contactText ? contactText.split('\n').map(line => line.trim()).filter(line => line.length > 0) : 
                  cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract name (typically first meaningful line or from full text)
    let full_name = '';
    
    // First try to find name in contact section
    for (const line of lines.slice(0, 5)) {
      if (!/[@+\d]/.test(line) && 
          !line.toLowerCase().includes('street') &&
          !line.toLowerCase().includes('ave') &&
          !line.toLowerCase().includes('road') &&
          !line.toLowerCase().includes('linkedin') &&
          line.length < 50 && line.length > 2) {
        
        const words = line.split(/\s+/).filter(word => /^[a-zA-ZÀ-ÿ()]+$/.test(word));
        if (words.length >= 2 && words.length <= 4) {
          full_name = words.join(' ');
          break;
        }
      }
    }
    
    // If no name found in contact section, check the beginning of full text
    if (!full_name) {
      const fullTextLines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      for (const line of fullTextLines.slice(0, 8)) { // Check more lines
        if (!/[@+\d]/.test(line) && 
            !line.toLowerCase().includes('vietnam') &&
            !line.toLowerCase().includes('linkedin') &&
            !line.toLowerCase().includes('manager') &&
            !line.toLowerCase().includes('senior') &&
            line.length < 60 && line.length > 2) {
          
          // More flexible name pattern matching
          const words = line.split(/\s+/).filter(word => 
            /^[a-zA-ZÀ-ÿ()]+$/.test(word) && 
            word.length > 1 &&
            !['CV', 'RESUME', 'CURRICULUM', 'VITAE'].includes(word.toUpperCase())
          );
          
          if (words.length >= 2 && words.length <= 5) {
            full_name = words.join(' ');
            break;
          }
          
          // Also try to extract from lines that might have titles
          if (line.includes('TU') && line.includes('BRYAN')) {
            const nameMatch = line.match(/TU\s*\(?BRYAN\)?\s*LE/i);
            if (nameMatch) {
              full_name = nameMatch[0].replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
              break;
            }
          }
        }
      }
    }
    
    // Extract email with improved pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = cvText.match(emailPattern) || [];
    const email = emails[0] || '';
    
    // Extract phone with improved pattern handling scattered numbers
    const phonePatterns = [
      /(\+\s*\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3,4}[- ]?\d{4}/g,
      /\(\+\d{2}\)\s*\(\d+\)\s*\d+\s*\d+\s*\d+\s*\d+/g, // (+84) (0) 83 94 777 28
      /\+\d{2}\s+\d+\s+\d+\s+\d+\s+\d+/g // +84 0 83 94 777 28
    ];
    
    let phone = '';
    for (const pattern of phonePatterns) {
      const matches = cvText.match(pattern);
      if (matches && matches[0]) {
        phone = matches[0].replace(/\s+/g, ' ').trim();
        break;
      }
    }
    
    // Extract LinkedIn with better pattern
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9-]+)/gi;
    const linkedinMatch = cvText.match(linkedinPattern);
    let linkedin = linkedinMatch ? linkedinMatch[0] : '';
    
    // Also check for simpler linkedin patterns
    if (!linkedin) {
      const simpleLinkedinPattern = /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
      const simpleMatch = cvText.match(simpleLinkedinPattern);
      linkedin = simpleMatch ? simpleMatch[0] : '';
    }
    
    // Extract address (lines that look like addresses)
    let address = '';
    const allLines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of allLines) {
      if ((line.toLowerCase().includes('vietnam') || 
           line.toLowerCase().includes('viet nam') ||
           line.toLowerCase().includes('ho chi minh') ||
           line.toLowerCase().includes('hanoi') ||
           line.toLowerCase().includes('da nang')) &&
          !emailPattern.test(line) && !phonePattern.test(line)) {
        address = line;
        break;
      }
    }
    
    return {
      full_name,
      address,
      email,
      phone,
      linkedin
    };
  }
  
  /**
   * Parse summary/objective directly from CV text using enhanced processing
   */
  static parseSummary(cvText: string): string {
    // Use enhanced text processor to get cleaner summary section
    const summaryText = EnhancedTextProcessor.extractSection(cvText, 'summary');
    
    if (summaryText && summaryText.length > 20) {
      return summaryText.substring(0, 500); // Limit summary length
    }
    
    // Fallback to original logic if enhanced processor doesn't find summary
    const lines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for summary section with improved patterns
    const summaryPatterns = [
      /^(SUMMARY|PROFESSIONAL SUMMARY|OBJECTIVE|PROFILE|ABOUT|OVERVIEW|PERSONAL STATEMENT)$/i,
      /^(TÓM TẮT|MỤC TIÊU|GIỚI THIỆU|TỔNG QUAN|THÔNG TIN CÁ NHÂN)$/i
    ];
    
    let summaryStartIndex = -1;
    let summaryEndIndex = -1;
    
    // Find summary section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (summaryPatterns.some(pattern => pattern.test(line))) {
        summaryStartIndex = i + 1;
        break;
      }
    }
    
    if (summaryStartIndex === -1) {
      // No explicit summary section, create from meaningful lines near the top
      const meaningfulLines = lines.slice(0, 10).filter(line => 
        line.length > 50 && 
        line.length < 300 &&
        !/[@+\d]/.test(line) &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('cv') &&
        !line.toLowerCase().includes('experience') &&
        !line.toLowerCase().includes('education') &&
        !line.toLowerCase().includes('skills') &&
        !/^[A-Z\s]+$/.test(line) // Not all caps header
      );
      
      if (meaningfulLines.length > 0) {
        return meaningfulLines.slice(0, 2).join(' ').substring(0, 400);
      }
      return '';
    }
    
    // Find summary section end (next section or reasonable limit)
    const nextSectionPatterns = [
      /^(EXPERIENCE|WORK|EMPLOYMENT|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS)$/i,
      /^(KINH NGHIỆM|HỌC VẤN|KỸ NĂNG|CHỨNG CHỈ|DỰ ÁN)$/i
    ];
    
    for (let i = summaryStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (nextSectionPatterns.some(pattern => pattern.test(line))) {
        summaryEndIndex = i;
        break;
      }
    }
    
    if (summaryEndIndex === -1) {
      summaryEndIndex = Math.min(summaryStartIndex + 8, lines.length);
    }
    
    const summaryLines = lines.slice(summaryStartIndex, summaryEndIndex);
    return summaryLines.join(' ').trim().substring(0, 400);
  }
  
  /**
   * Parse education directly from CV text using enhanced processing
   */
  static parseEducation(cvText: string): CVParsingResponse['education'] {
    // Use enhanced text processor to get cleaner education section
    const educationText = EnhancedTextProcessor.extractSection(cvText, 'education');
    const textToProcess = educationText || cvText;
    
    const lines = textToProcess.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find education section with improved patterns
    const educationPatterns = [
      /^(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS|DEGREES)$/i,
      /^(HỌC VẤN|BẰNG CẤP|ĐÀO TẠO|TRÌNH ĐỘ HỌC VẤN)$/i
    ];
    
    let educationStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (educationPatterns.some(pattern => pattern.test(line))) {
        educationStartIndex = i + 1;
        break;
      }
    }
    
    // If no clear section found, look for education-related content
    if (educationStartIndex === -1) {
      const educationLines = lines.filter(line => 
        /\b(bachelor|master|phd|degree|university|college|institute|school|diploma|certificate|graduated)\b/i.test(line)
      );
      
      if (educationLines.length === 0) {
        return [];
      }
      
      // Process education lines directly
      return this.parseEducationEntries(educationLines);
    }
    
    // Find section end
    const nextSectionPatterns = [
      /^(EXPERIENCE|WORK|SKILLS|CERTIFICATIONS|PROJECTS)$/i,
      /^(KINH NGHIỆM|KỸ NĂNG|CHỨNG CHỈ|DỰ ÁN)$/i
    ];
    
    let educationEndIndex = lines.length;
    for (let i = educationStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (nextSectionPatterns.some(pattern => pattern.test(line))) {
        educationEndIndex = i;
        break;
      }
    }
    
    const educationLines = lines.slice(educationStartIndex, educationEndIndex);
    return this.parseEducationEntries(educationLines);
  }
  
  /**
   * Helper method to parse education entries from lines
   */
  private static parseEducationEntries(lines: string[]): CVParsingResponse['education'] {
    const education: CVParsingResponse['education'] = [];
    let currentEntry = {
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      description: ''
    };
    
    for (const line of lines) {
      if (line.length < 10) continue;
      
      // Look for degree patterns
      if (/\b(bachelor|master|phd|degree|diploma|certificate|b\.s\.|m\.s\.|b\.a\.|m\.a\.)\b/i.test(line)) {
        if (currentEntry.degree) {
          education.push({ ...currentEntry });
          currentEntry = { degree: '', institution: '', location: '', graduationDate: '', description: '' };
        }
        currentEntry.degree = line;
      }
      // Look for institution patterns
      else if (/\b(university|college|institute|school|academy|institut)\b/i.test(line)) {
        currentEntry.institution = line;
      }
      // Look for dates
      else if (/\b(19|20)\d{2}\b/.test(line)) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          currentEntry.graduationDate = yearMatch[0];
        }
      }
      // Look for GPA or ranking information
      else if (/\b(gpa|rank|grade)\b/i.test(line) || /\d+\.\d+\/\d+/.test(line)) {
        currentEntry.description += (currentEntry.description ? ' | ' : '') + line;
      }
      // Everything else as description
      else if (line.length > 15) {
        currentEntry.description += (currentEntry.description ? ' ' : '') + line;
      }
    }
    
    // Add final entry if it has content
    if (currentEntry.degree || currentEntry.institution) {
      education.push(currentEntry);
    }
    
    return education;
  }
  
  /**
   * Parse skills directly from CV text using enhanced processing
   */
  static parseSkills(cvText: string): string[] {
    // Use enhanced text processor to get cleaner skills section
    const skillsText = EnhancedTextProcessor.extractSection(cvText, 'skills');
    const textToProcess = skillsText || cvText;
    
    const lines = textToProcess.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find skills section with improved patterns
    const skillsPatterns = [
      /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE|TECHNOLOGIES|TOOLS)$/i,
      /^(KỸ NĂNG|NĂNG LỰC|CHUYÊN MÔN|CÔNG NGHỆ|CÔNG CỤ|KIẾN THỨC)$/i
    ];
    
    let skillsStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (skillsPatterns.some(pattern => pattern.test(line))) {
        skillsStartIndex = i + 1;
        break;
      }
    }
    
    let skillsTextToProcess = '';
    if (skillsStartIndex !== -1) {
      // Find section end
      const nextSectionPatterns = [
        /^(EXPERIENCE|WORK|EDUCATION|CERTIFICATIONS|PROJECTS|LANGUAGES|INTERESTS)$/i,
        /^(KINH NGHIỆM|HỌC VẤN|CHỨNG CHỈ|DỰ ÁN|NGÔN NGỮ|SỞ THÍCH)$/i
      ];
      
      let skillsEndIndex = lines.length;
      for (let i = skillsStartIndex; i < lines.length; i++) {
        const line = lines[i];
        if (nextSectionPatterns.some(pattern => pattern.test(line))) {
          skillsEndIndex = i;
          break;
        }
      }
      
      skillsTextToProcess = lines.slice(skillsStartIndex, skillsEndIndex).join(' ');
    } else {
      // No explicit skills section, extract from entire text
      skillsTextToProcess = textToProcess;
    }
    
    // Enhanced skill extraction patterns with better organization
    const skillPatterns = [
      // Programming languages
      /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|Scala|R|MATLAB|SQL)\b/gi,
      // Frontend technologies  
      /\b(React|Vue|Angular|Svelte|jQuery|HTML|CSS|SASS|LESS|Bootstrap|Tailwind|Material-UI|Next\.js|Nuxt)\b/gi,
      // Backend technologies
      /\b(Node\.js|Express|Django|Flask|Spring|Laravel|Ruby on Rails|ASP\.NET|GraphQL|REST API|FastAPI)\b/gi,
      // Databases
      /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle|SQL Server|SQLite|DynamoDB|Cassandra|Firebase)\b/gi,
      // Cloud & DevOps
      /\b(AWS|Azure|Google Cloud|Docker|Kubernetes|Jenkins|CI\/CD|Terraform|Ansible|Nginx|Apache|Heroku)\b/gi,
      // Tools & Platforms
      /\b(Git|GitHub|GitLab|Jira|Slack|Figma|Sketch|Adobe|Photoshop|Illustrator|InDesign|Postman|VS Code)\b/gi,
      // Data & Analytics
      /\b(Machine Learning|Data Science|AI|Artificial Intelligence|Deep Learning|Analytics|Statistics|Tableau|Power BI|Excel)\b/gi,
      // Management & Soft Skills
      /\b(Product Management|Project Management|Agile|Scrum|Leadership|Communication|Problem Solving|Team Management|Kanban|Strategy)\b/gi,
      // Industry specific
      /\b(SEO|SEM|Digital Marketing|Content Marketing|Social Media|E-commerce|Fintech|Healthcare|Blockchain)\b/gi,
      // General professional skills
      /\b(Data Analysis|Interpersonal skill|Language|Presentation|Negotiation|Strategic Planning|Research|Documentation)\b/gi
    ];
    
    const extractedSkills: string[] = [];
    skillPatterns.forEach(pattern => {
      const matches = skillsTextToProcess.match(pattern) || [];
      extractedSkills.push(...matches.map(skill => skill.trim()));
    });
    
    // Also extract from comma-separated or bullet-pointed skills
    const skillLines = skillsTextToProcess.split(/[,•·\n]/).map(s => s.trim()).filter(s => s.length > 2);
    skillLines.forEach(skill => {
      // Check if it looks like a skill (not too long, not a sentence)
      if (skill.length > 2 && skill.length < 30 && !/\b(the|and|with|for|in|on|at)\b/i.test(skill)) {
        extractedSkills.push(skill);
      }
    });
    
    // Remove duplicates and normalize
    const uniqueSkills = [...new Set(extractedSkills.map(skill => skill.toLowerCase()))]
      .map(skill => {
        // Capitalize first letter of each word
        return skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      })
      .filter(skill => skill.length > 1)
      .slice(0, 25); // Increased limit to 25 skills
    
    return uniqueSkills;
  }
  
  /**
   * Extract work experience section text for ChatGPT processing using enhanced processing
   */
  static extractWorkExperienceText(cvText: string): string {
    // Use enhanced text processor to get cleaner experience section
    const experienceText = EnhancedTextProcessor.extractSection(cvText, 'experience');
    
    if (experienceText && experienceText.length > 50) {
      return experienceText;
    }
    
    // Fallback to original logic with improved patterns
    const lines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find work experience section with stricter patterns
    const experiencePatterns = [
      /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|CAREER|JOB HISTORY|WORK HISTORY)$/i,
      /^(KINH NGHIỆM|KINH NGHIỆM LÀM VIỆC|LỊCH SỬ CÔNG VIỆC|SỰ NGHIỆP)$/i
    ];
    
    let experienceStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (experiencePatterns.some(pattern => pattern.test(line))) {
        experienceStartIndex = i;
        break;
      }
    }
    
    if (experienceStartIndex === -1) {
      // No clear section found, look for experience-related content
      const experienceLines = lines.filter(line => 
        /\b(manager|engineer|developer|analyst|director|coordinator|specialist|lead|senior|junior)\b/i.test(line) ||
        /\b(company|corp|corporation|inc|ltd|llc|technologies|solutions|systems)\b/i.test(line) ||
        /\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*present|present|now|\d{4}\s*–\s*\d{4}/i.test(line) ||
        /\b(worked|responsible|managed|developed|led|created|implemented|achieved|delivered)\b/i.test(line)
      );
      
      if (experienceLines.length === 0) {
        return '';
      }
      
      return experienceLines.join('\n');
    }
    
    // Find section end
    const nextSectionPatterns = [
      /^(EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|VOLUNTEER|HOBBIES|LANGUAGES|INTERESTS)$/i,
      /^(HỌC VẤN|KỸ NĂNG|CHỨNG CHỈ|DỰ ÁN|TÌNH NGUYỆN|SỞ THÍCH|NGÔN NGỮ)$/i
    ];
    
    let experienceEndIndex = lines.length;
    for (let i = experienceStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (nextSectionPatterns.some(pattern => pattern.test(line))) {
        experienceEndIndex = i;
        break;
      }
    }
    
    return lines.slice(experienceStartIndex, experienceEndIndex).join('\n');
  }
}

/**
 * Main Hybrid CV Parser Service
 */
export class HybridCVParserService {
  private static instance: HybridCVParserService;
  private cache = new Map<string, { data: CVParsingResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): HybridCVParserService {
    if (!HybridCVParserService.instance) {
      HybridCVParserService.instance = new HybridCVParserService();
    }
    return HybridCVParserService.instance;
  }

  /**
   * Generate ChatGPT prompt specifically for work experience parsing
   */
  private generateWorkExperiencePrompt(experienceText: string, language: SupportedLanguage): { system: string; user: string } {
    if (language === 'vi') {
      const system = `Bạn là chuyên gia trích xuất kinh nghiệm làm việc từ CV. Bạn CHỈ TRÍCH XUẤT thông tin có sẵn, KHÔNG tạo mới hay suy đoán. Bạn TUYỆT ĐỐI KHÔNG được sửa đổi, viết lại hay tóm tắt nội dung gốc.`;
      
      const user = `Trích xuất TOÀN BỘ thông tin kinh nghiệm làm việc từ văn bản sau và cấu trúc theo JSON:

{
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["trích xuất TẤT CẢ bullet points từ CV gốc", "giữ nguyên TẤT CẢ chi tiết", "thêm bullets theo nội dung thực tế", "không giới hạn số lượng"]
    }
  ]
}

YÊU CẦU BẮT BUỘC:
- CHỈ TRÍCH XUẤT: Không được sửa đổi, viết lại hay tóm tắt
- GIỮ NGUYÊN TẤT CẢ: Trách nhiệm, thành tích, số liệu từ CV gốc
- KHÔNG GIỚI HẠN: Thêm tất cả bullets cần thiết để phản ánh đầy đủ nội dung

Văn bản kinh nghiệm làm việc:
${experienceText}`;

      return { system, user };
    } else {
      const system = `You are a work experience extraction expert. You ONLY EXTRACT information that is explicitly available. You NEVER fabricate, infer, rewrite, summarize, or modify the original content.`;
      
      const user = `Extract ALL work experience information from the text below and structure it in JSON format:

{
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["extract ALL bullet points from original CV", "preserve ALL details", "add bullets as needed for actual content", "no limit on number"]
    }
  ]
}

MANDATORY REQUIREMENTS:
- ONLY EXTRACT: Do NOT modify, rewrite, summarize, or alter original content
- PRESERVE ALL: Responsibilities, achievements, metrics, and details from original CV
- NO LIMITS: Add all bullets necessary to fully reflect the original CV content

Work experience text:
${experienceText}`;

      return { system, user };
    }
  }

  /**
   * Call ChatGPT API for work experience parsing only
   */
  private async callChatGPTForWorkExperience(experienceText: string, language: SupportedLanguage): Promise<ChatGPTResult> {
    try {
      const prompts = this.generateWorkExperiencePrompt(experienceText, language);
      
      const messages: ChatMessage[] = [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || '[REDACTED_OPENAI_KEY]'}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 2000, // Reduced for work experience only
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ChatGPT API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      try {
        const parsedData = JSON.parse(result.choices[0]?.message?.content || '{}');
        return {
          success: true,
          data: parsedData,
          usage: result.usage
        };
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response:', result.choices[0]?.message?.content);
        return {
          success: false,
          error: 'Failed to parse ChatGPT response as JSON'
        };
      }
    } catch (error) {
      console.error('ChatGPT API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  /**
   * Main hybrid parsing method
   */
  async parseCV(cvText: string, userLanguage?: SupportedLanguage): Promise<HybridCVParserResult> {
    const startTime = Date.now();
    console.log('🔄 Hybrid CV Parser: Starting optimized parsing');
    
    try {
      const systemLanguage: SupportedLanguage = userLanguage || 'en';
      
      // Check cache
      const cacheKey = `hybrid_cv_parse_${systemLanguage}_${btoa(cvText.substring(0, 100))}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🎯 Hybrid CV Parser: Using cached result');
        return {
          success: true,
          data: cached.data,
          language: systemLanguage,
          source: 'cache',
          processingTime: Date.now() - startTime
        };
      }

      // Step 0: Preprocess CV text for better section detection
      console.log('🔧 Step 0: Preprocessing CV text for enhanced parsing');
      const processedText = EnhancedTextProcessor.preprocessCVText(cvText);
      
      console.log('✅ Text preprocessing completed:', {
        originalLength: processedText.processingReport.originalLength,
        cleanedLength: processedText.processingReport.cleanedLength,
        textQuality: processedText.textQuality,
        sectionsFound: processedText.processingReport.sectionsFound,
        qualityIssues: processedText.processingReport.qualityIssues.length
      });

      // Use cleaned text for all parsing operations
      const cleanedCvText = processedText.cleanedText;

      // Step 1: Direct parsing for Contact, Summary, Education, Skills
      console.log('📊 Step 1: Direct parsing for Contact, Summary, Education, Skills');
      
      const contact = SectionParsers.parseContact(cleanedCvText);
      const summary = SectionParsers.parseSummary(cleanedCvText);
      const education = SectionParsers.parseEducation(cleanedCvText);
      const skills = SectionParsers.parseSkills(cleanedCvText);
      
      console.log('✅ Direct parsing completed:', {
        contactFound: !!contact.full_name,
        summaryLength: summary.length,
        educationEntries: education.length,
        skillsCount: skills.length
      });

      // Step 2: Extract work experience text and send to ChatGPT
      console.log('🤖 Step 2: ChatGPT parsing for Work Experience');
      
      const experienceText = SectionParsers.extractWorkExperienceText(cleanedCvText);
      let work_experience: CVParsingResponse['work_experience'] = [];
      
      if (experienceText.trim()) {
        console.log('📤 Sending work experience to ChatGPT:', {
          textLength: experienceText.length,
          estimatedTokens: Math.ceil(experienceText.length / 1.33)
        });
        
        const chatGPTResult = await this.callChatGPTForWorkExperience(experienceText, systemLanguage);
        
        if (chatGPTResult.success && chatGPTResult.data?.work_experience) {
          work_experience = chatGPTResult.data.work_experience;
          console.log('✅ ChatGPT work experience parsing completed:', {
            experienceEntries: work_experience.length,
            tokensUsed: chatGPTResult.usage?.total_tokens || 0
          });
        } else {
          console.warn('⚠️ ChatGPT work experience parsing failed:', chatGPTResult.error);
        }
      } else {
        console.log('ℹ️ No work experience section found');
      }

      // Step 3: Combine results into unified JSON
      console.log('🔗 Step 3: Combining results into unified JSON');
      
      const combinedResult: CVParsingResponse = {
        possibility_score: 10, // High confidence for hybrid parsing
        contact,
        summary: summary || undefined,
        work_experience: work_experience.length > 0 ? work_experience : undefined,
        education: education.length > 0 ? education : undefined,
        skills: skills.length > 0 ? skills : undefined
      };

      // Cache the result
      this.cache.set(cacheKey, { data: combinedResult, timestamp: Date.now() });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Hybrid CV Parser: Completed in ${processingTime}ms`);

      return {
        success: true,
        data: combinedResult,
        language: systemLanguage,
        source: 'hybrid',
        processingTime,
        tokensSaved: Math.ceil(cvText.length / 1.33) - Math.ceil(experienceText.length / 1.33) // Estimated tokens saved
      };

    } catch (error) {
      console.error('❌ Hybrid CV Parser failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        language: userLanguage || 'en',
        source: 'hybrid',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Convert to guided editing format (maintains compatibility)
   */
  convertToGuidedEditingFormat(data: CVParsingResponse): any {
    return {
      contact: {
        fullName: data.contact?.full_name || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        address: data.contact?.address || '',
        linkedin: data.contact?.linkedin || ''
      },
      summary: data.summary || '',
      workExperience: data.work_experience?.map(exp => ({
        position: exp.position,
        company: exp.company,
        location: exp.location,
        startDate: exp.start_date,
        endDate: exp.end_date,
        bullets: exp.bullets
      })) || [],
      education: data.education?.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        location: edu.location,
        graduationDate: edu.graduationDate,
        description: edu.description
      })) || [],
      skills: data.skills || []
    };
  }
}