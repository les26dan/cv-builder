/**
 * Text Configuration Preloading System
 * Eliminates 2-3 second delays from async text loading on every page
 * Following OkBuddy tenets: performance-first, user experience priority
 */

import { type SupportedLanguage } from '../languageConfig'

// Text cache interface
interface TextCache {
  [key: string]: {
    [language: string]: any
  }
}

// Global text cache
let textCache: TextCache = {}
let preloadPromise: Promise<void> | null = null
let isPreloading = false

// Text modules to preload - only actual text modules, no test files
const TEXT_MODULES = [
  'workspace',
  'cvUpload', 
  'cvEditor',
  'workExperienceWizard',
  'skillsAI',
  'account',
  'aiPrompts',
  'landingPage',
  'userDrawer',
  'feedback',
  'jdAnalysis',
  'jdOptimization',
  'career'
] as const

type TextModule = typeof TEXT_MODULES[number]

/**
 * Preload all text configurations for a language
 * This eliminates the need for async text loading on each page
 */
export async function preloadTexts(language: SupportedLanguage = 'en'): Promise<void> {
  // Prevent multiple simultaneous preloads
  if (isPreloading) {
    return preloadPromise || Promise.resolve()
  }
  
  // Return cached result if already loaded
  if (textCache[language] && Object.keys(textCache[language]).length > 0) {
    console.log(`🚀 Text cache HIT for ${language} - ${Object.keys(textCache[language]).length} modules`)
    return Promise.resolve()
  }
  
  isPreloading = true
  console.log(`📚 Preloading text configurations for ${language}...`)
  
  preloadPromise = (async () => {
    try {
      // Initialize cache for this language
      if (!textCache[language]) {
        textCache[language] = {}
      }
      
      // Load text modules using the existing textModules mapping to avoid dynamic import issues
      const { textModules } = await import('./index')
      
      const loadPromises = TEXT_MODULES.map(async (module) => {
        try {
          // Use the existing textModules mapping which is already working
          if (textModules[language] && textModules[language][module]) {
            const result = await textModules[language][module]()
            textCache[language][module] = result
            console.log(`✅ Loaded ${module} texts for ${language}`)
          } else {
            console.warn(`⚠️ Module ${module} not found in textModules for ${language}`)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load ${module} texts for ${language}:`, error)
          // Don't fail the entire preload for one missing module
        }
      })
      
      await Promise.all(loadPromises)
      
      const loadedCount = Object.keys(textCache[language]).length
      console.log(`🎉 Text preloading complete for ${language}: ${loadedCount}/${TEXT_MODULES.length} modules`)
      
    } catch (error) {
      console.error(`❌ Text preloading failed for ${language}:`, error)
      throw error
    } finally {
      isPreloading = false
    }
  })()
  
  return preloadPromise
}

/**
 * Get cached text configuration instantly (no async)
 * Returns null if not preloaded - use this for non-blocking access
 */
export function getCachedTexts(module: string, language: SupportedLanguage = 'en'): any | null {
  const cached = textCache[language]?.[module]
  if (cached) {
    console.log(`🚀 Text cache HIT: ${module} (${language})`)
    return cached
  }
  
  console.log(`❌ Text cache MISS: ${module} (${language})`)
  return null
}

/**
 * Get text configuration with fallback to async loading
 * This maintains compatibility with existing code while providing caching
 */
export async function getTexts(module: string, language: SupportedLanguage = 'en'): Promise<any> {
  // Try cache first
  const cached = getCachedTexts(module, language)
  if (cached) {
    return cached
  }
  
  console.log(`🌐 Text cache MISS - loading ${module} for ${language}`)
  
  try {
    // Skip test files and __tests__ directories
    if (module.includes('test') || module.includes('__tests__')) {
      throw new Error(`Skipping test file: ${module}`)
    }
    
    // Load the specific module
    const textModule = await import(`./${language}/${module}`)
    
    // Cache it for next time
    if (!textCache[language]) {
      textCache[language] = {}
    }
    
    let result
    if (textModule.default) {
      result = textModule.default
    } else if (textModule[module]) {
      result = textModule[module]
    } else {
      const keys = Object.keys(textModule).filter(key => !key.includes('test'))
      if (keys.length > 0) {
        result = textModule[keys[0]]
      }
    }
    
    if (result) {
      textCache[language][module] = result
      console.log(`💾 Cached ${module} texts for ${language}`)
      return result
    }
    
    throw new Error(`No valid export found in ${module}`)
    
  } catch (error) {
    console.error(`❌ Failed to load ${module} texts for ${language}:`, error)
    
    // Fallback to English if loading non-English fails
    if (language !== 'en') {
      console.log(`🔄 Falling back to English for ${module}`)
      return getTexts(module, 'en')
    }
    
    throw error
  }
}

/**
 * Preload texts for both languages (for bilingual support)
 */
export async function preloadBilingualTexts(): Promise<void> {
  console.log('🌐 Preloading bilingual text configurations...')
  
  try {
    await Promise.all([
      preloadTexts('en'),
      preloadTexts('vi')
    ])
    
    console.log('🎉 Bilingual text preloading complete!')
  } catch (error) {
    console.error('❌ Bilingual text preloading failed:', error)
    throw error
  }
}

/**
 * Clear text cache (useful for language switching)
 */
export function clearTextCache(language?: SupportedLanguage): void {
  if (language) {
    delete textCache[language]
    console.log(`🧹 Cleared text cache for ${language}`)
  } else {
    textCache = {}
    console.log('🧹 Cleared all text cache')
  }
}

/**
 * Get cache statistics for debugging
 */
export function getTextCacheStats(): {
  languages: string[]
  modules: { [language: string]: string[] }
  totalSize: number
} {
  const languages = Object.keys(textCache)
  const modules: { [language: string]: string[] } = {}
  let totalSize = 0
  
  languages.forEach(lang => {
    modules[lang] = Object.keys(textCache[lang])
    totalSize += modules[lang].length
  })
  
  return {
    languages,
    modules,
    totalSize
  }
}

/**
 * Initialize text preloading on app startup
 * Call this in your app's root component or _app.tsx
 */
export function initializeTextPreloading(language: SupportedLanguage = 'en'): void {
  if (typeof window !== 'undefined') {
    // Only preload on client side
    preloadTexts(language).catch(error => {
      console.error('Failed to initialize text preloading:', error)
    })
  }
}
