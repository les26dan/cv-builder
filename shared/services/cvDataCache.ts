/**
 * CV Data Cache Service
 * Provides multi-level caching (memory, localStorage, database) with intelligent invalidation
 * Supports offline functionality and data synchronization
 */

import { WorkflowCVData } from '../types/workflow'

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: WorkflowCVData
  timestamp: number
  ttl: number
  source: 'memory' | 'localStorage' | 'database'
}

/**
 * Cache configuration
 */
interface CacheConfig {
  memoryTTL: number        // Memory cache TTL in milliseconds
  localStorageTTL: number  // localStorage cache TTL in milliseconds
  maxMemoryEntries: number // Maximum entries in memory cache
  enableOfflineMode: boolean // Enable offline caching
}

/**
 * Cache statistics
 */
interface CacheStats {
  memoryHits: number
  localStorageHits: number
  databaseHits: number
  misses: number
  evictions: number
  totalRequests: number
}

/**
 * CV Data Cache Service
 * Implements intelligent multi-level caching with performance optimization
 */
export class CVDataCache {
  private static instance: CVDataCache
  private memoryCache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private stats: CacheStats = {
    memoryHits: 0,
    localStorageHits: 0,
    databaseHits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  }

  /**
   * Singleton pattern for consistent cache instance
   */
  public static getInstance(config?: Partial<CacheConfig>): CVDataCache {
    if (!CVDataCache.instance) {
      CVDataCache.instance = new CVDataCache(config)
    }
    return CVDataCache.instance
  }

  /**
   * Private constructor
   */
  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      memoryTTL: 5 * 60 * 1000,      // 5 minutes
      localStorageTTL: 60 * 60 * 1000, // 1 hour
      maxMemoryEntries: 50,
      enableOfflineMode: true,
      ...config
    }

    // Set up periodic cleanup
    this.setupCleanupInterval()
  }

  /**
   * Get CV data from cache (checks all levels)
   * @param cvId - CV ID to retrieve
   * @returns Promise<WorkflowCVData | null>
   */
  public async get(cvId: string): Promise<WorkflowCVData | null> {
    this.stats.totalRequests++

    try {
      // Level 1: Memory cache
      const memoryResult = this.getFromMemory(cvId)
      if (memoryResult) {
        this.stats.memoryHits++
        return memoryResult
      }

      // Level 2: localStorage cache
      const localStorageResult = await this.getFromLocalStorage(cvId)
      if (localStorageResult) {
        this.stats.localStorageHits++
        // Promote to memory cache
        this.setInMemory(cvId, localStorageResult, 'localStorage')
        return localStorageResult
      }

      // Level 3: Database (handled by caller)
      this.stats.misses++
      return null

    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set CV data in cache (all levels)
   * @param cvId - CV ID
   * @param data - CV data to cache
   * @param source - Source of the data
   */
  public async set(cvId: string, data: WorkflowCVData, source: 'memory' | 'localStorage' | 'database' = 'database'): Promise<void> {
    try {
      // Set in memory cache
      this.setInMemory(cvId, data, source)

      // Set in localStorage if enabled
      if (this.config.enableOfflineMode) {
        await this.setInLocalStorage(cvId, data)
      }

    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Invalidate cache entry
   * @param cvId - CV ID to invalidate
   */
  public invalidate(cvId: string): void {
    try {
      // Remove from memory cache
      this.memoryCache.delete(cvId)

      // Remove from localStorage
      if (this.config.enableOfflineMode) {
        localStorage.removeItem(`cv_cache_${cvId}`)
        localStorage.removeItem(`cv_cache_meta_${cvId}`)
      }

    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    try {
      // Clear memory cache
      this.memoryCache.clear()

      // Clear localStorage cache
      if (this.config.enableOfflineMode) {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('cv_cache_')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Reset stats
      this.stats = {
        memoryHits: 0,
        localStorageHits: 0,
        databaseHits: 0,
        misses: 0,
        evictions: 0,
        totalRequests: 0
      }

    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache configuration
   */
  public getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Check if cache entry is valid
   */
  public isValid(cvId: string): boolean {
    const entry = this.memoryCache.get(cvId)
    if (!entry) return false

    const now = Date.now()
    return now - entry.timestamp < entry.ttl
  }

  /**
   * Get cache size information
   */
  public getSizeInfo(): { memory: number; localStorage: number } {
    const memorySize = this.memoryCache.size
    
    let localStorageSize = 0
    if (this.config.enableOfflineMode) {
      try {
        // Count localStorage entries by checking what's actually stored
        let count = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('cv_cache_')) {
            count++
          }
        }
        localStorageSize = count
      } catch (error) {
        // Fallback for mock localStorage
        const keys = Object.keys(localStorage)
        localStorageSize = keys.filter(key => key.startsWith('cv_cache_')).length
      }
    }

    return { memory: memorySize, localStorage: localStorageSize }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Get data from memory cache
   */
  private getFromMemory(cvId: string): WorkflowCVData | null {
    const entry = this.memoryCache.get(cvId)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(cvId)
      return null
    }

    return entry.data
  }

  /**
   * Set data in memory cache
   */
  private setInMemory(cvId: string, data: WorkflowCVData, source: 'memory' | 'localStorage' | 'database'): void {
    // Check if we need to evict entries
    if (this.memoryCache.size >= this.config.maxMemoryEntries) {
      this.evictOldestEntry()
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: this.config.memoryTTL,
      source
    }

    this.memoryCache.set(cvId, entry)
  }

  /**
   * Get data from localStorage
   */
  private async getFromLocalStorage(cvId: string): Promise<WorkflowCVData | null> {
    if (!this.config.enableOfflineMode) return null

    try {
      const dataKey = `cv_cache_${cvId}`
      const metaKey = `cv_cache_meta_${cvId}`

      const dataStr = localStorage.getItem(dataKey)
      const metaStr = localStorage.getItem(metaKey)

      if (!dataStr || !metaStr) return null

      const meta = JSON.parse(metaStr)
      const now = Date.now()

      // Check if expired
      if (now - meta.timestamp > this.config.localStorageTTL) {
        localStorage.removeItem(dataKey)
        localStorage.removeItem(metaKey)
        return null
      }

      return JSON.parse(dataStr)

    } catch (error) {
      console.error('localStorage get error:', error)
      return null
    }
  }

  /**
   * Set data in localStorage
   */
  private async setInLocalStorage(cvId: string, data: WorkflowCVData): Promise<void> {
    if (!this.config.enableOfflineMode) return

    try {
      const dataKey = `cv_cache_${cvId}`
      const metaKey = `cv_cache_meta_${cvId}`

      const meta = {
        timestamp: Date.now(),
        ttl: this.config.localStorageTTL,
        cvId
      }

      localStorage.setItem(dataKey, JSON.stringify(data))
      localStorage.setItem(metaKey, JSON.stringify(meta))

    } catch (error) {
      console.error('localStorage set error:', error)
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupLocalStorage()
        // Retry once
        try {
          localStorage.setItem(`cv_cache_${cvId}`, JSON.stringify(data))
          localStorage.setItem(`cv_cache_meta_${cvId}`, JSON.stringify({
            timestamp: Date.now(),
            ttl: this.config.localStorageTTL,
            cvId
          }))
        } catch (retryError) {
          console.error('localStorage retry failed:', retryError)
        }
      }
    }
  }

  /**
   * Evict oldest entry from memory cache
   */
  private evictOldestEntry(): void {
    if (this.memoryCache.size === 0) return

    let oldestKey: string | null = null
    let oldestTimestamp = Number.MAX_SAFE_INTEGER

    const entries = Array.from(this.memoryCache.entries())
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Clean up expired localStorage entries
   */
  private cleanupLocalStorage(): void {
    if (!this.config.enableOfflineMode) return

    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach(key => {
        if (key.startsWith('cv_cache_meta_')) {
          try {
            const meta = JSON.parse(localStorage.getItem(key) || '{}')
            if (now - meta.timestamp > this.config.localStorageTTL) {
              const cvId = meta.cvId
              localStorage.removeItem(key)
              localStorage.removeItem(`cv_cache_${cvId}`)
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key)
          }
        }
      })

    } catch (error) {
      console.error('localStorage cleanup error:', error)
    }
  }

  /**
   * Set up periodic cleanup interval
   */
  private setupCleanupInterval(): void {
    // Clean up every 10 minutes
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, 10 * 60 * 1000)
  }

  /**
   * Clean up expired entries from all cache levels
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()

    // Clean memory cache
    const entries = Array.from(this.memoryCache.entries())
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
      }
    }

    // Clean localStorage cache
    this.cleanupLocalStorage()
  }
} 