/**
 * Simulate Workflow Data Utility
 * Helps test cross-app integration by injecting sample CV data
 */

import { CrossAppDataService } from '../shared/services/crossAppDataService'

export function simulateWorkspaceNavigation() {
  const crossAppService = CrossAppDataService.getInstance()
  
  // Simulate existing CV data from workspace
  const cvId = `cv_${Date.now()}_workspace`
  const userId = 'mock-user-1'
  
  const mockCVData = crossAppService.createMockCVData(cvId, userId)
  
  // Store the data
  crossAppService.storeCVData(cvId, userId, mockCVData, 'workspace')
  
  // Navigate to editor with the CV data
  const editorUrl = crossAppService.generateNavigationURL('editor', cvId, userId)
  
  console.log('🔄 Simulating workspace navigation to:', editorUrl)
  window.location.href = editorUrl
}

export function simulateUploadCompletion() {
  const crossAppService = CrossAppDataService.getInstance()
  
  // Simulate CV upload and analysis completion
  const cvId = `cv_${Date.now()}_upload`
  const userId = 'mock-user-1'
  
  const mockCVData = crossAppService.createMockCVData(cvId, userId)
  
  // Update data to reflect upload completion
  mockCVData.status = 'completed'
  mockCVData.workflow.currentStep = 'editing'
  mockCVData.workflow.stepsCompleted = ['upload', 'analysis']
  mockCVData.uploadedFile = {
    name: 'sample-cv.pdf',
    size: 245760,
    type: 'application/pdf',
    url: 'mock-url',
    originalText: 'Sample CV content...'
  }
  mockCVData.analysisResults = {
    suggestions: [
      {
        section: 'summary',
        recommendation: 'Add more industry-specific keywords',
        priority: 'high',
        implemented: false
      },
      {
        section: 'experience',
        recommendation: 'Quantify your achievements with numbers',
        priority: 'medium',
        implemented: false
      }
    ],
    score: 78,
    keywords: ['React', 'TypeScript', 'Node.js'],
    improvements: [
      {
        section: 'skills',
        recommendation: 'Add more technical skills',
        priority: 'medium'
      }
    ]
  }
  
  // Store the data
  crossAppService.storeCVData(cvId, userId, mockCVData, 'upload')
  
  // Navigate to editor with the CV data
  const editorUrl = crossAppService.generateNavigationURL('editor', cvId, userId)
  
  console.log('🔄 Simulating upload completion navigation to:', editorUrl)
  window.location.href = editorUrl
}

export function injectTestData() {
  // Check if we're in development mode
  if (window.location.hostname !== 'localhost') {
    return
  }
  
  const crossAppService = CrossAppDataService.getInstance()
  
  // Create multiple test CVs
  const testCVs = [
    {
      id: 'cv_marketing_manager',
      title: 'CV Marketing Manager',
      source: 'workspace' as const,
      data: {
        ...crossAppService.createMockCVData('cv_marketing_manager', 'mock-user-1'),
        title: 'CV Marketing Manager',
        contact: {
          fullName: 'Trần Thị B',
          email: 'tran.thi.b@email.com',
          phone: '+84 987 654 321',
          location: 'Hà Nội, Việt Nam',
          linkedin: 'linkedin.com/in/tran-thi-b'
        },
        summary: {
          content: 'Marketing professional with 5+ years experience in digital marketing, brand management, and campaign optimization.'
        }
      }
    },
    {
      id: 'cv_software_engineer',
      title: 'CV Software Engineer',
      source: 'upload' as const,
      data: {
        ...crossAppService.createMockCVData('cv_software_engineer', 'mock-user-1'),
        title: 'CV Software Engineer',
        status: 'completed' as const,
        workflow: {
          currentStep: 'editing' as const,
          stepsCompleted: ['upload', 'analysis'],
          lastActiveStep: 'editing',
          timeSpent: 0
        }
      }
    }
  ]
  
  // Store test data
  testCVs.forEach(cv => {
    crossAppService.storeCVData(cv.id, 'mock-user-1', cv.data, cv.source)
    console.log(`📝 Injected test CV: ${cv.title} (${cv.id})`)
  })
  
  console.log('✅ Test CV data injected. You can now test navigation with these URLs:')
  testCVs.forEach(cv => {
    const url = crossAppService.generateNavigationURL('editor', cv.id, 'mock-user-1')
    console.log(`   ${cv.title}: ${url}`)
  })
}

// Development utilities disabled - using real data only
console.log('✅ Development mode: Using real data flow only') 