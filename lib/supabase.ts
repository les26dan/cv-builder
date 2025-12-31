import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Mock CV data for development/testing when Supabase is not configured
export const mockCVs = [
  {
    id: '1',
    title: 'CV Marketing Manager',
    status: 'completed' as const,
    score: 92,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    userId: 'mock-user-1',
  },
  {
    id: '2', 
    title: 'CV Software Engineer',
    status: 'in_progress' as const,
    score: 75,
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    userId: 'mock-user-1',
  },
  {
    id: '3',
    title: 'CV Project Manager',
    status: 'new' as const,
    score: 45,
    lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    userId: 'mock-user-1',
  },
]

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
  content?: string
  jobDescription?: string
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
  if (!supabase) {
    // Return mock data for development
    console.log('Supabase not configured, using mock data')
    return mockCVs.filter(cv => cv.userId === userId)
  }

  try {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching CVs:', error)
      return mockCVs.filter(cv => cv.userId === userId)
    }

    return (data as unknown as CVRow[])?.map(cv => ({
      id: cv.id,
      title: cv.title || 'Untitled CV',
      status: (cv.status as CVData['status']) || 'new',
      score: cv.score || 0,
      lastUpdated: new Date(cv.updated_at),
      userId: cv.user_id,
      content: cv.content || undefined,
      jobDescription: cv.job_description || undefined,
    })) || []
  } catch (error) {
    console.error('Database connection error:', error)
    return mockCVs.filter(cv => cv.userId === userId)
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
    // Add to mock data for development
    console.log('Supabase not configured, creating mock CV')
    mockCVs.push(newCV)
    return newCV
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

export async function deleteCV(cvId: string): Promise<boolean> {
  if (!supabase) {
    // Remove from mock data for development
    console.log('Supabase not configured, removing from mock data')
    const index = mockCVs.findIndex(cv => cv.id === cvId)
    if (index > -1) {
      mockCVs.splice(index, 1)
      return true
    }
    return false
  }

  try {
    const { error } = await supabase
      .from('cvs')
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