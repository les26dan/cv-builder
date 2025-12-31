import { NextApiRequest, NextApiResponse } from 'next'
import { getDraftData, updateDraftJD, validateAuth } from '@/lib/database'

interface DraftData {
  jd_text?: string
  jd_url?: string
  cv_file_id?: string
  file_name?: string
  file_size?: number
  updated_at?: string
}

interface DraftResponse {
  success: boolean
  message: string
  data?: DraftData
  error?: string
}

const MAX_JD_TEXT_LENGTH = 2000

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DraftResponse>
) {
  try {
    // Validate authentication
    const userId = await validateAuth(req)
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED'
      })
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      // Save/Update draft
      const { jd_text, jd_url } = req.body

      // Validate JD text length
      if (jd_text && jd_text.length > MAX_JD_TEXT_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Văn bản quá dài, hãy rút gọn mô tả (tối đa ${MAX_JD_TEXT_LENGTH} ký tự).`,
          error: 'TEXT_TOO_LONG'
        })
      }

      // Validate URL format if provided
      if (jd_url && jd_url.trim()) {
        try {
          new URL(jd_url)
        } catch {
          return res.status(400).json({
            success: false,
            message: 'URL không hợp lệ.',
            error: 'INVALID_URL'
          })
        }
      }

      // Priority logic: text takes precedence over URL
      const jdData: { jd_text?: string; jd_url?: string } = {}

      if (jd_text && jd_text.trim()) {
        jdData.jd_text = jd_text.trim()
        jdData.jd_url = '' // Clear URL if text is provided
      } else if (jd_url && jd_url.trim()) {
        jdData.jd_url = jd_url.trim()
        jdData.jd_text = ''
      }

      // Save to database
      const updatedDraft = await updateDraftJD(userId, jdData)

      const responseData: DraftData = {
        jd_text: updatedDraft.jd_text,
        jd_url: updatedDraft.jd_url,
        cv_file_id: updatedDraft.file_id,
        file_name: updatedDraft.file_name,
        file_size: updatedDraft.file_size,
        updated_at: updatedDraft.updated_at
      }

      return res.status(200).json({
        success: true,
        message: 'Draft saved successfully',
        data: responseData
      })

    } else if (req.method === 'GET') {
      // Retrieve draft
      const draftData = await getDraftData(userId)

      const responseData: DraftData = {
        jd_text: draftData?.jd_text || '',
        jd_url: draftData?.jd_url || '',
        cv_file_id: draftData?.file_id || '',
        file_name: draftData?.file_name || '',
        file_size: draftData?.file_size || 0,
        updated_at: draftData?.updated_at || new Date().toISOString()
      }

      return res.status(200).json({
        success: true,
        message: 'Draft retrieved successfully',
        data: responseData
      })

    } else {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
        error: 'INVALID_METHOD'
      })
    }

  } catch (error) {
    console.error('Draft API error:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    })
  }
} 