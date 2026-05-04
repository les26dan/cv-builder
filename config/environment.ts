/**
 * Environment Configuration
 * Provides environment-specific settings for the CV guided editing application
 */

export interface EnvironmentConfig {
  isDevelopment: boolean
  isProduction: boolean
  supabaseUrl: string
  supabaseAnonKey: string
  enableMockData: boolean
  cacheEnabled: boolean
  cacheTTL: number
  maxCacheSize: number
  debugMode: boolean
  performance: {
    dataCacheTTL: number
  }
  database: {
    supabaseUrl: string
    supabaseAnonKey: string
  }
  ai: {
    openaiApiKey: string
    openaiApiUrl: string
    model: string
    maxTokens: number
    temperature: number
    enableCaching: boolean
    cacheTTL: number
    retryAttempts: number
    timeout: number
  }
  analytics: {
    statsigClientKey: string
    statsigEnabled: boolean
    environment: 'production' | 'staging' | 'development'
  }
}

/**
 * Get environment configuration
 */
export const environmentConfig: EnvironmentConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://mock-supabase-url.com',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key',
  enableMockData: process.env.VITE_ENABLE_MOCK_DATA === 'true',
  cacheEnabled: process.env.VITE_CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.VITE_CACHE_TTL || '300000'), // 5 minutes
  maxCacheSize: parseInt(process.env.VITE_MAX_CACHE_SIZE || '100'),
  debugMode: process.env.VITE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
  performance: {
    dataCacheTTL: parseInt(process.env.VITE_DATA_CACHE_TTL || '300000') // 5 minutes
  },
  database: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://mock-supabase-url.com',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key'
  },
  ai: {
    openaiApiKey: process.env.VITE_OPENAI_API_KEY || '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',
    openaiApiUrl: process.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.VITE_OPENAI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.VITE_OPENAI_TEMPERATURE || '0.7'),
    enableCaching: process.env.VITE_AI_CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.VITE_AI_CACHE_TTL || '3600000'), // 1 hour
    retryAttempts: parseInt(process.env.VITE_AI_RETRY_ATTEMPTS || '3'),
    timeout: parseInt(process.env.VITE_AI_TIMEOUT || '30000') // 30 seconds
  },
  analytics: {
    statsigClientKey: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || 'client-placeholder',
    statsigEnabled: process.env.NEXT_PUBLIC_STATSIG_ENABLED !== 'false',
    environment: (process.env.NODE_ENV as 'production' | 'staging' | 'development') || 'development'
  }
}

/**
 * Get specific environment value
 */
export function getEnvironmentValue(key: keyof EnvironmentConfig): any {
  return environmentConfig[key]
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return environmentConfig.isDevelopment
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return environmentConfig.isProduction
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: environmentConfig.supabaseUrl,
    anonKey: environmentConfig.supabaseAnonKey
  }
}

/**
 * Check if mock data is enabled
 */
export function isMockDataEnabled(): boolean {
  return environmentConfig.enableMockData
}

/**
 * Get cache configuration
 */
export function getCacheConfig(): { enabled: boolean; ttl: number; maxSize: number } {
  return {
    enabled: environmentConfig.cacheEnabled,
    ttl: environmentConfig.cacheTTL,
    maxSize: environmentConfig.maxCacheSize
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return environmentConfig.debugMode
}

/**
 * Check if mock mode should be used
 */
export function shouldUseMockMode(): boolean {
  return environmentConfig.enableMockData
} 