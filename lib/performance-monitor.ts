/**
 * Comprehensive Performance Monitoring System
 * Tracks performance across local development and Vercel production
 * Following OkBuddy tenets: data collection, performance optimization
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  environment: 'local' | 'vercel' | 'unknown'
  url: string
  userAgent?: string
  connectionType?: string
  userId?: string
  sessionId: string
}

interface PageLoadMetrics {
  // Core Web Vitals
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  
  // Custom metrics
  domContentLoaded?: number
  windowLoad?: number
  authCheckTime?: number
  componentLoadTime?: number
  apiResponseTime?: number
  
  // Resource metrics
  jsSize?: number
  cssSize?: number
  imageSize?: number
  totalSize?: number
  
  // Network metrics
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

interface ErrorMetric {
  type: 'javascript' | 'network' | 'auth' | 'component' | 'api'
  message: string
  stack?: string
  url: string
  timestamp: number
  environment: string
  userId?: string
  sessionId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class PerformanceMonitor {
  private sessionId: string
  private environment: 'local' | 'vercel' | 'unknown'
  private metrics: PerformanceMetric[] = []
  private errors: ErrorMetric[] = []
  private startTime: number = Date.now()
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.environment = this.detectEnvironment()
    this.initializeMonitoring()
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private detectEnvironment(): 'local' | 'vercel' | 'unknown' {
    if (typeof window === 'undefined') {
      // Server-side detection
      if (process.env.VERCEL) return 'vercel'
      if (process.env.NODE_ENV === 'development') return 'local'
      return 'unknown'
    }
    
    // Client-side detection
    const hostname = window.location.hostname
    if (hostname.includes('vercel.app') || hostname.includes('okbuddy')) return 'vercel'
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local'
    return 'unknown'
  }
  
  private initializeMonitoring() {
    if (typeof window === 'undefined') return
    
    // Monitor Core Web Vitals
    this.monitorWebVitals()
    
    // Monitor page load events
    this.monitorPageLoad()
    
    // Monitor network conditions
    this.monitorNetworkConditions()
    
    // Monitor errors
    this.monitorErrors()
    
    // Monitor authentication performance
    this.monitorAuthPerformance()
    
    // Send metrics periodically
    this.startMetricReporting()
  }
  
  private monitorWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime)
        }
      }
    }).observe({ entryTypes: ['paint'] })
    
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('lcp', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('fid', (entry as any).processingStart - entry.startTime)
      }
    }).observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      this.recordMetric('cls', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  private monitorPageLoad() {
    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.recordMetric('domContentLoaded', Date.now() - this.startTime)
    })
    
    // Window Load
    window.addEventListener('load', () => {
      this.recordMetric('windowLoad', Date.now() - this.startTime)
      
      // Measure resource sizes
      this.measureResourceSizes()
      
      // Measure TTFB
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart)
      }
    })
  }
  
  private measureResourceSizes() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    let jsSize = 0
    let cssSize = 0
    let imageSize = 0
    let totalSize = 0
    
    resources.forEach(resource => {
      const size = resource.transferSize || 0
      totalSize += size
      
      if (resource.name.includes('.js')) jsSize += size
      else if (resource.name.includes('.css')) cssSize += size
      else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) imageSize += size
    })
    
    this.recordMetric('jsSize', jsSize)
    this.recordMetric('cssSize', cssSize)
    this.recordMetric('imageSize', imageSize)
    this.recordMetric('totalSize', totalSize)
  }
  
  private monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.recordMetric('downlink', connection.downlink || 0)
      this.recordMetric('rtt', connection.rtt || 0)
      
      // Log connection type for analysis
      console.log(`🌐 Network: ${connection.effectiveType}, Downlink: ${connection.downlink}Mbps, RTT: ${connection.rtt}ms`)
    }
  }
  
  private monitorErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        timestamp: Date.now(),
        environment: this.environment,
        sessionId: this.sessionId,
        severity: 'high'
      })
    })
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        url: window.location.href,
        timestamp: Date.now(),
        environment: this.environment,
        sessionId: this.sessionId,
        severity: 'high'
      })
    })
  }
  
  private monitorAuthPerformance() {
    // This will be called by auth functions
    window.addEventListener('auth-check-start', () => {
      this.recordMetric('authCheckStart', Date.now())
    })
    
    window.addEventListener('auth-check-complete', (event: any) => {
      const startTime = this.getMetric('authCheckStart')
      if (startTime) {
        this.recordMetric('authCheckTime', Date.now() - startTime)
        console.log(`🔐 Auth check completed in ${Date.now() - startTime}ms`)
      }
    })
  }
  
  public recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      environment: this.environment,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.sessionId
    }
    
    this.metrics.push(metric)
    
    // Log important metrics immediately
    if (['fcp', 'lcp', 'ttfb', 'authCheckTime'].includes(name)) {
      console.log(`📊 ${name.toUpperCase()}: ${value.toFixed(2)}ms [${this.environment}]`)
    }
  }
  
  public recordError(error: ErrorMetric) {
    this.errors.push(error)
    console.error(`🚨 Error [${error.type}]:`, error.message)
    
    // Send critical errors immediately
    if (error.severity === 'critical') {
      this.sendErrorToAnalytics(error)
    }
  }
  
  public getMetric(name: string): number | undefined {
    const metric = this.metrics.find(m => m.name === name)
    return metric?.value
  }
  
  public getPageLoadMetrics(): PageLoadMetrics {
    return {
      fcp: this.getMetric('fcp'),
      lcp: this.getMetric('lcp'),
      fid: this.getMetric('fid'),
      cls: this.getMetric('cls'),
      ttfb: this.getMetric('ttfb'),
      domContentLoaded: this.getMetric('domContentLoaded'),
      windowLoad: this.getMetric('windowLoad'),
      authCheckTime: this.getMetric('authCheckTime'),
      jsSize: this.getMetric('jsSize'),
      cssSize: this.getMetric('cssSize'),
      imageSize: this.getMetric('imageSize'),
      totalSize: this.getMetric('totalSize'),
      downlink: this.getMetric('downlink'),
      rtt: this.getMetric('rtt')
    }
  }
  
  private startMetricReporting() {
    // Send metrics every 30 seconds
    setInterval(() => {
      this.sendMetricsToAnalytics()
    }, 30000)
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetricsToAnalytics()
    })
  }
  
  private async sendMetricsToAnalytics() {
    if (this.metrics.length === 0) return
    
    try {
      const payload = {
        sessionId: this.sessionId,
        environment: this.environment,
        metrics: this.metrics,
        errors: this.errors,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      // Send to our analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      // Clear sent metrics
      this.metrics = []
      this.errors = []
      
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }
  
  private async sendErrorToAnalytics(error: ErrorMetric) {
    try {
      await fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      })
    } catch (e) {
      console.error('Failed to send error to analytics:', e)
    }
  }
  
  // Public methods for manual tracking
  public startTimer(name: string): () => void {
    const startTime = Date.now()
    return () => {
      this.recordMetric(name, Date.now() - startTime)
    }
  }
  
  public trackComponentLoad(componentName: string, loadTime: number) {
    this.recordMetric(`component_${componentName}`, loadTime)
    console.log(`🧩 Component ${componentName} loaded in ${loadTime}ms`)
  }
  
  public trackApiCall(endpoint: string, responseTime: number, status: number) {
    this.recordMetric(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, responseTime)
    console.log(`🌐 API ${endpoint}: ${responseTime}ms (${status})`)
    
    if (status >= 400) {
      this.recordError({
        type: 'api',
        message: `API Error: ${endpoint} returned ${status}`,
        url: endpoint,
        timestamp: Date.now(),
        environment: this.environment,
        sessionId: this.sessionId,
        severity: status >= 500 ? 'high' : 'medium'
      })
    }
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

export type { PerformanceMetric, PageLoadMetrics, ErrorMetric }
