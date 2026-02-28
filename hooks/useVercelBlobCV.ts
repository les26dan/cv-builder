import { useState } from 'react';
import { BlobUploadResult } from '@/lib/vercelBlobStorage';

interface UploadResult {
  success: boolean;
  cvId?: string;
  blobInfo?: BlobUploadResult;
  extractedText?: string;
  error?: string;
}

interface DownloadResult {
  success: boolean;
  downloadUrl?: string;
  blobInfo?: BlobUploadResult;
  error?: string;
}

interface UseVercelBlobCVReturn {
  // Upload states
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  
  // Download states
  isDownloading: boolean;
  downloadError: string | null;
  
  // Actions
  uploadCV: (file: File) => Promise<UploadResult>;
  downloadCV: (cvId: string, format?: 'pdf' | 'docx') => Promise<DownloadResult>;
  resetUpload: () => void;
  resetDownload: () => void;
}

/**
 * React hook for CV operations using Vercel Blob storage
 * Based on: https://vercel.com/blog/vercel-storage
 */
export function useVercelBlobCV(): UseVercelBlobCVReturn {
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * Upload CV file to Vercel Blob storage
   */
  const uploadCV = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      console.log(`📤 Starting CV upload: ${file.name}`);

      // Validate file before upload
      if (!validateFile(file)) {
        throw new Error('Invalid file type or size. Only PDF and DOCX files under 10MB are allowed.');
      }

      setUploadProgress(25);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(50);

      // Upload to Vercel Blob via API
      const response = await fetch('/api/upload/cv-blob', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result: UploadResult = await response.json();
      setUploadProgress(100);

      console.log('✅ CV upload successful:', result);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ CV upload failed:', errorMessage);
      setUploadError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Download CV and store in Vercel Blob
   */
  const downloadCV = async (cvId: string, format: 'pdf' | 'docx' = 'pdf'): Promise<DownloadResult> => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      console.log(`📥 Starting CV download: ${cvId} as ${format}`);

      // Request CV download generation
      const response = await fetch('/api/download/cv-blob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvId, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Download failed with status ${response.status}`);
      }

      const result: DownloadResult = await response.json();

      console.log('✅ CV download prepared:', result);

      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }

      // Trigger browser download
      if (result.downloadUrl) {
        const fileName = `cv-${cvId}.${format}`;
        await triggerDownload(result.downloadUrl, fileName);
        console.log(`✅ Download triggered: ${fileName}`);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      console.error('❌ CV download failed:', errorMessage);
      setDownloadError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Reset upload states
   */
  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  };

  /**
   * Reset download states
   */
  const resetDownload = () => {
    setIsDownloading(false);
    setDownloadError(null);
  };

  return {
    // Upload states
    isUploading,
    uploadProgress,
    uploadError,
    
    // Download states
    isDownloading,
    downloadError,
    
    // Actions
    uploadCV,
    downloadCV,
    resetUpload,
    resetDownload,
  };
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): boolean {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return false;
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (!allowedTypes.includes(file.type)) {
    return false;
  }

  // Check file extension
  const allowedExtensions = ['.pdf', '.docx', '.doc'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  return hasValidExtension;
}

/**
 * Trigger browser download from URL
 */
async function triggerDownload(url: string, fileName: string): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Error triggering download:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

export default useVercelBlobCV; 