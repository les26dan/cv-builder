/**
 * Vercel-Specific Performance Monitoring
 * Tracks Vercel deployment characteristics and potential issues
 * Following OkBuddy tenets: performance optimization, issue identification
 */

interface VercelMetrics {
  // Vercel-specific environment
  region?: string
  deploymentId?: string
  functionName?: string
  coldStart?: boolean
  
  // Performance metrics
  functionDuration?: number
  memoryUsed?: number
  billedDuration?: number
  
  // Network metrics
  edgeLocation?: string
  cacheStatus?: 'HIT' | 'MISS' | 'BYPASS'
  
  // Error tracking
  timeoutErrors?: number
  memoryErrors?: number
  coldStartErrors?: number
}

class VercelMonitor {
  private isVercel: boolean
  private region: string | undefined
  private deploymentId: string | undefined
  
  constructor() {
    this.isVercel = this.detectVercelEnvironment()
    this.region = process.env.VERCEL_REGION
    this.deploymentId = process.env.VERCEL_DEPLOYMENT_ID
    
    if (this.isVercel) {
      this.initializeVercelMonitoring()
    }
  }
  
  private detectVercelEnvironment(): boolean {
    // Server-side detection
    if (typeof window === 'undefined') {
      return !!(process.env.VERCEL || process.env.VERCEL_ENV)
    }
    
    // Client-side detection
    const hostname = window.location.hostname
    return hostname.includes('vercel.app') || 
           hostname.includes('.app') || 
           hostname.includes('okbuddy')
  }
  
  private initializeVercelMonitoring() {
    console.log('🚀 Vercel monitoring initialized')
    console.log(`Region: ${this.region}`)
    console.log(`Deployment: ${this.deploymentId}`)
    
    // Monitor Vercel-specific issues
    this.monitorColdStarts()
    this.monitorFunctionTimeouts()
    this.monitorMemoryUsage()
    this.monitorEdgeCache()
  }
  
  private monitorColdStarts() {
    // Track potential cold start indicators
    const startTime = Date.now()
    
    // Check if this might be a cold start
    if (typeof window === 'undefined') {
      // Server-side: Check if this is the first request
      const globalAny = global as any
      const isColdStart = !globalAny.__vercel_warm
      globalAny.__vercel_warm = true
      
      if (isColdStart) {
        console.log('🥶 POTENTIAL COLD START DETECTED')
        this.logVercelMetric('coldStart', true)
      }
    }
    
    // Monitor initial load time (could indicate cold start)
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = Date.now() - startTime
        if (loadTime > 3000) {
          console.log(`🐌 SLOW INITIAL LOAD: ${loadTime}ms (possible cold start)`)
          this.logVercelMetric('possibleColdStart', loadTime)
        }
      })
    }
  }
  
  private monitorFunctionTimeouts() {
    // Monitor for Vercel function timeout patterns
    const originalFetch = global.fetch
    
    if (typeof window === 'undefined' && originalFetch) {
      global.fetch = async (...args) => {
        const startTime = Date.now()
        
        try {
          const response = await originalFetch(...args)
          const duration = Date.now() - startTime
          
          // Log slow API calls that might timeout
          if (duration > 8000) { // Vercel has 10s timeout for hobby plan
            console.log(`⏰ SLOW API CALL: ${duration}ms (approaching timeout)`)
            this.logVercelMetric('slowApiCall', duration)
          }
          
          return response
        } catch (error) {
          const duration = Date.now() - startTime
          
          // Check if this might be a timeout
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (duration > 9000 || errorMessage.includes('timeout')) {
            console.log(`🚨 POTENTIAL TIMEOUT: ${duration}ms`)
            this.logVercelMetric('timeoutError', duration)
          }
          
          throw error
        }
      }
    }
  }
  
  private monitorMemoryUsage() {
    if (typeof window === 'undefined' && process.memoryUsage) {
      const checkMemory = () => {
        const usage = process.memoryUsage()
        const usedMB = usage.heapUsed / 1024 / 1024
        
        // Vercel hobby plan has 1024MB limit
        if (usedMB > 800) {
          console.log(`🧠 HIGH MEMORY USAGE: ${usedMB.toFixed(2)}MB`)
          this.logVercelMetric('highMemoryUsage', usedMB)
        }
        
        // Log memory stats periodically
        console.log(`💾 Memory: ${usedMB.toFixed(2)}MB heap, ${(usage.rss / 1024 / 1024).toFixed(2)}MB RSS`)
      }
      
      // Check memory every 30 seconds
      setInterval(checkMemory, 30000)
      
      // Check memory on startup
      checkMemory()
    }
  }
  
  private monitorEdgeCache() {
    if (typeof window !== 'undefined') {
      // Monitor cache headers from Vercel Edge Network
      const originalFetch = window.fetch
      
      window.fetch = async (...args) => {
        const response = await originalFetch(...args)
        
        // Check Vercel cache headers
        const cacheStatus = response.headers.get('x-vercel-cache')
        const edge = response.headers.get('x-vercel-id')
        
        if (cacheStatus) {
          console.log(`🌐 Vercel Cache: ${cacheStatus} (Edge: ${edge})`)
          this.logVercelMetric('cacheStatus', cacheStatus)
        }
        
        return response
      }
    }
  }
  
  private logVercelMetric(name: string, value: any) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      region: this.region,
      deploymentId: this.deploymentId,
      environment: 'vercel'
    }
    
    console.log(`📊 VERCEL METRIC: ${name} = ${value}`)
    
    // Send to analytics
    this.sendVercelMetric(metric)
  }
  
  private async sendVercelMetric(metric: any) {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/analytics/vercel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        })
      }
    } catch (error) {
      console.error('Failed to send Vercel metric:', error)
    }
  }
  
  // Public methods for manual tracking
  public trackFunctionStart(functionName: string): () => void {
    const startTime = Date.now()
    console.log(`🔧 Function started: ${functionName}`)
    
    return () => {
      const duration = Date.now() - startTime
      console.log(`✅ Function completed: ${functionName} (${duration}ms)`)
      this.logVercelMetric(`function_${functionName}`, duration)
    }
  }
  
  public trackDeploymentInfo() {
    if (this.isVercel) {
      console.log('🚀 VERCEL DEPLOYMENT INFO:')
      console.log(`Environment: ${process.env.VERCEL_ENV}`)
      console.log(`Region: ${process.env.VERCEL_REGION}`)
      console.log(`Deployment ID: ${process.env.VERCEL_DEPLOYMENT_ID}`)
      console.log(`Git Commit: ${process.env.VERCEL_GIT_COMMIT_SHA}`)
      console.log(`Git Branch: ${process.env.VERCEL_GIT_COMMIT_REF}`)
    }
  }
  
  public getVercelContext() {
    return {
      isVercel: this.isVercel,
      region: this.region,
      deploymentId: this.deploymentId,
      environment: process.env.VERCEL_ENV,
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF
    }
  }
}

// Global instance
let vercelMonitor: VercelMonitor | null = null

export function getVercelMonitor(): VercelMonitor {
  if (!vercelMonitor) {
    vercelMonitor = new VercelMonitor()
  }
  return vercelMonitor
}

export type { VercelMetrics }
