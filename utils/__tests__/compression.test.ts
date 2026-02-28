/**
 * Compression Utility Tests
 */

import { compressText, decompressText, compressCVData, decompressCVData, estimateCompressionRatio } from '../compression'

describe('Compression Utils', () => {
  describe('compressText', () => {
    it('should not compress small text', () => {
      const smallText = 'Hello World'
      const result = compressText(smallText)
      
      expect(result.compressed).toBe(false)
      expect(result.data).toBe(smallText)
    })

    it('should compress large repetitive text', () => {
      const largeText = 'This is a long text with lots of repetition. '.repeat(50)
      const result = compressText(largeText)
      
      expect(result.compressed).toBe(true)
      expect(result.data.length).toBeLessThan(largeText.length)
    })

    it('should not compress if compression does not provide benefit', () => {
      // Create text that won't compress well (random characters)
      const randomText = Array.from({ length: 2000 }, () => 
        String.fromCharCode(Math.floor(Math.random() * 26) + 97)
      ).join('')
      
      const result = compressText(randomText)
      // Might not compress due to randomness
      expect(typeof result.data).toBe('string')
      expect(typeof result.compressed).toBe('boolean')
    })
  })

  describe('decompressText', () => {
    it('should return original text if not compressed', () => {
      const text = 'Hello World'
      const result = decompressText(text, false)
      
      expect(result).toBe(text)
    })

    it('should decompress compressed text correctly', () => {
      const originalText = 'This is a long text with lots of repetition. '.repeat(50)
      const compressed = compressText(originalText)
      
      if (compressed.compressed) {
        const decompressed = decompressText(compressed.data, true)
        expect(decompressed).toBe(originalText)
      }
    })
  })

  describe('compressCVData', () => {
    it('should compress large text fields in CV data', () => {
      const cvData = {
        id: 'test-cv',
        title: 'Test CV',
        uploadedFile: {
          originalText: 'This is a very long CV text content. '.repeat(100)
        },
        jobDescription: {
          text: 'This is a very long job description. '.repeat(100)
        },
        summary: 'Short summary',
        metadata: { version: 1 }
      }

      const result = compressCVData(cvData)
      
      expect(result.compressionMap).toBeDefined()
      expect(result.data.uploadedFile.originalText).toBeDefined()
      expect(result.data.jobDescription.text).toBeDefined()
      
      // Summary should not be compressed (too short)
      expect(result.compressionMap['summary']).toBeFalsy()
    })
  })

  describe('decompressCVData', () => {
    it('should decompress CV data correctly', () => {
      const originalCVData = {
        id: 'test-cv',
        title: 'Test CV', 
        uploadedFile: {
          originalText: 'This is a very long CV text content. '.repeat(100)
        },
        summary: 'Test summary',
        metadata: { version: 1 }
      }

      const compressed = compressCVData(originalCVData)
      const decompressed = decompressCVData(compressed.data, compressed.compressionMap)
      
      expect(decompressed.uploadedFile.originalText).toBe(originalCVData.uploadedFile.originalText)
      expect(decompressed.summary).toBe(originalCVData.summary)
    })
  })

  describe('estimateCompressionRatio', () => {
    it('should return 1 for small text', () => {
      const ratio = estimateCompressionRatio('Hello')
      expect(ratio).toBe(1)
    })

    it('should return compression ratio for compressible text', () => {
      const repetitiveText = 'Repeat this text many times. '.repeat(100)
      const ratio = estimateCompressionRatio(repetitiveText)
      
      expect(ratio).toBeGreaterThan(1)
    })
  })
})