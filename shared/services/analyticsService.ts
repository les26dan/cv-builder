/**
 * CV Builder Analytics Service - Statsig Integration
 * Centralized event tracking service following CV Builder development tenets
 * 
 * Features:
 * - Statsig integration for event tracking and experimentation
 * - Integration with existing monitoring system
 * - Offline event queuing and batching
 * - Privacy-compliant data collection
 * - Performance optimized event processing
 */

import { StatsigClient } from '@statsig/js-client';
import { 
  statsigConfig, 
  StatsigUser, 
  BaseEventProperties, 
  StatsigEventName, 
  STATSIG_EVENTS,
  getStatsigInitConfig,
  getDeviceInfo,
  getUTMParameters,
  generateSessionId,
  validateEventProperties
} from '../../config/statsig';
import { monitoring } from '../../config/monitoring';
import { detectLanguage } from '../../config/languageConfig';

/**
 * Analytics Service Class
 * Singleton pattern for consistent tracking across the application
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private statsigClient: StatsigClient | null = null;
  private isInitialized = false;
  private eventQueue: Array<{ event: string; properties: Record<string, any> }> = [];
  private sessionId: string;
  private currentUser: StatsigUser | null = null;
  private baseProperties: Partial<BaseEventProperties> = {};

  private constructor() {
    this.sessionId = generateSessionId();
    this.initializeBaseProperties();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize the analytics service
   */
  public async initialize(user?: StatsigUser): Promise<void> {
    if (!statsigConfig.enabled) {
      console.log('[ANALYTICS] Statsig tracking disabled');
      return;
    }

    if (this.isInitialized) {
      console.log('[ANALYTICS] Already initialized');
      return;
    }

    // Ensure we have the environment variables
    if (!statsigConfig.sdkKey || statsigConfig.sdkKey === 'client-key-placeholder') {
      console.warn('[ANALYTICS] Statsig SDK key not configured, skipping initialization');
      return;
    }

    if (typeof window === 'undefined') {
      console.log('[ANALYTICS] Server-side environment, skipping initialization');
      return;
    }

    try {
      // Initialize Statsig client
      this.statsigClient = new StatsigClient(
        statsigConfig.sdkKey,
        user || { userID: 'anonymous' },
        getStatsigInitConfig()
      );

      await this.statsigClient.initializeAsync();
      
      this.currentUser = user || null;
      this.isInitialized = true;
      
      // Process any queued events
      await this.processEventQueue();
      
      // Set up event listeners for browser events
      this.setupEventListeners();
      
      console.log('[ANALYTICS] Statsig initialized successfully');
      
      // Track initialization
      this.track(STATSIG_EVENTS.FEATURE_ADOPTION, {
        feature_name: 'analytics_service',
        adoption_method: 'initialization'
      });

    } catch (error) {
      console.error('[ANALYTICS] Failed to initialize Statsig:', error);
      
      // Report to existing monitoring system
      monitoring.errorTracking.captureException(error as Error, {
        service: 'analytics',
        operation: 'initialization'
      });
    }
  }

  /**
   * Set up browser event listeners for page unload and visibility
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Set up page unload handler to flush events
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
    
    // Track page visibility for engagement metrics
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  /**
   * Initialize base properties that are included with every event
   */
  private initializeBaseProperties(): void {
    if (typeof window === 'undefined') return;

    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParameters();
    const { language } = detectLanguage();

    this.baseProperties = {
      ...deviceInfo,
      ...utmParams,
      language: language as 'vi' | 'en',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: statsigConfig.environment,
      session_id: this.sessionId,
      page_url: window.location.href,
      referrer_url: document.referrer || undefined,
      is_authenticated: false, // Will be updated when user logs in
      timestamp: new Date().toISOString()
    };

    // Skip location info to avoid rate limiting
    // this.enrichWithLocationData();
  }

  /**
   * Enrich base properties with location data
   */
  private async enrichWithLocationData(): Promise<void> {
    try {
      // Use a simple IP geolocation service (privacy-friendly)
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.baseProperties.country = data.country_code || 'unknown';
        this.baseProperties.city = data.city || undefined;
      }
    } catch (error) {
      // Silently fail - location is not critical
      console.debug('[ANALYTICS] Location enrichment failed:', error);
    }
  }

  /**
   * Update user information
   */
  public updateUser(user: StatsigUser): void {
    this.currentUser = user;
    this.baseProperties.user_id = user.userID;
    this.baseProperties.is_authenticated = !!user.userID && user.userID !== 'anonymous';
    this.baseProperties.user_type = user.custom?.isReturning ? 'returning' : 'new';

    if (this.statsigClient && this.isInitialized) {
      this.statsigClient.updateUserAsync(user);
    }
  }

  /**
   * Track an event with Statsig
   */
  public track(
    eventName: StatsigEventName | string, 
    properties: Record<string, any> = {}
  ): void {
    const eventData = {
      ...this.baseProperties,
      ...properties,
      timestamp: new Date().toISOString()
    };

    // Validate event properties
    if (!validateEventProperties(eventData)) {
      console.warn('[ANALYTICS] Invalid event properties:', eventData);
      return;
    }

    if (!this.isInitialized || !this.statsigClient) {
      // Queue event for later processing
      this.eventQueue.push({ event: eventName, properties: eventData });
      console.debug('[ANALYTICS] Event queued:', eventName);
      return;
    }

    try {
      // Convert all values to strings for Statsig metadata
      const statsigMetadata: Record<string, string> = {};
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          statsigMetadata[key] = String(value);
        }
      });
      
      // Track with Statsig (correct signature: eventName, value, metadata)
      this.statsigClient.logEvent(eventName, undefined, statsigMetadata);
      
      // Also track with existing monitoring system for continuity
      monitoring.analytics.track(eventName, eventData);
      
      console.log('[ANALYTICS] Event tracked to Statsig:', {
        eventName,
        originalData: eventData,
        statsigMetadata,
        user: this.currentUser
      });

    } catch (error) {
      console.error('[ANALYTICS] Failed to track event:', error);
      
      // Report to monitoring system
      monitoring.errorTracking.captureException(error as Error, {
        service: 'analytics',
        operation: 'track_event',
        event_name: eventName
      });
    }
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    console.log(`[ANALYTICS] Processing ${this.eventQueue.length} queued events`);

    for (const { event, properties } of this.eventQueue) {
      this.track(event, properties);
    }

    this.eventQueue = [];
  }

  /**
   * Track page view with enhanced context
   */
  public trackPageView(pageName: string, additionalProperties: Record<string, any> = {}): void {
    const pageProperties = {
      page_name: pageName,
      page_url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      referrer_url: typeof document !== 'undefined' ? document.referrer : undefined,
      ...additionalProperties
    };

    this.track('page_viewed_' + pageName.toLowerCase().replace(/\s+/g, '_'), pageProperties);
  }

  /**
   * Track conversion events with enhanced metrics
   */
  public trackConversion(
    goalName: string, 
    value?: number, 
    currency?: string, 
    additionalProperties: Record<string, any> = {}
  ): void {
    const conversionProperties = {
      conversion_goal: goalName,
      conversion_value: value,
      conversion_currency: currency || 'USD',
      ...additionalProperties
    };

    this.track(STATSIG_EVENTS.USER_JOURNEY_COMPLETED, conversionProperties);
  }

  /**
   * Track user interactions with detailed context
   */
  public trackInteraction(
    element: string,
    action: string,
    context: string,
    additionalProperties: Record<string, any> = {}
  ): void {
    const interactionProperties = {
      element_type: element,
      action_type: action,
      interaction_context: context,
      ...additionalProperties
    };

    this.track(`interaction_${element}_${action}`.toLowerCase(), interactionProperties);
  }

  /**
   * Track errors with enhanced context
   */
  public trackError(
    errorType: string,
    errorMessage: string,
    context: Record<string, any> = {}
  ): void {
    const errorProperties = {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context,
      page_url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    this.track('error_' + errorType.toLowerCase(), errorProperties);
    
    // Also report to existing error tracking
    monitoring.errorTracking.captureException(new Error(errorMessage), {
      errorType,
      ...context
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    metricName: string,
    value: number,
    threshold?: number,
    additionalProperties: Record<string, any> = {}
  ): void {
    const performanceProperties = {
      metric_name: metricName,
      metric_value: value,
      threshold_value: threshold,
      threshold_exceeded: threshold ? value > threshold : false,
      ...additionalProperties
    };

    this.track(STATSIG_EVENTS.PERFORMANCE_SLOW, performanceProperties);
  }

  /**
   * Track form interactions
   */
  public trackFormEvent(
    formName: string,
    eventType: 'started' | 'completed' | 'abandoned' | 'error',
    additionalProperties: Record<string, any> = {}
  ): void {
    const formProperties = {
      form_name: formName,
      form_event_type: eventType,
      ...additionalProperties
    };

    this.track(`form_${eventType}_${formName}`.toLowerCase(), formProperties);
  }

  /**
   * Flush any pending events (call before page unload)
   */
  public async flush(): Promise<void> {
    if (this.statsigClient && this.isInitialized) {
      try {
        await this.statsigClient.flush();
        console.debug('[ANALYTICS] Events flushed successfully');
      } catch (error) {
        console.error('[ANALYTICS] Failed to flush events:', error);
      }
    }
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): { sessionId: string; user: StatsigUser | null } {
    return {
      sessionId: this.sessionId,
      user: this.currentUser
    };
  }

  /**
   * Reset session (useful for testing or user logout)
   */
  public resetSession(): void {
    this.sessionId = generateSessionId();
    this.baseProperties.session_id = this.sessionId;
    this.baseProperties.timestamp = new Date().toISOString();
  }

  /**
   * Check if analytics is enabled and working
   */
  public isEnabled(): boolean {
    return statsigConfig.enabled && this.isInitialized;
  }

  /**
   * Get debug information about the service
   */
  public getDebugInfo(): {
    isInitialized: boolean;
    isEnabled: boolean;
    queuedEvents: number;
    sessionId: string;
    user: StatsigUser | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isEnabled: statsigConfig.enabled,
      queuedEvents: this.eventQueue.length,
      sessionId: this.sessionId,
      user: this.currentUser
    };
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Make analytics available globally for debugging (client-side only)
if (typeof window !== 'undefined') {
  (window as any).analytics = analytics;
}

// Initialize on first use (client-side only)
// Note: Initialization will be handled by usePageView hooks and page components

export default analytics;