/**
 * AI Analysis Service - CV JD Upload Project
 * Real ChatGPT API integration for CV analysis and job description processing
 * Following OkBuddy tenets: modular, swappable, bilingual support
 */

import { NextApiRequest } from 'next'

// Environment configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Response interfaces
export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  language?: 'vi' | 'en'
  source?: 'api' | 'cache' | 'fallback'
}

export interface CVAnalysisResult {
  extractedContent: {
    summary: string
    experience: ExperienceItem[]
    skills: string[]
    education: EducationItem[]
    qualityScore: number
  }
  suggestions: {
    section: string
    type: 'missing' | 'improvement' | 'enhancement'
    recommendation: string
    priority: 'high' | 'medium' | 'low'
  }[]
  jobMatch?: {
    compatibility: number
    strengths: string[]
    gaps: string[]
    recommendations: string[]
  }
}

export interface ExperienceItem {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  bullets: string[]
}

export interface EducationItem {
  id: string
  degree: string
  institution: string
  location?: string
  graduationYear: string
  gpa?: string
}

export interface JobAnalysisResult {
  requirements: {
    essential: string[]
    preferred: string[]
    technical: string[]
    soft: string[]
  }
  industryCategory: string
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'executive'
  keywords: string[]
  companyInfo?: {
    size?: string
    industry?: string
    culture?: string[]
  }
}

export interface CVJDMatchResult {
  overallScore: number
  sectionScores: {
    summary: number
    experience: number
    skills: number
    education: number
  }
  improvements: string[]
  keywords: {
    matched: string[]
    missing: string[]
    suggested: string[]
  }
}

// ChatGPT API integration
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  max_tokens: number
  temperature: number
  top_p?: number
}

// Prompt language: always Vietnamese for this repo
const PROMPT_LANGUAGE: 'vi' | 'en' = 'vi'

// Language detection (used for cache key and fallback text only; prompts always use PROMPT_LANGUAGE)
function detectLanguage(text: string): 'vi' | 'en' {
  const vietnamesePatterns = [
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
    /\b(và|của|trong|với|để|cho|từ|về|có|được|sẽ|đã|kinh nghiệm|kỹ năng|công việc)\b/i
  ]
  const englishPatterns = [
    /\b(experience|skills|education|work|job|company|project|manage|develop|implement)\b/i
  ]
  const viMatch = vietnamesePatterns.some(pattern => pattern.test(text))
  const enMatch = englishPatterns.some(pattern => pattern.test(text))
  if (viMatch && !enMatch) return 'vi'
  if (enMatch && !viMatch) return 'en'
  return 'vi'
}

// AI Prompt templates
const AI_PROMPTS = {
  vi: {
    cvAnalysis: {
      system: "Bạn là chuyên gia phân tích CV hàng đầu tại Việt Nam với hơn 15 năm kinh nghiệm trong tuyển dụng và đánh giá nhân tài. Nhiệm vụ của bạn là phân tích CV và đưa ra đánh giá chi tiết, chính xác về chất lượng và đề xuất cải thiện phù hợp với thị trường Việt Nam.",
      user: "Hãy phân tích CV sau và trả về kết quả dưới dạng JSON với cấu trúc chính xác:\n\nNội dung CV:\n{cvText}\n\nTrả về JSON với cấu trúc:\n{\n  \"extractedContent\": {\n    \"summary\": \"tóm tắt chuyên nghiệp\",\n    \"experience\": [{\"title\": \"\", \"company\": \"\", \"startDate\": \"\", \"endDate\": \"\", \"bullets\": []}],\n    \"skills\": [\"kỹ năng 1\", \"kỹ năng 2\"],\n    \"education\": [{\"degree\": \"\", \"institution\": \"\", \"graduationYear\": \"\"}],\n    \"qualityScore\": 85\n  },\n  \"suggestions\": [{\n    \"section\": \"summary\",\n    \"type\": \"improvement\",\n    \"recommendation\": \"đề xuất cải thiện\",\n    \"priority\": \"high\"\n  }]\n}"
    },
    jobAnalysis: {
      system: "Bạn là chuyên gia phân tích mô tả công việc với kinh nghiệm sâu về thị trường lao động Việt Nam. Bạn hiểu rõ yêu cầu của nhà tuyển dụng và có thể trích xuất thông tin quan trọng từ JD một cách chính xác.",
      user: "Phân tích mô tả công việc sau và trả về JSON:\n\nMô tả công việc:\n{jobDescription}\n\nTrả về:\n{\n  \"requirements\": {\n    \"essential\": [\"yêu cầu bắt buộc\"],\n    \"preferred\": [\"yêu cầu ưu tiên\"],\n    \"technical\": [\"kỹ năng kỹ thuật\"],\n    \"soft\": [\"kỹ năng mềm\"]\n  },\n  \"industryCategory\": \"ngành nghề\",\n  \"seniorityLevel\": \"mid\",\n  \"keywords\": [\"từ khóa quan trọng\"]\n}"
    },
    cvjdMatch: {
      system: "Bạn là chuyên gia đối sánh CV và Job Description, có khả năng đánh giá độ phù hợp giữa ứng viên và vị trí tuyển dụng với độ chính xác cao.",
      user: "So sánh CV và Job Description, đánh giá độ phù hợp:\n\nCV:\n{cvContent}\n\nJob Description:\n{jobDescription}\n\nTrả về JSON:\n{\n  \"overallScore\": 75,\n  \"sectionScores\": {\n    \"summary\": 80,\n    \"experience\": 85,\n    \"skills\": 70,\n    \"education\": 90\n  },\n  \"improvements\": [\"đề xuất cải thiện\"],\n  \"keywords\": {\n    \"matched\": [\"từ khóa khớp\"],\n    \"missing\": [\"từ khóa thiếu\"],\n    \"suggested\": [\"từ khóa nên thêm\"]\n  }\n}"
    }
  },
  en: {
    cvAnalysis: {
      system: "You are a leading CV analysis expert with over 15 years of experience in recruitment and talent assessment. Your task is to analyze CVs and provide detailed, accurate quality assessments and improvement suggestions suitable for the international job market.",
      user: "Analyze the following CV and return results in JSON format with exact structure:\n\nCV Content:\n{cvText}\n\nReturn JSON with structure:\n{\n  \"extractedContent\": {\n    \"summary\": \"professional summary\",\n    \"experience\": [{\"title\": \"\", \"company\": \"\", \"startDate\": \"\", \"endDate\": \"\", \"bullets\": []}],\n    \"skills\": [\"skill 1\", \"skill 2\"],\n    \"education\": [{\"degree\": \"\", \"institution\": \"\", \"graduationYear\": \"\"}],\n    \"qualityScore\": 85\n  },\n  \"suggestions\": [{\n    \"section\": \"summary\",\n    \"type\": \"improvement\",\n    \"recommendation\": \"improvement suggestion\",\n    \"priority\": \"high\"\n  }]\n}"
    },
    jobAnalysis: {
      system: "You are a job description analysis expert with deep understanding of the international job market. You can accurately extract important information from JDs and understand employer requirements.",
      user: "Analyze the following job description and return JSON:\n\nJob Description:\n{jobDescription}\n\nReturn:\n{\n  \"requirements\": {\n    \"essential\": [\"required skills\"],\n    \"preferred\": [\"preferred skills\"],\n    \"technical\": [\"technical skills\"],\n    \"soft\": [\"soft skills\"]\n  },\n  \"industryCategory\": \"industry\",\n  \"seniorityLevel\": \"mid\",\n  \"keywords\": [\"important keywords\"]\n}"
    },
    cvjdMatch: {
      system: "You are a CV-JD matching expert capable of accurately assessing the compatibility between candidates and job positions.",
      user: "Compare CV and Job Description, assess compatibility:\n\nCV:\n{cvContent}\n\nJob Description:\n{jobDescription}\n\nReturn JSON:\n{\n  \"overallScore\": 75,\n  \"sectionScores\": {\n    \"summary\": 80,\n    \"experience\": 85,\n    \"skills\": 70,\n    \"education\": 90\n  },\n  \"improvements\": [\"improvement suggestions\"],\n  \"keywords\": {\n    \"matched\": [\"matched keywords\"],\n    \"missing\": [\"missing keywords\"],\n    \"suggested\": [\"suggested keywords\"]\n  }\n}"
    }
  }
}

// Caching layer
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

function getCacheKey(prompt: string, context: any): string {
  return `ai_${Buffer.from(prompt + JSON.stringify(context)).toString('base64').slice(0, 32)}`
}

function getCachedResponse(cacheKey: string): any | null {
  const cached = responseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  responseCache.delete(cacheKey)
  return null
}

function setCachedResponse(cacheKey: string, data: any, ttl: number = 3600000): void {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Core ChatGPT API function
async function callChatGPT(messages: ChatMessage[], retryCount: number = 0): Promise<any> {
  const maxRetries = 3
  const timeout = 30000 // 30 seconds

  try {
    const requestBody: ChatCompletionRequest = {
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.3,
      top_p: 0.9
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    return result.choices?.[0]?.message?.content || ''

  } catch (error: any) {
    console.error(`ChatGPT API call failed (attempt ${retryCount + 1}):`, error.message)

    if (retryCount < maxRetries && !error.message.includes('abort')) {
      // Use shorter delays in test environment
      const baseDelay = process.env.NODE_ENV === 'test' ? 10 : 1000
      const delay = Math.pow(2, retryCount) * baseDelay // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
      return callChatGPT(messages, retryCount + 1)
    }

    throw error
  }
}

// Main AI analysis functions
export async function analyzeCVWithAI(cvText: string, jobDescription?: string): Promise<AIResponse<CVAnalysisResult>> {
  const language = detectLanguage(cvText)
  const cacheKey = getCacheKey('cv_analysis', { cvText, jobDescription, language })
  
  // Check cache first
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    return {
      success: true,
      data: cached,
      language,
      source: 'cache'
    }
  }

  try {
    const promptTemplate = AI_PROMPTS[PROMPT_LANGUAGE].cvAnalysis
    const userPrompt = promptTemplate.user.replace('{cvText}', cvText)

    const messages: ChatMessage[] = [
      { role: 'system', content: promptTemplate.system },
      { role: 'user', content: userPrompt }
    ]

    const response = await callChatGPT(messages)
    
    // Parse JSON response
    let analysisResult: CVAnalysisResult
    try {
      analysisResult = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      throw new Error('Invalid AI response format')
    }

    // If job description provided, add matching analysis
    if (jobDescription) {
      const matchResult = await performCVJDMatching(cvText, jobDescription)
      if (matchResult.success && matchResult.data) {
        analysisResult.jobMatch = {
          compatibility: matchResult.data.overallScore,
          strengths: matchResult.data.keywords.matched,
          gaps: matchResult.data.keywords.missing,
          recommendations: matchResult.data.improvements
        }
      }
    }

    // Cache the result
    setCachedResponse(cacheKey, analysisResult)

    return {
      success: true,
      data: analysisResult,
      language,
      source: 'api'
    }

  } catch (error: any) {
    console.error('CV analysis failed:', error.message)

    // Fallback to mock analysis
    const fallbackResult: CVAnalysisResult = {
      extractedContent: {
        summary: language === 'vi' ? 'Tóm tắt CV được tạo từ hệ thống dự phòng' : 'CV summary generated from fallback system',
        experience: [],
        skills: [],
        education: [],
        qualityScore: 65
      },
      suggestions: [
        {
          section: 'summary',
          type: 'improvement',
          recommendation: language === 'vi' ? 'Cải thiện phần tóm tắt để nổi bật hơn' : 'Improve summary section to be more prominent',
          priority: 'medium'
        }
      ]
    }

    return {
      success: true,
      data: fallbackResult,
      language,
      source: 'fallback',
      error: `AI analysis failed: ${error.message}`
    }
  }
}

export async function analyzeJobDescriptionWithAI(jobDescription: string): Promise<AIResponse<JobAnalysisResult>> {
  const language = detectLanguage(jobDescription)
  const cacheKey = getCacheKey('jd_analysis', { jobDescription, language })
  
  // Check cache first
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    return {
      success: true,
      data: cached,
      language,
      source: 'cache'
    }
  }

  try {
    const promptTemplate = AI_PROMPTS[PROMPT_LANGUAGE].jobAnalysis
    const userPrompt = promptTemplate.user.replace('{jobDescription}', jobDescription)

    const messages: ChatMessage[] = [
      { role: 'system', content: promptTemplate.system },
      { role: 'user', content: userPrompt }
    ]

    const response = await callChatGPT(messages)
    
    // Parse JSON response
    let analysisResult: JobAnalysisResult
    try {
      analysisResult = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      throw new Error('Invalid AI response format')
    }

    // Cache the result
    setCachedResponse(cacheKey, analysisResult)

    return {
      success: true,
      data: analysisResult,
      language,
      source: 'api'
    }

  } catch (error: any) {
    console.error('Job description analysis failed:', error.message)

    // Fallback to mock analysis
    const fallbackResult: JobAnalysisResult = {
      requirements: {
        essential: [language === 'vi' ? 'Yêu cầu cơ bản' : 'Basic requirements'],
        preferred: [language === 'vi' ? 'Yêu cầu ưu tiên' : 'Preferred requirements'],
        technical: [language === 'vi' ? 'Kỹ năng kỹ thuật' : 'Technical skills'],
        soft: [language === 'vi' ? 'Kỹ năng mềm' : 'Soft skills']
      },
      industryCategory: language === 'vi' ? 'Công nghệ' : 'Technology',
      seniorityLevel: 'mid',
      keywords: [language === 'vi' ? 'kinh nghiệm' : 'experience']
    }

    return {
      success: true,
      data: fallbackResult,
      language,
      source: 'fallback',
      error: `JD analysis failed: ${error.message}`
    }
  }
}

export async function performCVJDMatching(cvContent: string, jobDescription: string): Promise<AIResponse<CVJDMatchResult>> {
  const language = detectLanguage(cvContent + ' ' + jobDescription)
  const cacheKey = getCacheKey('cv_jd_match', { cvContent, jobDescription, language })
  
  // Check cache first
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    return {
      success: true,
      data: cached,
      language,
      source: 'cache'
    }
  }

  try {
    const promptTemplate = AI_PROMPTS[PROMPT_LANGUAGE].cvjdMatch
    const userPrompt = promptTemplate.user
      .replace('{cvContent}', cvContent)
      .replace('{jobDescription}', jobDescription)

    const messages: ChatMessage[] = [
      { role: 'system', content: promptTemplate.system },
      { role: 'user', content: userPrompt }
    ]

    const response = await callChatGPT(messages)
    
    // Parse JSON response
    let matchResult: CVJDMatchResult
    try {
      matchResult = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      throw new Error('Invalid AI response format')
    }

    // Cache the result
    setCachedResponse(cacheKey, matchResult)

    return {
      success: true,
      data: matchResult,
      language,
      source: 'api'
    }

  } catch (error: any) {
    console.error('CV-JD matching failed:', error.message)

    // Fallback to mock matching
    const fallbackResult: CVJDMatchResult = {
      overallScore: 70,
      sectionScores: {
        summary: 75,
        experience: 80,
        skills: 65,
        education: 85
      },
      improvements: [language === 'vi' ? 'Cải thiện kỹ năng phù hợp với JD' : 'Improve skills to match JD'],
      keywords: {
        matched: [language === 'vi' ? 'kinh nghiệm' : 'experience'],
        missing: [language === 'vi' ? 'kỹ năng bổ sung' : 'additional skills'],
        suggested: [language === 'vi' ? 'từ khóa gợi ý' : 'suggested keywords']
      }
    }

    return {
      success: true,
      data: fallbackResult,
      language,
      source: 'fallback',
      error: `CV-JD matching failed: ${error.message}`
    }
  }
}

// Utility function for comprehensive analysis
export async function performComprehensiveAnalysis(
  cvText: string,
  jobDescription?: string
): Promise<{
  cvAnalysis: AIResponse<CVAnalysisResult>
  jdAnalysis?: AIResponse<JobAnalysisResult>
  matching?: AIResponse<CVJDMatchResult>
}> {
  const results: any = {
    cvAnalysis: await analyzeCVWithAI(cvText, jobDescription)
  }

  if (jobDescription) {
    results.jdAnalysis = await analyzeJobDescriptionWithAI(jobDescription)
    results.matching = await performCVJDMatching(cvText, jobDescription)
  }

  return results
}

// Cache management
export function clearAnalysisCache(): void {
  responseCache.clear()
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: responseCache.size,
    keys: Array.from(responseCache.keys())
  }
} 