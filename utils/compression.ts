/**
 * Data Compression Utilities
 * Provides efficient compression for large text content before database storage
 */

import pako from 'pako'

/**
 * Compression threshold - only compress text larger than 1KB
 */
const COMPRESSION_THRESHOLD = 1024

/**
 * Compress large text content using gzip
 * Only compresses if text is larger than threshold and compression provides benefit
 */
export function compressText(text: string): { data: string; compressed: boolean } {
  if (!text || text.length < COMPRESSION_THRESHOLD) {
    return { data: text, compressed: false }
  }

  try {
    // Convert string to bytes
    const textBytes = new TextEncoder().encode(text)
    
    // Compress using gzip
    const compressed = pako.gzip(textBytes)
    
    // Convert to base64 for safe storage
    const base64Compressed = btoa(String.fromCharCode.apply(null, Array.from(compressed)))
    
    // Only use compression if it actually reduces size by at least 10%
    if (base64Compressed.length < text.length * 0.9) {
      return { data: base64Compressed, compressed: true }
    } else {
      return { data: text, compressed: false }
    }
  } catch (error) {
    console.warn('Compression failed, using original text:', error)
    return { data: text, compressed: false }
  }
}

/**
 * Decompress text content
 */
export function decompressText(data: string, compressed: boolean): string {
  if (!compressed) {
    return data
  }

  try {
    // Convert from base64
    const compressedBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0))
    
    // Decompress using gzip
    const decompressed = pako.ungzip(compressedBytes)
    
    // Convert back to string
    const text = new TextDecoder().decode(decompressed)
    
    return text
  } catch (error) {
    console.error('Decompression failed:', error)
    // Return original data as fallback
    return data
  }
}

/**
 * Compress CV data for storage
 * Compresses large text fields while keeping structured data intact
 */
export function compressCVData(cvData: any): { data: any; compressionMap: Record<string, boolean> } {
  const compressionMap: Record<string, boolean> = {}
  const processedData = { ...cvData }

  // Compress large text fields
  if (typeof processedData.uploadedFile?.originalText === 'string') {
    const result = compressText(processedData.uploadedFile.originalText)
    processedData.uploadedFile.originalText = result.data
    compressionMap['uploadedFile.originalText'] = result.compressed
  }

  if (typeof processedData.jobDescription?.text === 'string') {
    const result = compressText(processedData.jobDescription.text)
    processedData.jobDescription.text = result.data
    compressionMap['jobDescription.text'] = result.compressed
  }

  // Compress summary if it's very long
  if (typeof processedData.summary === 'string' && processedData.summary.length > 500) {
    const result = compressText(processedData.summary)
    processedData.summary = result.data
    compressionMap['summary'] = result.compressed
  }

  return { data: processedData, compressionMap }
}

/**
 * Decompress CV data after loading
 */
export function decompressCVData(cvData: any, compressionMap: Record<string, boolean> = {}): any {
  const processedData = { ...cvData }

  // Decompress text fields based on compression map
  if (compressionMap['uploadedFile.originalText'] && processedData.uploadedFile?.originalText) {
    processedData.uploadedFile.originalText = decompressText(
      processedData.uploadedFile.originalText,
      true
    )
  }

  if (compressionMap['jobDescription.text'] && processedData.jobDescription?.text) {
    processedData.jobDescription.text = decompressText(
      processedData.jobDescription.text,
      true
    )
  }

  if (compressionMap['summary'] && processedData.summary) {
    processedData.summary = decompressText(processedData.summary, true)
  }

  return processedData
}

/**
 * Estimate compression ratio for analytics
 */
export function estimateCompressionRatio(text: string): number {
  if (!text || text.length < COMPRESSION_THRESHOLD) {
    return 1 // No compression benefit
  }

  const { data, compressed } = compressText(text)
  
  if (compressed) {
    return text.length / data.length
  } else {
    return 1
  }
}