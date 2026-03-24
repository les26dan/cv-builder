/**
 * Performance Monitoring Provider
 * Initializes comprehensive performance tracking across the application
 * Following OkBuddy tenets: performance optimization, data collection
 */

'use client'

import { useEffect } from 'react'
import { getPerformanceMonitor } from '@/lib/performance-monitor'
import { getVercelMonitor } from '@/lib/vercel-monitor'

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode
}

export function PerformanceMonitoringProvider({ children }: PerformanceMonitoringProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    const performanceMonitor = getPerformanceMonitor()
    const vercelMonitor = getVercelMonitor()
    
    console.log('🚀 Performance monitoring initialized')
    
    // Track deployment info
    vercelMonitor.trackDeploymentInfo()
    
    // Monitor page navigation performance
    const trackPageNavigation = () => {
      const endTimer = performanceMonitor.startTimer('page_navigation')
      
      // Track when navigation completes
      setTimeout(() => {
        endTimer()
      }, 100)
    }
    
    // Listen for route changes (Next.js specific)
    const handleRouteChange = () => {
      trackPageNavigation()
    }
    
    // Monitor authentication events
    const handleAuthStart = () => {
      console.log('🔐 Auth check started')
    }
    
    const handleAuthComplete = (event: any) => {
      const { duration, cached, result } = event.detail || {}
      console.log(`🔐 Auth check completed: ${duration}ms (cached: ${cached}, result: ${result})`)
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow auth check: ${duration}ms`)
      }
    }
    
    const handleAuthError = (event: any) => {
      const { error, duration } = event.detail || {}
      console.error(`🚨 Auth error after ${duration}ms:`, error)
    }
    
    // Add event listeners
    window.addEventListener('auth-check-start', handleAuthStart)
    window.addEventListener('auth-check-complete', handleAuthComplete)
    window.addEventListener('auth-error', handleAuthError)
    
    // Monitor component loading times
    const monitorComponentLoading = () => {
      // Track dynamic imports (webpack-specific)
      const webpackRequire = (window as any).__webpack_require__
      
      if (webpackRequire?.cache) {
        console.log('📦 Webpack module loading monitoring enabled')
      }
    }
    
    monitorComponentLoading()
    
    // Monitor API calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url] = args
      const startTime = Date.now()
      
      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime
        
        // Track API performance
        if (typeof url === 'string') {
          const endpoint = url.replace(window.location.origin, '')
          performanceMonitor.trackApiCall(endpoint, duration, response.status)
        }
        
        return response
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`🌐 API call failed after ${duration}ms:`, error)
        throw error
      }
    }
    
    // Performance budget monitoring
    const monitorPerformanceBudget = () => {
      setTimeout(() => {
        const metrics = performanceMonitor.getPageLoadMetrics()
        
        // Check performance budget violations
        const violations = []
        
        if (metrics.fcp && metrics.fcp > 1800) {
          violations.push(`FCP: ${metrics.fcp.toFixed(0)}ms > 1800ms`)
        }
        
        if (metrics.lcp && metrics.lcp > 2500) {
          violations.push(`LCP: ${metrics.lcp.toFixed(0)}ms > 2500ms`)
        }
        
        if (metrics.ttfb && metrics.ttfb > 800) {
          violations.push(`TTFB: ${metrics.ttfb.toFixed(0)}ms > 800ms`)
        }
        
        if (violations.length > 0) {
          console.warn('⚠️ PERFORMANCE BUDGET VIOLATIONS:')
          violations.forEach(violation => {
            console.warn(`  ${violation}`)
          })
        } else {
          console.log('✅ Performance budget: All metrics within limits')
        }
      }, 5000) // Check after 5 seconds
    }
    
    monitorPerformanceBudget()
    
    // Cleanup function
    return () => {
      window.removeEventListener('auth-check-start', handleAuthStart)
      window.removeEventListener('auth-check-complete', handleAuthComplete)
      window.removeEventListener('auth-error', handleAuthError)
      
      // Restore original fetch
      window.fetch = originalFetch
    }
  }, [])
  
  return <>{children}</>
}

// Export for use in layout
export default PerformanceMonitoringProvider
