/**
 * CV Builder Account Creation & Login - Monitoring Configuration
 * Production monitoring and analytics setup for OAuth integration
 */

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: {
      captureException: (error: Error, context?: { extra?: Record<string, any> }) => void;
    };
  }
}

export interface MonitoringConfig {
  analytics: {
    enabled: boolean;
    googleAnalyticsId?: string;
    trackingEvents: string[];
  };
  errorTracking: {
    enabled: boolean;
    sentryDsn?: string;
    environment: string;
  };
  performance: {
    enabled: boolean;
    thresholds: {
      oauthFlowDuration: number;
      apiResponseTime: number;
      pageLoadTime: number;
    };
  };
  security: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    auditEvents: string[];
  };
}

export const monitoringConfig: MonitoringConfig = {
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    trackingEvents: [
      'oauth_flow_started',
      'oauth_flow_completed',
      'oauth_flow_failed',
      'social_login_clicked',
      'account_created',
      'account_linked',
      'cross_app_navigation',
      'authentication_success',
      'authentication_failure'
    ]
  },
  errorTracking: {
    enabled: process.env.NODE_ENV === 'production',
    sentryDsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  },
  performance: {
    enabled: true,
    thresholds: {
      oauthFlowDuration: 10000, // 10 seconds
      apiResponseTime: 2000,    // 2 seconds
      pageLoadTime: 3000        // 3 seconds
    }
  },
  security: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    auditEvents: [
      'oauth_flow_started',
      'oauth_callback_received',
      'account_linking_attempted',
      'security_violation_detected',
      'rate_limit_exceeded',
      'suspicious_activity'
    ]
  }
};

/**
 * Analytics tracking functions
 */
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (!monitoringConfig.analytics.enabled) return;
    
    // Google Analytics 4 tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        ...properties,
        timestamp: new Date().toISOString()
      });
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ANALYTICS] ${event}:`, properties);
    }
  },

  trackOAuthFlow: (provider: 'google' | 'linkedin', stage: 'started' | 'completed' | 'failed', details?: Record<string, any>) => {
    analytics.track('oauth_flow_' + stage, {
      provider,
      stage,
      ...details
    });
  },

  trackSocialLogin: (provider: 'google' | 'linkedin', success: boolean, details?: Record<string, any>) => {
    analytics.track('social_login_clicked', {
      provider,
      success,
      ...details
    });
  },

  trackAccountCreation: (method: 'google' | 'linkedin' | 'email', details?: Record<string, any>) => {
    analytics.track('account_created', {
      method,
      ...details
    });
  },

  trackCrossAppNavigation: (from: string, to: string, userType: 'new' | 'existing') => {
    analytics.track('cross_app_navigation', {
      from,
      to,
      userType,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Performance monitoring functions
 */
export const performance = {
  measureOAuthFlow: (provider: 'google' | 'linkedin', startTime: number) => {
    const duration = Date.now() - startTime;
    
    if (duration > monitoringConfig.performance.thresholds.oauthFlowDuration) {
      console.warn(`[PERFORMANCE] OAuth flow for ${provider} took ${duration}ms (threshold: ${monitoringConfig.performance.thresholds.oauthFlowDuration}ms)`);
    }
    
    analytics.track('oauth_flow_performance', {
      provider,
      duration,
      threshold: monitoringConfig.performance.thresholds.oauthFlowDuration,
      exceeded: duration > monitoringConfig.performance.thresholds.oauthFlowDuration
    });
  },

  measureApiResponse: (endpoint: string, startTime: number) => {
    const duration = Date.now() - startTime;
    
    if (duration > monitoringConfig.performance.thresholds.apiResponseTime) {
      console.warn(`[PERFORMANCE] API ${endpoint} took ${duration}ms (threshold: ${monitoringConfig.performance.thresholds.apiResponseTime}ms)`);
    }
    
    analytics.track('api_response_time', {
      endpoint,
      duration,
      threshold: monitoringConfig.performance.thresholds.apiResponseTime,
      exceeded: duration > monitoringConfig.performance.thresholds.apiResponseTime
    });
  }
};

/**
 * Security monitoring functions
 */
export const security = {
  logSecurityEvent: (event: string, details: Record<string, any>) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    if (monitoringConfig.security.enabled) {
      console.log(`[SECURITY] ${event}:`, logData);
    }
    
    // Track in analytics for security monitoring
    analytics.track('security_event', logData);
  },

  logOAuthAttempt: (provider: 'google' | 'linkedin', success: boolean, details?: Record<string, any>) => {
    security.logSecurityEvent('oauth_attempt', {
      provider,
      success,
      ...details
    });
  },

  logSuspiciousActivity: (activity: string, details: Record<string, any>) => {
    security.logSecurityEvent('suspicious_activity', {
      activity,
      severity: 'high',
      ...details
    });
  },

  logRateLimitExceeded: (endpoint: string, ip: string) => {
    security.logSecurityEvent('rate_limit_exceeded', {
      endpoint,
      ip,
      severity: 'medium'
    });
  }
};

/**
 * Error tracking functions
 */
export const errorTracking = {
  captureException: (error: Error, context?: Record<string, any>) => {
    if (!monitoringConfig.errorTracking.enabled) return;
    
    // Sentry integration
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        extra: context
      });
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${error.message}:`, error, context);
    }
  },

  captureOAuthError: (provider: 'google' | 'linkedin', error: Error, stage: string) => {
    errorTracking.captureException(error, {
      provider,
      stage,
      errorType: 'oauth_error'
    });
  },

  captureApiError: (endpoint: string, error: Error, requestData?: Record<string, any>) => {
    errorTracking.captureException(error, {
      endpoint,
      requestData,
      errorType: 'api_error'
    });
  }
};

/**
 * Health check functions
 */
export const healthCheck = {
  checkOAuthProviders: async () => {
    const results = {
      google: false,
      linkedin: false,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Check Google OAuth endpoint
      const googleResponse = await fetch('/api/auth/google/signin', { method: 'HEAD' });
      results.google = googleResponse.status === 200;
    } catch (error) {
      results.google = false;
    }
    
    try {
      // Check LinkedIn OAuth endpoint
      const linkedinResponse = await fetch('/api/auth/linkedin/signin', { method: 'HEAD' });
      results.linkedin = linkedinResponse.status === 200;
    } catch (error) {
      results.linkedin = false;
    }
    
    return results;
  },

  checkDatabase: async () => {
    try {
      // This would typically check Supabase connectivity
      const response = await fetch('/api/health/database');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

/**
 * Deployment monitoring functions
 */
export const deployment = {
  trackDeployment: (version: string, environment: string) => {
    analytics.track('deployment_completed', {
      version,
      environment,
      timestamp: new Date().toISOString()
    });
  },

  trackFeatureFlag: (flag: string, enabled: boolean) => {
    analytics.track('feature_flag_toggled', {
      flag,
      enabled,
      timestamp: new Date().toISOString()
    });
  }
};

// Global error handler for unhandled promises
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.captureException(new Error(event.reason), {
      errorType: 'unhandled_promise_rejection'
    });
  });
}

// Export all monitoring functions
export const monitoring = {
  analytics,
  performance,
  security,
  errorTracking,
  healthCheck,
  deployment,
  config: monitoringConfig
};

export default monitoring; 