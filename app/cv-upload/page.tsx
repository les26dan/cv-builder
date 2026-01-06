'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import HeaderMinimal from '@/components/HeaderMinimal'
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
    if (!uploadedFile) return

    // Navigate to CV guided editing with analysis
    const newCVId = Math.random().toString(36).substr(2, 9)
    router.push(`/cv-guided-editing/${newCVId}`)
  }

  const handleCreateNew = () => {
    router.push('/cv-guided-editing/new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <HeaderMinimal showAutosave={false} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {cvUpload.header.title}
          </h1>
          <p className="text-gray-600">
            {cvUpload.header.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {cvUpload.upload.title}
            </h2>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploadedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">{cvUpload.loading.analyzing}</span>
                </div>
              ) : uploadedFile ? (
                <div className="text-green-600">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{cvUpload.upload.uploadSuccess}</p>
                  <p className="text-sm text-gray-500 mt-1">{uploadedFile.name}</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium mb-2">{cvUpload.upload.title}</p>
                  <p className="text-sm text-gray-400 mb-4">{cvUpload.upload.privacyNote}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {cvUpload.upload.uploadButton}
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
              <p className="text-red-600 text-sm mt-2">{uploadError}</p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              {cvUpload.upload.supportedFormats}
            </p>
          </div>

          {/* Job Description Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {cvUpload.jobDescription.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {cvUpload.jobDescription.description}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dán văn bản mô tả công việc
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={cvUpload.jobDescription.textPlaceholder}
                />
              </div>
              
              <div className="text-center text-gray-500">
                hoặc
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập đường dẫn JD
                </label>
                <input
                  type="url"
                  value={jdUrl}
                  onChange={(e) => setJdUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={cvUpload.jobDescription.urlPlaceholder}
                />
              </div>
              
              {jdError && (
                <p className="text-red-600 text-sm">{jdError}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartAnalysis}
              disabled={!uploadedFile && !jdText && !jdUrl}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {cvUpload.actions.startAnalysis}
            </button>
            
            <button
              onClick={handleCreateNew}
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cvUpload.actions.createNewCV}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
} 