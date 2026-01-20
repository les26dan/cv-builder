import { put, del, head } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  contentType: string;
}

export interface BlobFileInfo {
  url: string;
  size: number;
  contentType: string;
  pathname: string;
}

/**
 * Vercel Blob Storage Service for CV files
 * Based on: https://vercel.com/blog/vercel-storage
 */
export class VercelBlobStorageService {
  private static readonly CV_FOLDER = 'cv-files';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Upload CV file to Vercel Blob storage
   * @param file - File to upload (PDF or DOCX)
   * @param userId - User ID for file organization
   * @param cvId - CV ID for file naming
   * @returns Upload result with URLs and metadata
   */
  static async uploadCV(
    file: File,
    userId: string,
    cvId: string
  ): Promise<BlobUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate file path: cv-files/userId/cvId/originalFileName
      const fileExtension = this.getFileExtension(file.name);
      const fileName = `cv-${cvId}-${Date.now()}${fileExtension}`;
      const filePath = `${this.CV_FOLDER}/${userId}/${fileName}`;

      console.log(`📤 Uploading CV to Vercel Blob: ${filePath}`);

      // Upload to Vercel Blob with public access for downloads
      const blob = await put(filePath, file, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false, // We already have unique naming
      });

      const result: BlobUploadResult = {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        size: file.size,
        contentType: file.type,
      };

      console.log(`✅ CV uploaded successfully: ${blob.url}`);
      return result;

    } catch (error) {
      console.error('❌ Error uploading CV to Vercel Blob:', error);
      throw new Error(`Failed to upload CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store generated CV (when user downloads)
   * @param cvBlob - Generated CV as Blob
   * @param userId - User ID
   * @param cvId - CV ID
   * @param format - File format (pdf, docx, or latex)
   * @returns Storage result
   */
  static async storeGeneratedCV(
    cvBlob: Blob,
    userId: string,
    cvId: string,
    format: 'pdf' | 'docx' | 'latex' = 'pdf'
  ): Promise<BlobUploadResult> {
    try {
      const fileExtension = format === 'latex' ? 'tex' : format;
      const fileName = `generated-cv-${cvId}-${Date.now()}.${fileExtension}`;
      const filePath = `${this.CV_FOLDER}/${userId}/generated/${fileName}`;
      const contentType = format === 'pdf' 
        ? 'application/pdf' 
        : format === 'latex' 
          ? 'text/x-tex' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      console.log(`💾 Storing generated CV: ${filePath}`);

      const blob = await put(filePath, cvBlob, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });

      const result: BlobUploadResult = {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        size: cvBlob.size,
        contentType,
      };

      console.log(`✅ Generated CV stored: ${blob.url}`);
      return result;

    } catch (error) {
      console.error('❌ Error storing generated CV:', error);
      throw new Error(`Failed to store generated CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file information from Vercel Blob
   * @param url - Blob URL
   * @returns File information
   */
  static async getFileInfo(url: string): Promise<BlobFileInfo | null> {
    try {
      const info = await head(url);
      
      return {
        url: info.url,
        size: info.size,
        contentType: info.contentType || 'application/octet-stream',
        pathname: info.pathname,
      };

    } catch (error) {
      console.error('❌ Error getting file info:', error);
      return null;
    }
  }

  /**
   * Delete CV file from Vercel Blob
   * @param url - Blob URL to delete
   */
  static async deleteCV(url: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting CV from Vercel Blob: ${url}`);
      await del(url);
      console.log(`✅ CV deleted successfully`);

    } catch (error) {
      console.error('❌ Error deleting CV:', error);
      throw new Error(`Failed to delete CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate download URL for CV
   * @param userId - User ID
   * @param cvId - CV ID
   * @param blobUrl - Original blob URL
   * @returns Public download URL
   */
  static getDownloadUrl(blobUrl: string): string {
    // Vercel Blob provides direct download URLs
    return blobUrl;
  }

  /**
   * Validate uploaded file
   * @private
   */
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF and DOCX files are allowed');
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const fileExtension = this.getFileExtension(file.name).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Only PDF and DOCX files are allowed');
    }
  }

  /**
   * Get file extension from filename
   * @private
   */
  private static getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }

  /**
   * Clean up old files for a user (optional utility)
   * @param userId - User ID
   * @param olderThanDays - Delete files older than X days
   */
  static async cleanupOldFiles(userId: string, olderThanDays: number = 30): Promise<void> {
    console.log(`🧹 Cleanup not implemented yet - would clean files older than ${olderThanDays} days for user ${userId}`);
    // Note: Vercel Blob doesn't have list functionality yet
    // This would need to be implemented when list() becomes available
  }
}

// Export default instance
export default VercelBlobStorageService; 