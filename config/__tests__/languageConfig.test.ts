/**
 * Language Configuration System Tests
 * Comprehensive testing for language detection and configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  LanguageConfigManager, 
  SupportedLanguage,
  LanguageSource
} from '../languageConfig'

describe('LanguageConfigManager', () => {
  let config: LanguageConfigManager
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value
        },
        removeItem: (key: string) => {
          delete localStorageMock[key]
        },
        clear: () => {
          Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
        }
      },
      writable: true
    })

    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: {
        languages: ['en-US', 'en'],
        language: 'en-US'
      },
      writable: true
    })

    config = LanguageConfigManager.getInstance()
    config.clearUserPreference() // Reset for each test
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LanguageConfigManager.getInstance()
      const instance2 = LanguageConfigManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Language Detection', () => {
    it('should detect Vietnamese from text content', () => {
      const result = config.detectLanguageFromContent({
        text: 'Tôi là một kỹ sư phần mềm với 5 năm kinh nghiệm'
      })
      
      expect(result.language).toBe('vi')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect English from text content', () => {
      const result = config.detectLanguageFromContent({
        text: 'I am a software engineer with 5 years of experience'
      })
      
      expect(result.language).toBe('en')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect Vietnamese from business terms', () => {
      const result = config.detectLanguageFromContent({
        company: 'Công ty TNHH ABC',
        jobTitle: 'Nhân viên kinh doanh'
      })
      
      expect(result.language).toBe('vi')
    })

    it('should handle mixed content with priority', () => {
      const result = config.detectLanguageFromContent({
        text: 'Software Engineer tại Công ty ABC'
      })
      
      // Should be either Vietnamese or English
      expect(['vi', 'en']).toContain(result.language)
    })

    it('should prioritize user preference when set', () => {
      config.setUserPreference('vi', 'manual')
      
      const preference = config.getUserPreference()
      expect(preference?.language).toBe('vi')
      expect(preference?.source).toBe('manual')
    })

    it('should fall back to default when no content', () => {
      const result = config.detectLanguageFromContent({})
      
      expect(result.language).toBe('vi') // Default language
    })

    it('should use default when browser language not supported', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          languages: ['fr-FR', 'de-DE'],
          language: 'fr-FR'
        },
        writable: true
      })
      
      const result = config.detectLanguageFromContent({})
      expect(result.language).toBe('vi') // Default language
    })
  })

  describe('Real-world Wizard Scenarios', () => {
    it('should detect Vietnamese from wizard input', () => {
      const result = config.detectLanguageFromContent({
        project: 'Phát triển ứng dụng web',
        impact: 'Tăng hiệu suất hệ thống 25%',
        responsibility: 'Lập trình và bảo trì code'
      })
      
      expect(result.language).toBe('vi')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect English from wizard input', () => {
      const result = config.detectLanguageFromContent({
        project: 'Develop web applications',
        impact: 'Improved system performance by 25%',
        responsibility: 'Programming and code maintenance'
      })
      
      expect(result.language).toBe('en')
      expect(result.confidence).toBeGreaterThan(0.9)
    })
  })

  describe('User Preference Management', () => {
    it('should set and get user preference', () => {
      config.setUserPreference('vi', 'manual')
      const preference = config.getUserPreference()
      
      expect(preference?.language).toBe('vi')
      expect(preference?.source).toBe('manual')
      expect(localStorageMock['okbuddy-language-preference']).toBeDefined()
    })

    it('should clear user preference', () => {
      config.setUserPreference('en', 'manual')
      config.clearUserPreference()
      
      expect(config.getUserPreference()).toBeNull()
      expect(localStorageMock['okbuddy-language-preference']).toBeUndefined()
    })

    it('should persist preference across instances', () => {
      config.setUserPreference('vi', 'manual')
      
      // Create new instance (simulate page reload)
      const newConfig = LanguageConfigManager.getInstance()
      expect(newConfig.getUserPreference()?.language).toBe('vi')
    })
  })

  describe('Pattern Recognition', () => {
    it('should recognize Vietnamese patterns correctly', () => {
      const patterns = [
        'Công ty TNHH',
        'Nhân viên',
        'Phát triển',
        'Kinh nghiệm',
        'Dự án',
        'Quản lý',
        'Kỹ thuật'
      ]
      
      patterns.forEach(pattern => {
        const result = config.detectLanguageFromContent({ text: pattern })
        expect(result.language).toBe('vi')
      })
    })

    it('should recognize English patterns correctly', () => {
      const patterns = [
        'Software Engineer',
        'Project Manager',
        'Web Developer',
        'Data Analyst',
        'Senior Developer',
        'Technical Lead'
      ]
      
      patterns.forEach(pattern => {
        const result = config.detectLanguageFromContent({ text: pattern })
        expect(result.language).toBe('en')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = config.detectLanguageFromContent({})
      expect(['vi', 'en']).toContain(result.language)
    })

    it('should handle content with empty text', () => {
      const result = config.detectLanguageFromContent({
        text: '',
        company: '   '
      })
      
      expect(['vi', 'en']).toContain(result.language)
    })

    it('should handle special characters and numbers', () => {
      const result = config.detectLanguageFromContent({
        text: '123 !@# $%^ &*()'
      })
      
      expect(['vi', 'en']).toContain(result.language)
    })
  })
}) 