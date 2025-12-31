import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient | null = null

// Lazy initialization for build compatibility
function getSupabaseClient(): SupabaseClient | null {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

// Database interfaces
export interface CVDraft {
  id?: string
  user_id: string
  file_id?: string
  file_name?: string
  file_size?: number
  file_path?: string
  jd_text?: string
  jd_url?: string
  analysis_id?: string
  created_at?: string
  updated_at?: string
}

export interface SuggestionItem {
  section: string
  type: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

export interface AnalysisResult {
  id?: string
  user_id: string
  analysis_id: string
  cv_score?: number
  suggestions?: SuggestionItem[]
  keywords_found?: string[]
  keywords_missing?: string[]
  ats_score?: number
  status: 'started' | 'completed' | 'failed'
  created_at?: string
  updated_at?: string
}

export interface AnalysisResultData {
  cv_score?: number
  suggestions?: SuggestionItem[]
  keywords_found?: string[]
  keywords_missing?: string[]
  ats_score?: number
}

// Mock data for development
const mockDrafts: Map<string, CVDraft> = new Map()
const mockAnalysis: Map<string, AnalysisResult> = new Map()

// Export for testing
export const __testing__ = {
  mockDrafts,
  mockAnalysis
}

// CV Draft functions
export async function saveCVDraft(draftData: CVDraft): Promise<CVDraft> {
  const client = getSupabaseClient()
  
  if (client) {
    try {
      const { data, error } = await client
        .from('cv_drafts')
        .upsert({
          ...draftData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      return data
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  const draftId = draftData.user_id
  const existingDraft = mockDrafts.get(draftId) || {}
  const updatedDraft: CVDraft = {
    ...existingDraft,
    ...draftData,
    id: draftId,
    updated_at: new Date().toISOString()
  }
  
  mockDrafts.set(draftId, updatedDraft)
  return updatedDraft
}

export async function getDraftData(userId: string): Promise<CVDraft | null> {
  const client = getSupabaseClient()
  
  if (client) {
    try {
      const { data, error } = await client
        .from('cv_drafts')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Supabase error:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  return mockDrafts.get(userId) || null
}

export async function updateDraftJD(userId: string, jdData: { jd_text?: string; jd_url?: string }): Promise<CVDraft> {
  const existingDraft = await getDraftData(userId) || { user_id: userId }
  
  const updatedDraft = await saveCVDraft({
    ...existingDraft,
    ...jdData,
    updated_at: new Date().toISOString()
  })

  return updatedDraft
}

// Analysis functions
export async function saveAnalysisResult(analysisData: AnalysisResult): Promise<AnalysisResult> {
  const client = getSupabaseClient()
  
  if (client) {
    try {
      const { data, error } = await client
        .from('analysis_results')
        .upsert({
          ...analysisData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      return data
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  const analysisId = analysisData.analysis_id
  const updatedAnalysis: AnalysisResult = {
    ...analysisData,
    id: analysisId,
    updated_at: new Date().toISOString()
  }
  
  mockAnalysis.set(analysisId, updatedAnalysis)
  return updatedAnalysis
}

export async function getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
  const client = getSupabaseClient()
  
  if (client) {
    try {
      const { data, error } = await client
        .from('analysis_results')
        .select('*')
        .eq('analysis_id', analysisId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  return mockAnalysis.get(analysisId) || null
}

export async function updateAnalysisStatus(
  analysisId: string, 
  status: 'started' | 'completed' | 'failed', 
  result?: AnalysisResultData
): Promise<AnalysisResult> {
  const existingAnalysis = await getAnalysisResult(analysisId)
  
  if (!existingAnalysis) {
    throw new Error('Analysis not found')
  }

  const updatedAnalysis = await saveAnalysisResult({
    ...existingAnalysis,
    status,
    ...(result && {
      cv_score: result.cv_score,
      suggestions: result.suggestions,
      keywords_found: result.keywords_found,
      keywords_missing: result.keywords_missing,
      ats_score: result.ats_score
    })
  })

  return updatedAnalysis
}

// User management interfaces
export interface User {
  id: string
  full_name: string
  email: string
  password_hash: string
  email_verified: boolean
  created_at: string
  updated_at?: string
}

export interface CreateUserData {
  full_name: string
  email: string
  password_hash: string
  email_verified: boolean
}

export interface UserResult {
  success: boolean
  user?: User
  error?: string
}

// Mock user storage
const mockUsers = new Map<string, User>()

// User management functions
export async function getUserByEmail(email: string): Promise<UserResult> {
  const client = getSupabaseClient()
  
  if (client) {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase getUserByEmail error:', error)
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'User not found' }
      }

      return { success: true, user: data }
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  const user = Array.from(mockUsers.values()).find(u => u.email === email)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  return { success: true, user }
}

export async function createUser(userData: CreateUserData): Promise<UserResult> {
  const client = getSupabaseClient()
  
  // Check if user already exists
  const existingUser = await getUserByEmail(userData.email)
  if (existingUser.success && existingUser.user) {
    return { success: false, error: 'User already exists' }
  }

  if (client) {
    try {
      const newUser = {
        ...userData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await client
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (error) {
        console.error('Supabase createUser error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, user: data }
    } catch (error) {
      console.warn('Falling back to mock data due to database error:', error)
    }
  }

  // Mock implementation
  const userId = crypto.randomUUID()
  const newUser: User = {
    ...userData,
    id: userId,
    created_at: new Date().toISOString()
  }

  mockUsers.set(userId, newUser)
  return { success: true, user: newUser }
}

// Database service object for backward compatibility
export const DatabaseService = {
  getUserByEmail,
  createUser
}

// Utility functions
export async function validateAuth(req: NextApiRequest | null): Promise<string | null> {
  // TODO: Implement actual authentication validation
  // For now, return a mock user ID
  return 'mock-user-1'
}

export async function cleanupOldDrafts(): Promise<void> {
  // TODO: Implement cleanup logic for old draft files
  console.log('Cleanup old drafts - not implemented yet')
} 