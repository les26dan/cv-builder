/**
 * OkBuddy Server-side Analytics Service - Statsig Integration
 * Server-side event tracking service for backend operations
 * 
 * Features:
 * - Server-side Statsig integration for API and backend event tracking
 * - Performance monitoring for database operations and API calls
 * - CV processing pipeline analytics
 * - Authentication flow tracking
 * - Error monitoring and alerting
 */

import Statsig, { StatsigUser as StatsigNodeUser } from 'statsig-node';
import { 
  statsigConfig, 
  StatsigUser, 
  BaseEventProperties, 
  StatsigEventName, 
  STATSIG_EVENTS
} from '../../config/statsig';
import { monitoring } from '../../config/monitoring';

/**
 * Server-side specific event properties
 */
export interface ServerEventProperties extends Partial<BaseEventProperties> {
  // Server Context
  server_timestamp?: string;
  request_id?: string;
  user_agent?: string;
  ip_address?: string;
  
  // API Context
  endpoint?: string;
  method?: string;
  status_code?: number;
  response_time_ms?: number;
  
  // Database Context
  query_type?: string;
  table_name?: string;
  query_duration_ms?: number;
  
  // CV Processing Context
  file_size_bytes?: number;
  processing_duration_ms?: number;
  ai_model_used?: string;
  ai_tokens_consumed?: number;
  
  // Authentication Context
  auth_provider?: string;
  session_duration_ms?: number;
  
  // Error Context
  error_type?: string;
  error_message?: string;
  stack_trace?: string;
  
  // Allow additional dynamic properties
  [key: string]: any;
}

/**
 * Server Analytics Service Class
 * Singleton pattern for consistent server-side tracking
 */
export class ServerAnalyticsService {
  private static instance: ServerAnalyticsService;
  private isInitialized = false;
  private eventQueue: Array<{ event: string; user: StatsigNodeUser; properties: Record<string, any> }> = [];

  private constructor() {
    // Initialize immediately on server startup
    this.initialize().catch((error) => {
      console.error('[SERVER ANALYTICS] Failed to initialize:', error);
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServerAnalyticsService {
    if (!ServerAnalyticsService.instance) {
      ServerAnalyticsService.instance = new ServerAnalyticsService();
    }
    return ServerAnalyticsService.instance;
  }

  /**
   * Initialize the server analytics service
   */
  public async initialize(): Promise<void> {
    if (!statsigConfig.enabled || !statsigConfig.server?.enabled) {
      console.log('[SERVER ANALYTICS] Server-side tracking disabled');
      return;
    }

    if (this.isInitialized) {
      console.log('[SERVER ANALYTICS] Already initialized');
      return;
    }

    // Ensure we have the server secret key
    if (!statsigConfig.serverSecretKey || statsigConfig.serverSecretKey === 'secret-key-placeholder') {
      console.warn('[SERVER ANALYTICS] Statsig server secret key not configured, skipping initialization');
      return;
    }

    try {
      // Initialize Statsig server SDK
      await Statsig.initialize(statsigConfig.serverSecretKey, {
        environment: {
          tier: statsigConfig.environment
        }
      });

      this.isInitialized = true;
      
      // Process any queued events
      await this.processEventQueue();
      
      console.log('[SERVER ANALYTICS] Statsig server SDK initialized successfully');
      
      // Track initialization event
      this.track(STATSIG_EVENTS.FEATURE_ADOPTION, 
        { userID: 'system' }, 
        {
          feature_name: 'server_analytics_service',
          adoption_method: 'initialization',
          server_timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('[SERVER ANALYTICS] Failed to initialize Statsig:', error);
      
      // Report to existing monitoring system
      monitoring.errorTracking.captureException(error as Error, {
        service: 'server_analytics',
        operation: 'initialization'
      });
    }
  }

  /**
   * Track a server-side event with Statsig
   */
  public track(
    eventName: StatsigEventName | string,
    user: StatsigNodeUser | { userID: string },
    properties: ServerEventProperties = {}
  ): void {
    const eventData: ServerEventProperties = {
      ...properties,
      server_timestamp: new Date().toISOString(),
      environment: statsigConfig.environment,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };

    if (!this.isInitialized) {
      // Queue event for later processing
      this.eventQueue.push({ event: eventName, user, properties: eventData });
      console.debug('[SERVER ANALYTICS] Event queued:', eventName);
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
      
      // Track with Statsig server SDK
      Statsig.logEvent(user, eventName, undefined, statsigMetadata);
      
      // Also track with existing monitoring system for continuity
      monitoring.analytics.track(eventName, eventData);
      
      console.log('[SERVER ANALYTICS] Event tracked to Statsig:', {
        eventName,
        user: user.userID,
        originalData: eventData,
        statsigMetadata
      });

    } catch (error) {
      console.error('[SERVER ANALYTICS] Failed to track event:', error);
      
      // Report to monitoring system
      monitoring.errorTracking.captureException(error as Error, {
        service: 'server_analytics',
        operation: 'track_event',
        event_name: eventName
      });
    }
  }

  /**
   * Track API request metrics
   */
  public trackAPIRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    user?: StatsigNodeUser,
    additionalProperties?: Record<string, any>
  ): void {
    const eventName = statusCode >= 400 
      ? STATSIG_EVENTS.API_REQUEST_FAILED 
      : STATSIG_EVENTS.API_REQUEST_COMPLETED;

    this.track(eventName, user || { userID: 'anonymous' }, {
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ...additionalProperties
    });
  }

  /**
   * Track database operations
   */
  public trackDatabaseOperation(
    queryType: string,
    tableName: string,
    durationMs: number,
    success: boolean,
    user?: StatsigNodeUser,
    additionalProperties?: Record<string, any>
  ): void {
    const eventName = success 
      ? STATSIG_EVENTS.DATABASE_QUERY_EXECUTED 
      : STATSIG_EVENTS.DATABASE_QUERY_FAILED;

    this.track(eventName, user || { userID: 'system' }, {
      query_type: queryType,
      table_name: tableName,
      query_duration_ms: durationMs,
      ...additionalProperties
    });
  }

  /**
   * Track CV processing operations
   */
  public trackCVProcessing(
    operation: 'parsing' | 'analysis' | 'upload' | 'download',
    success: boolean,
    user: StatsigNodeUser,
    processingTimeMs?: number,
    fileSizeBytes?: number,
    aiModel?: string,
    tokensConsumed?: number,
    errorMessage?: string
  ): void {
    let eventName: string;
    
    switch (operation) {
      case 'parsing':
        eventName = success ? STATSIG_EVENTS.CV_PARSING_COMPLETED : STATSIG_EVENTS.CV_PARSING_FAILED;
        break;
      case 'analysis':
        eventName = success ? STATSIG_EVENTS.AI_ANALYSIS_COMPLETED : STATSIG_EVENTS.AI_ANALYSIS_FAILED;
        break;
      case 'upload':
        eventName = STATSIG_EVENTS.CV_BLOB_UPLOADED;
        break;
      case 'download':
        eventName = STATSIG_EVENTS.CV_BLOB_DOWNLOAD;
        break;
      default:
        eventName = 'cv_processing_unknown';
    }

    this.track(eventName, user, {
      processing_duration_ms: processingTimeMs,
      file_size_bytes: fileSizeBytes,
      ai_model_used: aiModel,
      ai_tokens_consumed: tokensConsumed,
      error_message: errorMessage,
      success: success
    });
  }

  /**
   * Track authentication events
   */
  public trackAuthEvent(
    eventType: 'token_generated' | 'token_validated' | 'session_created' | 'session_expired' | 'oauth_callback',
    user: StatsigNodeUser,
    authProvider?: string,
    sessionDurationMs?: number,
    success: boolean = true,
    errorMessage?: string
  ): void {
    let eventName: string;
    
    switch (eventType) {
      case 'token_generated':
        eventName = STATSIG_EVENTS.AUTH_TOKEN_GENERATED;
        break;
      case 'token_validated':
        eventName = STATSIG_EVENTS.AUTH_TOKEN_VALIDATED;
        break;
      case 'session_created':
        eventName = STATSIG_EVENTS.AUTH_SESSION_CREATED;
        break;
      case 'session_expired':
        eventName = STATSIG_EVENTS.AUTH_SESSION_EXPIRED;
        break;
      case 'oauth_callback':
        eventName = STATSIG_EVENTS.OAUTH_CALLBACK_PROCESSED;
        break;
      default:
        eventName = 'auth_event_unknown';
    }

    this.track(eventName, user, {
      auth_provider: authProvider,
      session_duration_ms: sessionDurationMs,
      success: success,
      error_message: errorMessage
    });
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    console.log(`[SERVER ANALYTICS] Processing ${this.eventQueue.length} queued events`);
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const { event, user, properties } of events) {
      this.track(event, user, properties);
    }
  }

  /**
   * Flush all pending events (useful for graceful shutdown)
   */
  public async flush(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      await Statsig.flush();
      console.log('[SERVER ANALYTICS] All events flushed successfully');
    } catch (error) {
      console.error('[SERVER ANALYTICS] Failed to flush events:', error);
    }
  }

  /**
   * Shutdown the analytics service
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      await this.flush();
      await Statsig.shutdown();
      this.isInitialized = false;
      console.log('[SERVER ANALYTICS] Service shutdown successfully');
    } catch (error) {
      console.error('[SERVER ANALYTICS] Failed to shutdown service:', error);
    }
  }
}

// Export singleton instance
export const serverAnalytics = ServerAnalyticsService.getInstance();

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[SERVER ANALYTICS] Received SIGTERM, shutting down gracefully...');
    await serverAnalytics.shutdown();
  });

  process.on('SIGINT', async () => {
    console.log('[SERVER ANALYTICS] Received SIGINT, shutting down gracefully...');
    await serverAnalytics.shutdown();
  });
}

export default serverAnalytics;