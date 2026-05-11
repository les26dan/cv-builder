/**
 * Unified AI Interfaces - Cross-Project Type Definitions
 * Following CV Builder tenets: modular, swappable, consistent types
 * Centralized interfaces for all AI-related functionality
 */

export type SupportedLanguage = 'vi' | 'en';
export type ContentType = 'summary' | 'bullet' | 'skill' | 'education' | 'custom';
export type AnalysisType = 'basic' | 'comprehensive' | 'matching' | 'optimization';
export type AISource = 'api' | 'cache' | 'fallback';

// Core AI Response Interface
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  language?: SupportedLanguage;
  source?: AISource;
  metadata?: {
    tokens?: number;
    responseTime?: number;
    cacheHit?: boolean;
    retryCount?: number;
  };
}

// OpenAI API Interfaces
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// CV Data Interfaces
export interface CVData {
  contact?: ContactData;
  summary?: string;
  experience?: ExperienceItem[];
  skills?: string[];
  education?: EducationItem[];
  customSections?: CustomSectionData[];
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  website?: string;
}

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  bullets?: string[];
}

export interface EducationItem {
  id?: string;
  degree: string;
  school: string;
  location?: string;
  graduationDate?: string;
  gpa?: string;
  description?: string;
}

export interface CustomSectionData {
  id: string;
  title: string;
  type: 'list' | 'text' | 'tags';
  items?: any[];
  content?: string;
}

// Job Description Analysis Interfaces
export interface JobAnalysisResult {
  summary: string[];
  requirements: {
    essential: string[];
    preferred: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    missing: string[];
  };
  keywords: string[];
  compatibility: number;
  recommendations: JobRecommendation[];
  sections: {
    summary: string[];
    workExperience: string[];
    skills: string[];
    education: string[];
  };
}

export interface JobRecommendation {
  section: string;
  type: 'missing' | 'improvement' | 'enhancement' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  impact?: string;
  examples?: string[];
}

// AI Usage Tracking Interfaces
export interface AIUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalTokens: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Error Handling Interfaces
export interface AIError {
  code: string;
  message: string;
  type: 'network' | 'api' | 'parsing' | 'validation' | 'timeout';
  retryable: boolean;
  context?: any;
}

// Cache Interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  language: SupportedLanguage;
  source: AISource;
  metadata?: {
    tokens?: number;
    responseTime?: number;
  };
}

// Request Context Interfaces
export interface RequestContext {
  language: SupportedLanguage;
  userId?: string;
  sessionId?: string;
  projectId?: string;
  timestamp: number;
  source: 'web' | 'mobile' | 'api';
}

// Prompt Template Interfaces
export interface PromptContext {
  // CV Content
  workExperience?: string;
  skills?: string;
  education?: string;
  summary?: string;
  
  // Job Context
  jobTitle?: string;
  company?: string;
  targetJob?: string;
  jobDescription?: string;
  industry?: string;
  
  // AI Generation Context
  existingContent?: string;
  contentType?: ContentType;
  analysisType?: AnalysisType;
  
  // Wizard Context
  project?: string;
  impact?: string;
  responsibility?: string;
  
  // Additional Context
  currentCV?: string;
  profession?: string;
  keyStrengths?: string;
  sectionType?: string;
  
  // Language Context
  language?: SupportedLanguage;
  culturalContext?: 'vietnamese' | 'international';
}

export interface FormattedPrompt {
  system: string;
  user: string;
}

// Configuration Interfaces
export interface AIConfigOptions {
  openaiApiKey: string;
  openaiApiUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  enableCaching: boolean;
  cacheTTL: number;
  fallbackEnabled: boolean;
  monitoringEnabled: boolean;
}

// Service Response Interfaces
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  uptime: number;
  errorRate: number;
  responseTime: number;
}

export interface ServiceStatistics {
  requests: AIUsageMetrics;
  cache: {
    size: number;
    hitRate: number;
    entries: number;
    memoryUsage: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

// Cross-Project Integration Interfaces
export interface CrossProjectData {
  projectId: string;
  projectType: 'cv-guided-editing' | 'cv-jd-upload' | 'cv-workspace' | 'landing-page';
  cvData?: CVData;
  analysisResults?: JobAnalysisResult;
  preferences?: UserPreferences;
  timestamp: number;
  expiresAt: number;
}

export interface UserPreferences {
  language: SupportedLanguage;
  culturalContext: 'vietnamese' | 'international';
  aiAssistanceLevel: 'basic' | 'enhanced' | 'comprehensive';
  autoSave: boolean;
  notifications: boolean;
}

// Validation Interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
} 