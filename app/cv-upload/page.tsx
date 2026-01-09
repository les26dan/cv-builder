'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cvUpload } from '@/config/texts/vi/cvUpload'

export default function CVUploadPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState('')
  const [jdUrl, setJdUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [jdError, setJdError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    // Client-side validation
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadError(cvUpload.errors.unsupportedFormat)
      return
    }

    if (file.size > maxSize) {
      setUploadError(cvUpload.errors.fileTooLarge)
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
    if (!uploadedFile && !jdText && !jdUrl) return

    // Store upload data for CV guided editing
    const uploadData = {
      file: uploadedFile ? {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type
      } : null,
      jobDescription: jdText.trim() || null,
      jobDescriptionUrl: jdUrl.trim() || null,
      timestamp: Date.now()
    }

    // Store in localStorage for CV guided editing to use
    if (typeof window !== 'undefined') {
      localStorage.setItem('cv_upload_data', JSON.stringify(uploadData))
    }

    // Navigate to CV guided editing with analysis
    const newCVId = Math.random().toString(36).substr(2, 9)
    router.push(`/cv-guided-editing/${newCVId}?source=upload`)
  }

  const handleCreateNew = () => {
    // Clear any previous upload data since user wants to create from scratch
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cv_upload_data')
    }
    
    router.push('/cv-guided-editing/new?source=new')
  }

  const handleExitClick = () => {
    router.push('/cv-workspace')
  }

  return (
    <div className="min-h-screen font-inter" style={{ background: '#E0F7FA' }}>
      {/* Professional Header matching legacy design */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-primary hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
              title="OkBuddy - Trang chủ"
              aria-label="OkBuddy - Trang chủ"
            >
              OkBuddy
            </button>

            {/* Exit Button */}
            <button
              onClick={handleExitClick}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              title="Thoát"
              aria-label="Thoát"
            >
              <span className="text-sm font-medium">Thoát</span>
            </button>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '25%' }}></div>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between items-center">
              {/* Step 1 - Active */}
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">1</span>
                </div>
                <span className="text-xs font-medium text-primary ml-1">Tải CV & Mô tả công việc</span>
              </div>

              {/* Step 2 - Inactive */}
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">2</span>
                </div>
                <span className="text-xs font-medium text-gray-500 ml-1">Phân tích & đánh giá CV</span>
              </div>

              {/* Step 3 - Inactive */}
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">3</span>
                </div>
                <span className="text-xs font-medium text-gray-500 ml-1">Cải thiện CV</span>
              </div>

              {/* Step 4 - Inactive */}
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">4</span>
                </div>
                <span className="text-xs font-medium text-gray-500 ml-1">Hoàn thiện</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Centered content matching legacy design */}
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] space-y-6">
            {/* Value Proposition */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {cvUpload.header.title}
              </h1>
              <p className="text-lg text-gray-600">
                {cvUpload.header.subtitle}
              </p>
            </div>

            {/* Primary Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`bg-white border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                uploadedFile
                  ? 'border-green-500 bg-green-50'
                  : isUploading
                  ? 'border-primary bg-primary-50'
                  : 'border-primary hover:border-primary-600'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <span className="text-gray-600 font-medium">{cvUpload.loading.analyzing}</span>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center space-y-4 text-green-600">
                  <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{cvUpload.upload.uploadSuccess}</p>
                    <p className="text-sm text-gray-500 mt-1">{uploadedFile.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  {/* Upload Cloud Icon */}
                  <div className="w-12 h-12 text-primary">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  {/* Upload Text */}
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">Kéo thả CV hoặc nhấn để chọn</p>
                    <p className="text-sm text-gray-600">Hỗ trợ PDF, DOCX • Tối đa 10MB</p>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary text-white px-6 py-4 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                  >
                    Upload CV của bạn
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
              <p className="text-red-600 text-sm text-center">{uploadError}</p>
            )}

            {/* Trust Section */}
            <div className="flex items-center justify-center gap-2 bg-white/50 rounded-lg p-4">
              <div className="w-4 h-4 text-green-500">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xs text-gray-600">
                Dữ liệu được bảo mật và chỉ dùng để phân tích & tối ưu CV của bạn
              </span>
            </div>

            {/* Alternative Options - Hidden by default as per design */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Hoặc bạn có thể bắt đầu tạo CV mới
              </h3>
              
              {/* Create New CV Option */}
              <button
                onClick={handleCreateNew}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{cvUpload.actions.createNewCV}</span>
              </button>
            </div>

            {/* Optional Job Description Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-primary">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Bạn đang apply cho một vị trí cụ thể?</h3>
              </div>
              
              <p className="text-xs text-gray-600">
                Thêm mô tả công việc để CV được tối ưu hóa chính xác cho vị trí bạn mong muốn
              </p>
              
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-md px-3 py-3 focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 resize-none"
                placeholder="Copy paste mô tả công việc tại đây..."
              />
              
              {jdError && (
                <p className="text-red-600 text-sm">{jdError}</p>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={!uploadedFile && !jdText && !jdUrl}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
                (!uploadedFile && !jdText && !jdUrl)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-600'
              }`}
              title={(!uploadedFile && !jdText && !jdUrl) ? cvUpload.actions.analyzeDisabled : undefined}
            >
              <div className="w-5 h-5">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>{cvUpload.actions.startAnalysis}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 