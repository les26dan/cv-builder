import { CVDataCache } from '../cvDataCache'
import { WorkflowCVData } from '../../types/workflow'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock setInterval and clearInterval
vi.useFakeTimers({
  doNotFake: ['performance']
})

// Mock global setInterval for testing
const mockSetInterval = vi.fn()
global.setInterval = mockSetInterval

// Mock data
const mockCVData: WorkflowCVData = {
  id: 'test-cv-1',
  userId: 'test-user-1',
  title: 'Test CV',
  status: 'draft',
  score: 75,
  contact: {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '0123456789',
    location: 'Test City'
  },
  summary: {
    content: 'Test summary content'
  },
  experience: {
    items: []
  },
  skills: {
    items: ['JavaScript', 'React']
  },
  education: {
    items: []
  },
  workflow: {
    currentStep: 'editing',
    stepsCompleted: ['upload', 'analysis'],
    lastActiveStep: 'editing',
    timeSpent: 300
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
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

describe('CVDataCache', () => {
  let cache: CVDataCache

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset singleton instance
    ;(CVDataCache as any).instance = undefined
    
    cache = CVDataCache.getInstance({
      memoryTTL: 1000,      // 1 second for testing
      localStorageTTL: 2000, // 2 seconds for testing
      maxMemoryEntries: 3,   // Small limit for testing eviction
      enableOfflineMode: true
    })
  })

  afterEach(() => {
    cache.clear()
    vi.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const cache1 = CVDataCache.getInstance()
      const cache2 = CVDataCache.getInstance()
      expect(cache1).toBe(cache2)
    })

    it('should use provided configuration', () => {
      const config = cache.getConfig()
      expect(config.memoryTTL).toBe(1000)
      expect(config.localStorageTTL).toBe(2000)
      expect(config.maxMemoryEntries).toBe(3)
      expect(config.enableOfflineMode).toBe(true)
    })
  })

  describe('Memory Cache', () => {
    it('should store and retrieve data from memory cache', async () => {
      await cache.set('test-cv-1', mockCVData)
      const result = await cache.get('test-cv-1')
      
      expect(result).toEqual(mockCVData)
      
      const stats = cache.getStats()
      expect(stats.memoryHits).toBe(1)
      expect(stats.totalRequests).toBe(1)
    })

    it('should return null for non-existent entries', async () => {
      const result = await cache.get('non-existent')
      
      expect(result).toBeNull()
      
      const stats = cache.getStats()
      expect(stats.misses).toBe(1)
    })

    it('should expire entries after TTL', async () => {
      await cache.set('test-cv-1', mockCVData)
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1500)
      
      const result = await cache.get('test-cv-1')
      expect(result).toBeNull()
    })

    it('should evict oldest entries when max capacity is reached', async () => {
      const cv1 = { ...mockCVData, id: 'cv-1' }
      const cv2 = { ...mockCVData, id: 'cv-2' }
      const cv3 = { ...mockCVData, id: 'cv-3' }
      const cv4 = { ...mockCVData, id: 'cv-4' }

      await cache.set('cv-1', cv1)
      await cache.set('cv-2', cv2)
      await cache.set('cv-3', cv3)
      
      // This should evict cv-1 (oldest)
      await cache.set('cv-4', cv4)
      
      expect(await cache.get('cv-1')).toBeNull()
      expect(await cache.get('cv-2')).toEqual(cv2)
      expect(await cache.get('cv-3')).toEqual(cv3)
      expect(await cache.get('cv-4')).toEqual(cv4)
      
      const stats = cache.getStats()
      expect(stats.evictions).toBe(1)
    })

    it('should validate cache entries correctly', async () => {
      await cache.set('test-cv-1', mockCVData)
      
      expect(cache.isValid('test-cv-1')).toBe(true)
      expect(cache.isValid('non-existent')).toBe(false)
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1500)
      
      expect(cache.isValid('test-cv-1')).toBe(false)
    })
  })

  describe('localStorage Cache', () => {
    it('should store data in localStorage', async () => {
      await cache.set('test-cv-1', mockCVData)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cv_cache_test-cv-1',
        JSON.stringify(mockCVData)
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cv_cache_meta_test-cv-1',
        expect.stringContaining('"cvId":"test-cv-1"')
      )
    })

    it('should retrieve data from localStorage when not in memory', async () => {
      // Mock localStorage to return data
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockCVData)) // data
        .mockReturnValueOnce(JSON.stringify({ // meta
          timestamp: Date.now(),
          ttl: 2000,
          cvId: 'test-cv-1'
        }))

      const result = await cache.get('test-cv-1')
      
      expect(result).toEqual(mockCVData)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cv_cache_test-cv-1')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cv_cache_meta_test-cv-1')
      
      const stats = cache.getStats()
      expect(stats.localStorageHits).toBe(1)
    })

    it('should remove expired localStorage entries', async () => {
      // Mock expired localStorage data
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockCVData)) // data
        .mockReturnValueOnce(JSON.stringify({ // meta
          timestamp: Date.now() - 3000, // Expired
          ttl: 2000,
          cvId: 'test-cv-1'
        }))

      const result = await cache.get('test-cv-1')
      
      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cv_cache_test-cv-1')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cv_cache_meta_test-cv-1')
    })

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const result = await cache.get('test-cv-1')
      expect(result).toBeNull()
    })

    it('should handle quota exceeded error', async () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw quotaError
      })

      // Should not throw error
      await expect(cache.set('test-cv-1', mockCVData)).resolves.toBeUndefined()
    })

    it('should disable localStorage when offline mode is disabled', async () => {
      cache.updateConfig({ enableOfflineMode: false })
      
      await cache.set('test-cv-1', mockCVData)
      
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate memory cache entry', async () => {
      await cache.set('test-cv-1', mockCVData)
      
      expect(await cache.get('test-cv-1')).toEqual(mockCVData)
      
      cache.invalidate('test-cv-1')
      
      expect(await cache.get('test-cv-1')).toBeNull()
    })

    it('should invalidate localStorage entry', async () => {
      cache.invalidate('test-cv-1')
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cv_cache_test-cv-1')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cv_cache_meta_test-cv-1')
    })

    it('should clear all cache entries', async () => {
      await cache.set('cv-1', { ...mockCVData, id: 'cv-1' })
      await cache.set('cv-2', { ...mockCVData, id: 'cv-2' })
      
      // Mock localStorage keys
      Object.defineProperty(localStorage, 'keys', {
        value: vi.fn().mockReturnValue(['cv_cache_cv-1', 'cv_cache_meta_cv-1', 'other_key']),
        writable: true
      })

      cache.clear()
      
      expect(await cache.get('cv-1')).toBeNull()
      expect(await cache.get('cv-2')).toBeNull()
      
      const stats = cache.getStats()
      expect(stats.memoryHits).toBe(0)
      expect(stats.totalRequests).toBe(2) // From the get calls above
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache statistics correctly', async () => {
      // Memory hit
      await cache.set('cv-1', mockCVData)
      await cache.get('cv-1')
      
      // Miss
      await cache.get('non-existent')
      
      // localStorage hit
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockCVData))
        .mockReturnValueOnce(JSON.stringify({
          timestamp: Date.now(),
          ttl: 2000,
          cvId: 'cv-2'
        }))
      await cache.get('cv-2')
      
      const stats = cache.getStats()
      expect(stats.memoryHits).toBe(1)
      expect(stats.localStorageHits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.totalRequests).toBe(3)
    })

    it('should provide cache size information', async () => {
      await cache.set('cv-1', mockCVData)
      await cache.set('cv-2', { ...mockCVData, id: 'cv-2' })
      
      // Mock localStorage length and key method for proper size calculation
      Object.defineProperty(localStorage, 'length', {
        value: 4,
        writable: true
      })
      Object.defineProperty(localStorage, 'key', {
        value: vi.fn()
          .mockReturnValueOnce('cv_cache_cv-1')
          .mockReturnValueOnce('cv_cache_meta_cv-1')
          .mockReturnValueOnce('other_key')
          .mockReturnValueOnce('cv_cache_cv-2'),
        writable: true
      })

      const sizeInfo = cache.getSizeInfo()
      expect(sizeInfo.memory).toBe(2)
      expect(sizeInfo.localStorage).toBe(3) // cv_cache_cv-1, cv_cache_meta_cv-1, cv_cache_cv-2
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        memoryTTL: 5000,
        maxMemoryEntries: 10
      }
      
      cache.updateConfig(newConfig)
      
      const config = cache.getConfig()
      expect(config.memoryTTL).toBe(5000)
      expect(config.maxMemoryEntries).toBe(10)
      expect(config.localStorageTTL).toBe(2000) // Should preserve existing values
    })

    it('should return copy of configuration', () => {
      const config1 = cache.getConfig()
      const config2 = cache.getConfig()
      
      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2) // Should be different objects
    })
  })

  describe('Periodic Cleanup', () => {
    it('should set up periodic cleanup interval', () => {
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 10 * 60 * 1000)
    })

    it('should clean up expired entries during periodic cleanup', async () => {
      await cache.set('cv-1', mockCVData)
      await cache.set('cv-2', { ...mockCVData, id: 'cv-2' })
      
      // Advance time to expire entries
      vi.advanceTimersByTime(1500)
      
      // Trigger periodic cleanup
      vi.advanceTimersByTime(10 * 60 * 1000)
      
      expect(await cache.get('cv-1')).toBeNull()
      expect(await cache.get('cv-2')).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle cache get errors gracefully', async () => {
      // Mock error in memory cache
      vi.spyOn(cache as any, 'getFromMemory').mockImplementation(() => {
        throw new Error('Memory cache error')
      })

      const result = await cache.get('test-cv-1')
      expect(result).toBeNull()
      
      const stats = cache.getStats()
      expect(stats.misses).toBe(1)
    })

    it('should handle cache set errors gracefully', async () => {
      // Mock error in memory cache
      vi.spyOn(cache as any, 'setInMemory').mockImplementation(() => {
        throw new Error('Memory cache error')
      })

      // Should not throw error
      await expect(cache.set('test-cv-1', mockCVData)).resolves.toBeUndefined()
    })

    it('should handle invalidate errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should not throw error
      expect(() => cache.invalidate('test-cv-1')).not.toThrow()
    })

    it('should handle clear errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should not throw error
      expect(() => cache.clear()).not.toThrow()
    })
  })

  describe('Data Promotion', () => {
    it('should promote localStorage data to memory cache', async () => {
      // Mock localStorage to return data
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockCVData))
        .mockReturnValueOnce(JSON.stringify({
          timestamp: Date.now(),
          ttl: 2000,
          cvId: 'test-cv-1'
        }))

      // First get should hit localStorage
      const result1 = await cache.get('test-cv-1')
      expect(result1).toEqual(mockCVData)
      
      // Reset mocks
      mockLocalStorage.getItem.mockClear()
      
      // Second get should hit memory cache (promoted)
      const result2 = await cache.get('test-cv-1')
      expect(result2).toEqual(mockCVData)
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
      
      const stats = cache.getStats()
      expect(stats.memoryHits).toBe(1)
      expect(stats.localStorageHits).toBe(1)
    })
  })
}) 