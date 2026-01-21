import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Mock data completely removed - using real database only

// Create Supabase client if credentials are available
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// CV Data Types
export interface CVData {
  id: string
  title: string
  status: 'new' | 'in_progress' | 'completed'
  score: number
  lastUpdated: Date
  userId: string
  content?: any
  jobDescription?: string
  workflowStep?: string
  workflowStepsCompleted?: string[]
}

// Supabase database row type
interface CVRow {
  id: string
  title: string | null
  status: string | null
  score: number | null
  updated_at: string
  user_id: string
  content: string | null
  job_description: string | null
}

// Service functions with fallback to mock data
export async function fetchUserCVs(userId: string): Promise<CVData[]> {
  // Import mock data check
  const { shouldUseMockMode } = await import('../config/environment')
  
  // ALWAYS try real database first - no more mock data fallbacks
  if (shouldUseMockMode()) {
    console.log('🔧 Mock data explicitly enabled - returning empty array for real testing')
    return []
  }
  
  // Force create Supabase client if not already created
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      supabase = createClient(url, key)
      console.log('🔧 Supabase client force-initialized')
    } else {
      console.error('❌ Supabase credentials missing - cannot proceed')
      return []
    }
  }

  try {
    console.log('🔍 Fetching CVs from cv_workflow table for user:', userId)
    const { data, error } = await supabase
      .from('cv_workflow')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error fetching CVs from cv_workflow:', error)
      console.log('🔄 Database error - returning empty array (this is normal for new users)')
      return []
    }

    console.log('✅ Successfully fetched CVs from cv_workflow table:', data?.length || 0)
    
    // Map cv_workflow data to CVData format
    return (data as any[])?.map(cv => ({
      id: cv.id,
      title: cv.title || 'Untitled Resume',
      // Map workflow status to display status
      status: mapWorkflowStatusToDisplayStatus(cv.status),
      score: cv.score || 0,
      lastUpdated: new Date(cv.updated_at),
      userId: cv.user_id,
      content: cv.cv_data || undefined,
      workflowStep: cv.workflow_current_step || 'upload',
      workflowStepsCompleted: cv.workflow_steps_completed || [],
    })) || []
  } catch (error) {
    console.error('❌ Database connection error:', error)
    console.log('🔄 Database connection failed - returning empty array')
    return []
  }
}

// Helper function to map workflow status to display status
function mapWorkflowStatusToDisplayStatus(workflowStatus: string): CVData['status'] {
  switch (workflowStatus) {
    case 'draft':
      return 'new'
    case 'analyzing':
      return 'in_progress'
    case 'completed':
      return 'completed'
    default:
      return 'new'
  }
}

export async function createNewCV(userId: string, title: string): Promise<CVData | null> {
  const newCV: CVData = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    status: 'in_progress',
    score: 0,
    lastUpdated: new Date(),
    userId,
  }

  if (!supabase) {
    console.error('❌ Supabase not configured - cannot create CV')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('cvs')
      .insert([{
        id: newCV.id,
        title: newCV.title,
        status: newCV.status,
        score: newCV.score,
        user_id: newCV.userId,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating CV:', error)
      return null
    }

    const cvRow = data as unknown as CVRow
    return {
      ...newCV,
      id: cvRow.id,
    }
  } catch (error) {
    console.error('Database connection error:', error)
    return null
  }
}

// ====================
// CV DRAFT MANAGEMENT
// ====================

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

// Mock data for development
const mockDrafts: Map<string, CVDraft> = new Map()
const mockAnalysis: Map<string, AnalysisResult> = new Map()

export async function saveCVDraft(draftData: CVDraft): Promise<CVDraft> {
  if (!supabase) {
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

  try {
    const { data, error } = await supabase
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
      console.error('Supabase error saving draft:', error)
      throw error
    }

    return data as unknown as CVDraft
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

export async function getDraftData(userId: string): Promise<CVDraft | null> {
  if (!supabase) {
    return mockDrafts.get(userId) || null
  }

  try {
    const { data, error } = await supabase
      .from('cv_drafts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error getting draft:', error)
      return null
    }

    return (data as unknown as CVDraft) || null
  } catch (error) {
    console.error('Database connection error:', error)
    return null
  }
}

// ====================
// USER MANAGEMENT
// ====================

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

export async function getUserByEmail(email: string): Promise<UserResult> {
  if (!supabase) {
    // Mock implementation
    const user = Array.from(mockUsers.values()).find(u => u.email === email)
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    return { success: true, user }
  }

  try {
    const { data, error } = await supabase
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

    return { success: true, user: data as unknown as User }
  } catch (error) {
    console.error('Database connection error:', error)
    return { success: false, error: 'Database connection failed' }
  }
}

export async function createUser(userData: CreateUserData): Promise<UserResult> {
  // Check if user already exists
  const existingUser = await getUserByEmail(userData.email)
  if (existingUser.success && existingUser.user) {
    return { success: false, error: 'User already exists' }
  }

  if (!supabase) {
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

  try {
    const newUser = {
      ...userData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('Supabase createUser error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, user: data as unknown as User }
  } catch (error) {
    console.error('Database connection error:', error)
    return { success: false, error: 'Database connection failed' }
  }
}

export async function updateCVTitle(cvId: string, newTitle: string, userId: string): Promise<boolean> {
  if (!supabase) {
    console.error('❌ Supabase not configured - cannot update CV title')
    return false
  }

  try {
    console.log(`🔄 Updating CV title: ${cvId} → "${newTitle}"`)
    
    // Update in cv_workflow table (the active table)
    const { error } = await supabase
      .from('cv_workflow')
      .update({ 
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', cvId)
      .eq('user_id', userId) // Security check

    if (error) {
      console.error('❌ Error updating CV title:', error)
      return false
    }

    console.log('✅ CV title updated successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection error during CV title update:', error)
    return false
  }
}

export async function deleteCV(cvId: string): Promise<boolean> {
  if (!supabase) {
    console.error('❌ Supabase not configured - cannot delete CV')
    return false
  }

  try {
    const { error } = await supabase
      .from('cv_workflow')
      .delete()
      .eq('id', cvId)

    if (error) {
      console.error('Error deleting CV:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

// Validate CV ownership - critical security function
export async function validateCVOwnership(cvId: string, userId: string): Promise<boolean> {
  if (!supabase) {
    console.error('❌ Supabase not configured - cannot validate CV ownership')
    return false
  }

  try {
    const { data, error } = await supabase
      .from('cvs')
      .select('user_id')
      .eq('id', cvId)
      .single()

    if (error || !data) {
      console.error('CV not found or error checking ownership:', error)
      return false
    }

    return data.user_id === userId
  } catch (error) {
    console.error('Database connection error during ownership check:', error)
    return false
  }
}

// Get CV data with ownership validation
export async function getCVWithOwnership(cvId: string, userId: string): Promise<CVData | null> {
  // First validate ownership
  const isOwner = await validateCVOwnership(cvId, userId)
  if (!isOwner) {
    console.error('User does not own CV:', { cvId, userId })
    return null
  }

  if (!supabase) {
    console.error('❌ Supabase not configured - cannot fetch CV data')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .eq('user_id', userId) // Double-check ownership in query
      .single()

    if (error || !data) {
      console.error('Error fetching CV or CV not found:', error)
      return null
    }

    const cvRow = data as unknown as CVRow
    return {
      id: cvRow.id,
      title: cvRow.title || 'Untitled CV',
      status: (cvRow.status as CVData['status']) || 'new',
      score: cvRow.score || 0,
      lastUpdated: new Date(cvRow.updated_at),
      userId: cvRow.user_id,
      content: cvRow.content || undefined,
      jobDescription: cvRow.job_description || undefined,
    }
  } catch (error) {
    console.error('Database connection error:', error)
    return null
  }
} 