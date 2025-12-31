import { NextApiRequest, NextApiResponse } from 'next'
import { analyzeJobDescriptionWithAI } from '@/lib/aiAnalysis'
import { validateAuth } from '@/lib/database'

interface JobAnalysisApiResponse {
  success: boolean
  message?: string
  analysis?: JobAnalysisResult
  data?: any
  language?: string
  source?: string
  error?: string
}

interface JobAnalysisResult {
  keywords: string[]
  requirements: string[]
  skills: string[]
  experience: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobAnalysisApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
  }

  try {
    // Validate authentication
    const userId = await validateAuth(req)
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const { jobDescription } = req.body

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Job description is required and must be a string'
      })
    }

    if (jobDescription.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Job description must be at least 50 characters long'
      })
    }

    // Perform AI analysis of job description
    const analysisResult = await analyzeJobDescriptionWithAI(jobDescription)

    if (analysisResult.success && analysisResult.data) {
      return res.status(200).json({
        success: true,
        message: 'Job description analysis completed successfully',
        data: analysisResult.data,
        language: analysisResult.language,
        source: analysisResult.source
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze job description',
        error: analysisResult.error
      })
    }

  } catch (error: any) {
    console.error('Job analysis API error:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 