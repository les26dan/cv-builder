'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SharedHeader from '@/components/SharedHeader'
import { getTexts } from '@/config/texts/index'
import { detectLanguage, type SupportedLanguage } from '@/config/languageConfig'

export default function CVUploadPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  // Dynamic text loading based on user language preference
  const [texts, setTexts] = useState<any>(null)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en')

  useEffect(() => {
    const loadTexts = async () => {
      try {
        // Get user's language preference from localStorage or detect default
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage
        const detectedLanguage = savedLanguage || detectLanguage().language
        
        setCurrentLanguage(detectedLanguage)
        
        // Load appropriate text configuration
        const cvUploadTexts = await getTexts('cvUpload', detectedLanguage)
        setTexts(cvUploadTexts)
      } catch (error) {
        console.error('Failed to load texts:', error)
        // Fallback to English texts
        const { cvUpload } = await import('@/config/texts/en/cvUpload')
        setTexts(cvUpload)
        setCurrentLanguage('en')
      }
    }

    loadTexts()
  }, [])

  const handleFileSelect = (file: File) => {
    if (!texts) return // Wait for texts to load
    
    // Client-side validation
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadError(texts.errors.unsupportedFormat)
      return
    }

    if (file.size > maxSize) {
      setUploadError(texts.errors.fileTooLarge)
      return
    }

    setUploadError('')
    setIsUploading(true)
    
    // Simulate upload process
    setTimeout(() => {
      setUploadedFile(file)
      setIsUploading(false)
    }, 1500)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleStartAnalysis = async () => {
    if (!uploadedFile) return

    setIsUploading(true)
    setUploadError('')

    try {
      // Upload CV file to extract text and structured data
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/upload/cv-blob', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('📤 Upload API Response:', response.status, result)

      if (!result.success) {
        console.error('❌ Upload failed:', result)
        setUploadError(result.error || 'Upload failed')
        setIsUploading(false)
        return
      }

      console.log('✅ CV uploaded and processed:', result)

      // Use current language from state
      const userLanguage = currentLanguage
      
      // Handle LLM parsing results based on possibility score
      if (result.llmParsedData) {
        console.log('🤖 LLM Parsing Result:', result.llmParsedData)
        
        if (result.llmParsedData.possibility_score >= 5) {
          // ✅ SUCCESS: Valid CV detected - navigate to CV Guided Editing
          console.log(`✅ Valid CV detected (score: ${result.llmParsedData.possibility_score}) - proceeding to guided editing`)
          
          // Store the processed CV data including LLM-parsed structured data
          const uploadData = {
            cvId: result.cvId,
            file: {
              name: uploadedFile.name,
              size: uploadedFile.size,
              type: uploadedFile.type
            },
            extractedData: result.extractedData || null,
            llmParsedData: result.llmParsedData,
            structuredCV: result.structuredCV || null,
            blobUrl: result.blobUrl || null,
            timestamp: Date.now(),
            processed: true,
            validCV: true
          }
          
          // Store in localStorage for CV guided editing to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('cv_upload_data', JSON.stringify(uploadData))
            localStorage.setItem(`cv_upload_${result.cvId}`, JSON.stringify(uploadData))
          }

          // Show success message briefly before navigation
          setShowSuccessMessage(true)
          
          setTimeout(() => {
            // Navigate to CV guided editing with success parameter
            router.push(`/cv-guided-editing/${result.cvId}?source=upload&parsed=success`)
          }, 1500)
          
        } else {
          // ❌ INVALID CV: Stay on upload page with error message
          console.log(`❌ Invalid CV detected (score: ${result.llmParsedData.possibility_score})`)
          
          const errorMessage = result.llmParsedData.error || 
            (userLanguage === 'en' 
              ? "The document uploaded doesn't seem to be a resume. Please upload a valid resume document."
              : "Tài liệu vừa tải lên không giống CV hoặc hồ sơ ứng tuyển. Vui lòng tải lên đúng file CV hợp lệ.")
          
          setUploadError(errorMessage)
          setIsUploading(false)
          setUploadedFile(null) // Clear uploaded file for retry
          return
        }
      } else {
        // Fallback: No LLM data available - use basic extraction and proceed
        console.log('⚠️ No LLM parsing data available - using fallback navigation')
        
        const uploadData = {
          cvId: result.cvId,
          file: {
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type
          },
          extractedData: result.extractedData || null,
          structuredCV: result.structuredCV || null,
          blobUrl: result.blobUrl || null,
          timestamp: Date.now(),
          processed: false,
          validCV: null // Unknown validity
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('cv_upload_data', JSON.stringify(uploadData))
          localStorage.setItem(`cv_upload_${result.cvId}`, JSON.stringify(uploadData))
        }

        // Navigate with fallback parameter
        router.push(`/cv-guided-editing/${result.cvId}?source=upload&parsed=fallback`)
      }

    } catch (error) {
      console.error('📤 Upload error:', error)
      
      // Network error handling with bilingual messages
      const networkErrorMessage = currentLanguage === 'en'
        ? "An error occurred. Please upload your resume again."
        : "Đã xảy ra lỗi. Vui lòng tải lại CV của bạn."
      
      setUploadError(networkErrorMessage)
      setIsUploading(false)
      setUploadedFile(null) // Clear file for retry
    }
  }

  // Show loading state if texts haven't loaded yet
  if (!texts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Use SharedHeader for consistency */}
      <SharedHeader 
        variant="app" 
        showBackButton={true}
        onBackClick={() => window.location.href = '/cv-workspace'}
        backButtonTitle="Quay lại CV Workspace"
      />
      
      <main className="flex-1 flex justify-center items-center px-4 sm:px-6 lg:px-10 py-8">
        <div className="w-full max-w-[600px] space-y-8">
          
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  {currentLanguage === 'en' ? 'Resume successfully parsed! Redirecting to editor...' : 'CV đã được phân tích thành công! Đang chuyển hướng đến trình chỉnh sửa...'}
                </span>
              </div>
            </div>
          )}
          {/* Value Proposition */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {texts.header.title}
            </h1>
            <p className="text-lg text-gray-600">
              {texts.header.subtitle}
            </p>
          </div>

          {/* Primary Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`bg-white border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 shadow-sm ${
              uploadedFile
                ? 'border-green-500 bg-green-50'
                : isUploading
                ? 'border-primary bg-primary-50'
                : 'border-primary hover:border-primary-600'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <span className="text-gray-600 font-medium text-lg">{texts.loading.analyzing}</span>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center space-y-6 text-green-600">
                <div className="w-20 h-20 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xl text-gray-900">{texts.upload.uploadSuccess}</p>
                  <p className="text-base text-gray-500 mt-2">{uploadedFile.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                {/* Upload Cloud Icon */}
                <div className="w-16 h-16 text-primary">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                {/* Upload Text */}
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-900">{texts.upload.title}</p>
                  <p className="text-base text-gray-600">{texts.upload.supportedFormats}</p>
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
                >
                  {texts.upload.uploadButton}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-center font-medium">{uploadError}</p>
            </div>
          )}

          {/* Trust Section */}
          <div className="flex items-center justify-center gap-3 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="w-5 h-5 text-green-500 flex-shrink-0">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 text-center">
              {texts.upload.privacyNote}
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={!uploadedFile}
            className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
              !uploadedFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
            }`}
            title={!uploadedFile ? texts.actions.analyzeDisabled : undefined}
          >
            <div className="w-6 h-6">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span>{texts.actions.startAnalysis}</span>
          </button>
        </div>
      </main>
    </div>
  )
} 