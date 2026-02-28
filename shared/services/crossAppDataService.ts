/**
 * Cross-App Data Service
 * Handles data sharing between CV Workspace, Upload, and Guided Editing applications
 * Uses localStorage and URL parameters for seamless data transfer
 */

import { WorkflowCVData, CVData } from '../types/workflow'

export interface CrossAppDataTransfer {
  cvId: string
  userId: string
  data: WorkflowCVData
  timestamp: number
  source: 'workspace' | 'upload' | 'editor'
  ttl: number // Time to live in milliseconds
}

export class CrossAppDataService {
  private static instance: CrossAppDataService
  private readonly DATA_PREFIX = 'okbuddy_cv_transfer_'
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute

  private constructor() {
    // Start cleanup timer
    this.startCleanupTimer()
  }

  public static getInstance(): CrossAppDataService {
    if (!CrossAppDataService.instance) {
      CrossAppDataService.instance = new CrossAppDataService()
    }
    return CrossAppDataService.instance
  }

  /**
   * Store CV data for cross-app transfer
   */
  public storeCVData(cvId: string, userId: string, data: WorkflowCVData, source: 'workspace' | 'upload' | 'editor'): void {
    try {
      const transferData: CrossAppDataTransfer = {
        cvId,
        userId,
        data,
        timestamp: Date.now(),
        source,
        ttl: this.DEFAULT_TTL
      }

      const key = `${this.DATA_PREFIX}${cvId}`
      localStorage.setItem(key, JSON.stringify(transferData))
      
      console.log(`✅ CV data stored for cross-app transfer: ${cvId} from ${source}`)
    } catch (error) {
      console.error('❌ Failed to store CV data for transfer:', error)
    }
  }

  /**
   * Retrieve CV data from cross-app transfer
   */
  public getCVData(cvId: string): WorkflowCVData | null {
    try {
      const key = `${this.DATA_PREFIX}${cvId}`
      const stored = localStorage.getItem(key)
      
      if (!stored) {
        console.log(`⚠️ No transfer data found for CV: ${cvId}`)
        return null
      }

      const transferData: CrossAppDataTransfer = JSON.parse(stored)
      
      // Check if data has expired
      if (Date.now() - transferData.timestamp > transferData.ttl) {
        console.log(`⚠️ Transfer data expired for CV: ${cvId}`)
        localStorage.removeItem(key)
        return null
      }

      console.log(`✅ CV data retrieved from transfer: ${cvId} (source: ${transferData.source})`)
      return transferData.data
    } catch (error) {
      console.error('❌ Failed to retrieve CV data from transfer:', error)
      return null
    }
  }

  /**
   * Generate navigation URL with CV data
   */
  public generateNavigationURL(targetApp: 'workspace' | 'upload' | 'editor', cvId: string, userId: string, additionalParams?: Record<string, string>): string {
    const baseUrls = {
      workspace: 'http://localhost:3002/workspace',
      upload: 'http://localhost:4000',
      editor: 'http://localhost:5173'
    }

    const url = new URL(baseUrls[targetApp])
    url.searchParams.set('cvId', cvId)
    url.searchParams.set('userId', userId)
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    return url.toString()
  }

  /**
   * Navigate to another app with CV data
   */
  public navigateWithCVData(targetApp: 'workspace' | 'upload' | 'editor', cvData: WorkflowCVData, additionalParams?: Record<string, string>): void {
    try {
      // Store data for transfer
      this.storeCVData(cvData.id, cvData.userId, cvData, 'editor')
      
      // Generate navigation URL
      const url = this.generateNavigationURL(targetApp, cvData.id, cvData.userId, additionalParams)
      
      console.log(`🔄 Navigating to ${targetApp}: ${url}`)
      
      // Navigate to the target application
      window.location.href = url
    } catch (error) {
      console.error('❌ Failed to navigate with CV data:', error)
    }
  }

  /**
   * Get CV ID and User ID from current URL
   */
  public getURLParams(): { cvId: string | null, userId: string | null } {
    const urlParams = new URLSearchParams(window.location.search)
    return {
      cvId: urlParams.get('cvId'),
      userId: urlParams.get('userId')
    }
  }

  /**
   * Convert WorkflowCVData to CVData for the editor
   */
  public convertWorkflowToCVData(workflowData: WorkflowCVData): any {
    return {
      sectionOrder: workflowData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'],
      sectionTitles: workflowData.sectionTitles || {},
      contact: {
        fullName: workflowData.contact?.fullName || '',
        email: workflowData.contact?.email || '',
        phone: workflowData.contact?.phone || '',
        location: workflowData.contact?.location || '',
        linkedin: workflowData.contact?.linkedin || ''
      },
      summary: {
        content: workflowData.summary?.content || ''
      },
      experience: {
        items: workflowData.experience?.items || []
      },
      skills: {
        items: workflowData.skills?.items || []
      },
      education: {
        items: workflowData.education?.items?.map(item => ({
          ...item,
          description: item.description || ''
        })) || []
      }
    }
  }

  /**
   * Convert CVData back to WorkflowCVData
   */
  public convertCVDataToWorkflow(cvData: CVData, existingWorkflowData: WorkflowCVData): WorkflowCVData {
    return {
      ...existingWorkflowData,
      contact: cvData.contact,
      summary: cvData.summary,
      experience: cvData.experience,
      skills: cvData.skills,
      education: cvData.education,
      aiUsage: cvData.aiUsage,
      sectionOrder: cvData.sectionOrder,
      sectionTitles: cvData.sectionTitles,
      metadata: {
        ...existingWorkflowData.metadata,
        updatedAt: new Date().toISOString(),
        version: existingWorkflowData.metadata.version + 1
      }
    }
  }

  /**
   * Create mock CV data for development/testing
   */
  public createMockCVData(cvId: string, userId: string): WorkflowCVData {
    const now = new Date().toISOString()
    
    return {
      id: cvId,
      userId,
      title: 'Sample CV',
      status: 'draft',
      score: 75,
      contact: {
        fullName: 'Nguyễn Văn A',
        email: 'nguyen.van.a@email.com',
        phone: '+84 123 456 789',
        location: 'Hồ Chí Minh, Việt Nam',
        linkedin: 'linkedin.com/in/nguyen-van-a'
      },
      summary: {
        content: 'Experienced software developer with 5+ years in web development, specializing in React and Node.js.'
      },
      experience: {
        items: [
          {
            id: 'exp1',
            title: 'Senior Software Developer',
            company: 'Tech Company Ltd',
            location: 'Hồ Chí Minh',
            startDate: '2022-01',
            endDate: '2024-12',
            current: true,
            bullets: [
              'Developed modern web applications using React and TypeScript',
              'Led a team of 3 junior developers',
              'Improved application performance by 40%'
            ]
          }
        ]
      },
      skills: {
        items: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AWS']
      },
      education: {
        items: [
          {
            id: 'edu1',
            degree: 'Bachelor of Computer Science',
            institution: 'University of Technology',
            location: 'Hồ Chí Minh',
            graduationDate: '2019-06',
            description: 'Graduated with honors'
          }
        ]
      },
      workflow: {
        currentStep: 'editing',
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 0
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: 1,
        source: 'upload'
      },
      settings: {
        autoSave: true,
        aiAssistance: true,
        template: 'dennis-schroder',
        language: 'vi'
      }
    }
  }

  /**
   * Clean up expired transfer data
   */
  private cleanupExpiredData(): void {
    try {
      const now = Date.now()
      const keysToRemove: string[] = []

      // Check all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.DATA_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const transferData: CrossAppDataTransfer = JSON.parse(stored)
              if (now - transferData.timestamp > transferData.ttl) {
                keysToRemove.push(key)
              }
            }
          } catch (error) {
            // If parsing fails, remove the corrupted data
            keysToRemove.push(key)
          }
        }
      }

      // Remove expired data
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🧹 Cleaned up expired transfer data: ${key}`)
      })
    } catch (error) {
      console.error('❌ Failed to cleanup expired data:', error)
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredData()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Manual cleanup trigger
   */
  public cleanup(): void {
    this.cleanupExpiredData()
  }
} 