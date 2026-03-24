/**
 * Performance monitoring utilities for tracking loading times and user experience
 */

interface PerformanceMetrics {
  loadTime: number;
  authCheckTime: number;
  bundleSize: string;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track page load performance
   */
  trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`🚀 Page Load Time: ${loadTime}ms`);
    
    // Track to analytics if available
    if (window.gtag) {
      window.gtag('event', 'page_load_performance', {
        custom_parameter: loadTime
      });
    }
  }

  /**
   * Track authentication check performance
   */
  trackAuthCheck(startTime: number, success: boolean): void {
    const authCheckTime = Date.now() - startTime;
    console.log(`🔐 Auth Check Time: ${authCheckTime}ms, Success: ${success}`);
    
    if (window.gtag) {
      window.gtag('event', 'auth_check_performance', {
        custom_parameter: authCheckTime,
        success: success
      });
    }
  }

  /**
   * Track bundle loading performance
   */
  trackBundleLoad(bundleName: string): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(bundleName)) {
          console.log(`📦 Bundle ${bundleName} Load Time: ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure'] });
  }

  /**
   * Get performance insights for debugging
   */
  getPerformanceInsights(): {
    isSlowConnection: boolean;
    recommendDynamicImports: boolean;
    authCheckIssues: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        isSlowConnection: false,
        recommendDynamicImports: false,
        authCheckIssues: false
      };
    }

    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    const recommendDynamicImports = loadTime > 3000; // Slow initial load
    
    return {
      isSlowConnection,
      recommendDynamicImports,
      authCheckIssues: false // Would be determined by auth failure patterns
    };
  }

  /**
   * Log performance summary for debugging
   */
  logPerformanceSummary(): void {
    if (typeof window === 'undefined') return;

    console.group('🎯 Performance Summary');
    
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const firstPaint = performance.getEntriesByType('paint')[0];
    
    console.log(`Total Load Time: ${loadTime}ms`);
    console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
    if (firstPaint) {
      console.log(`First Paint: ${firstPaint.startTime}ms`);
    }
    
    const insights = this.getPerformanceInsights();
    console.log('Performance Insights:', insights);
    
    console.groupEnd();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * React hook for performance monitoring
 */
export const usePerformanceTracking = () => {
  const trackAuthCheck = (startTime: number, success: boolean) => {
    performanceMonitor.trackAuthCheck(startTime, success);
  };

  const trackPageLoad = () => {
    performanceMonitor.trackPageLoad();
  };

  return {
    trackAuthCheck,
    trackPageLoad,
    getInsights: () => performanceMonitor.getPerformanceInsights(),
    logSummary: () => performanceMonitor.logPerformanceSummary()
  };
};
