import { NextApiRequest, NextApiResponse } from 'next'
import { validateAuth } from '@/lib/database'

interface AnalysisStatusRequest {
  analysisId: string
}

interface AnalysisStatusResponse {
  success: boolean
  analysisId: string
  status: 'started' | 'in_progress' | 'completed' | 'failed'
  progress: number
  message?: string
  result?: any
  jobAnalysis?: any
  matching?: any
  cvTitle?: string
  originalFile?: any
  jobDescription?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisStatusResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      analysisId: '',
      status: 'failed',
      progress: 0,
      error: 'Method not allowed'
    })
  }

  try {
    // Validate authentication
    const userId = await validateAuth(req)
    if (!userId) {
      return res.status(401).json({
        success: false,
        analysisId: '',
        status: 'failed',
        progress: 0,
        error: 'Unauthorized'
      })
    }

    const { analysisId } = req.body as AnalysisStatusRequest

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        analysisId: '',
        status: 'failed',
        progress: 0,
        error: 'Analysis ID is required'
      })
    }

    // In a real implementation, this would query the database
    // For now, simulate analysis completion after a delay
    const analysisStartTime = parseInt(analysisId.split('_')[1]) || Date.now()
    const elapsedTime = Date.now() - analysisStartTime
    const analysisTimestamp = new Date(analysisStartTime)

    // Simulate 5-second analysis process
    if (elapsedTime < 5000) {
      const progress = Math.min(Math.floor((elapsedTime / 5000) * 100), 95)
      
      let status: 'started' | 'in_progress' = elapsedTime < 1000 ? 'started' : 'in_progress'
      let message = 'Đang phân tích CV với AI...'
      
      if (elapsedTime > 2000) {
        message = 'So sánh với mô tả công việc...'
      }
      if (elapsedTime > 4000) {
        message = 'Hoàn thiện đề xuất cải thiện...'
      }

      return res.status(200).json({
        success: true,
        analysisId,
        status,
        progress,
        message
      })
    }

    // Analysis completed - return mock results
    const completedResult = {
      success: true,
      analysisId,
      status: 'completed' as const,
      progress: 100,
      message: 'Phân tích hoàn tất!',
      result: {
        extractedContent: {
          summary: 'Marketing professional với 5 năm kinh nghiệm trong digital marketing và brand management. Có thành tích tăng engagement rate 150% và quản lý budget 2 tỷ đồng/năm.',
          experience: [
            {
              id: 'exp-1',
              title: 'Marketing Manager',
              company: 'ABC Company',
              startDate: '2022-01',
              endDate: '2024-12',
              bullets: [
                'Quản lý team 5 người trong bộ phận marketing',
                'Tăng engagement rate 150% qua các chiến dịch social media',
                'Phụ trách budget marketing 2 tỷ đồng/năm'
              ]
            },
            {
              id: 'exp-2', 
              title: 'Marketing Specialist',
              company: 'XYZ Corp',
              startDate: '2020-01',
              endDate: '2022-01',
              bullets: [
                'Phát triển content strategy cho brand',
                'Tăng website traffic 200% trong 18 tháng',
                'Quản lý Google Ads campaigns với ROAS 4.5x'
              ]
            }
          ],
          skills: [
            'Digital Marketing',
            'Google Ads',
            'Facebook Ads', 
            'SEO',
            'Google Analytics',
            'Content Strategy',
            'Team Management'
          ],
          education: [
            {
              id: 'edu-1',
              degree: 'Cử nhân Marketing',
              institution: 'Đại học Kinh tế TP.HCM',
              graduationYear: '2020',
              gpa: '3.7'
            }
          ],
          qualityScore: 85
        },
        suggestions: [
          {
            section: 'summary',
            type: 'improvement',
            recommendation: 'Thêm thông tin về chứng chỉ chuyên môn và thành tích đo lường được cụ thể hơn',
            priority: 'high'
          },
          {
            section: 'experience',
            type: 'enhancement', 
            recommendation: 'Sử dụng nhiều từ khóa action verbs và số liệu cụ thể hơn trong mô tả công việc',
            priority: 'medium'
          },
          {
            section: 'skills',
            type: 'missing',
            recommendation: 'Bổ sung kỹ năng về Data Analytics và Marketing Automation tools',
            priority: 'medium'
          }
        ]
      },
      jobAnalysis: {
        requirements: {
          essential: ['Digital Marketing experience', 'Team management', 'Campaign management'],
          preferred: ['Google Ads certification', 'Analytics experience'],
          technical: ['Google Ads', 'Facebook Ads', 'Google Analytics'],
          soft: ['Leadership', 'Communication', 'Strategic thinking']
        },
        industryCategory: 'Marketing & Advertising',
        seniorityLevel: 'mid',
        keywords: ['digital marketing', 'campaigns', 'analytics', 'team management']
      },
      matching: {
        overallScore: 82,
        sectionScores: {
          summary: 85,
          experience: 88,
          skills: 75,
          education: 80
        },
        improvements: [
          'Thêm kinh nghiệm với marketing automation tools',
          'Nổi bật thành tích ROI và conversion rates',
          'Bổ sung chứng chỉ Google Ads và Facebook Blueprint'
        ],
        keywords: {
          matched: ['digital marketing', 'google ads', 'team management', 'analytics'],
          missing: ['automation', 'conversion optimization', 'a/b testing'],
          suggested: ['marketing automation', 'conversion rate optimization', 'a/b testing']
        }
      },
      cvTitle: `CV Marketing Manager - ${analysisTimestamp.toLocaleDateString('vi-VN')}`,
      originalFile: {
        name: 'cv-nguyen-van-a.pdf',
        size: 245760,
        type: 'application/pdf'
      },
      jobDescription: 'Marketing Manager position with focus on digital campaigns and team leadership'
    }

    return res.status(200).json(completedResult)

  } catch (error: any) {
    console.error('Analysis status check error:', error)
    
    return res.status(500).json({
      success: false,
      analysisId: req.body?.analysisId || '',
      status: 'failed',
      progress: 0,
      error: 'Internal server error'
    })
  }
} 