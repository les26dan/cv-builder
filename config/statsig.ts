/**
 * Statsig Analytics Configuration for OkBuddy
 * Event tracking and experimentation infrastructure
 * 
 * Following OkBuddy Tenets:
 * - Tenet 2: Rapid Experimentation & Configurability
 * - Tenet 3: Maximize Learning Through Data Collection
 */

import { StatsigClient } from '@statsig/js-client';

export interface StatsigConfig {
  sdkKey: string;
  serverSecretKey?: string;
  environment: 'production' | 'staging' | 'development';
  enabled: boolean;
  userProperties: {
    includeDeviceInfo: boolean;
    includeBrowserInfo: boolean;
    includeLocationInfo: boolean;
  };
  eventBuffering: {
    enabled: boolean;
    maxBatchSize: number;
    flushIntervalMs: number;
  };
  server?: {
    enabled: boolean;
    batchSize: number;
    flushIntervalMs: number;
  };
}

export const statsigConfig: StatsigConfig = {
  sdkKey: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || 'client-key-placeholder',
  serverSecretKey: process.env.STATSIG_SERVER_SECRET_KEY,
  environment: (process.env.NODE_ENV as 'production' | 'staging' | 'development') || 'development',
  enabled: process.env.NEXT_PUBLIC_STATSIG_ENABLED !== 'false',
  userProperties: {
    includeDeviceInfo: true,
    includeBrowserInfo: true,
    includeLocationInfo: true, // For market analysis (VN/US/SG/JP)
  },
  eventBuffering: {
    enabled: true,
    maxBatchSize: 50, // Batch events for performance
    flushIntervalMs: 5000, // 5 second intervals
  },
  server: {
    enabled: true,
    batchSize: 100, // Larger batches for server-side efficiency
    flushIntervalMs: 10000, // 10 second intervals for server events
  }
};

/**
 * User identification interface for Statsig
 */
export interface StatsigUser {
  userID?: string;
  email?: string;
  country?: string;
  city?: string;
  appVersion?: string;
  language?: 'vi' | 'en';
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  operatingSystem?: string;
  custom?: Record<string, any>;
}

/**
 * Base event properties that should be included with every event
 */
export interface BaseEventProperties {
  // Device & Environment
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  browser_version: string;
  operating_system: string;
  os_version: string;
  screen_resolution: string;
  viewport_size: string;
  
  // Location & Language
  language: 'vi' | 'en';
  country: string;
  city?: string;
  
  // App Context
  app_version: string;
  environment: 'production' | 'staging' | 'development';
  session_id: string;
  timestamp: string;
  
  // User Context
  user_id?: string;
  is_authenticated: boolean;
  user_type?: 'new' | 'returning';
  
  // Page Context
  page_url: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/**
 * Event categories for organizing tracking
 */
export const EVENT_CATEGORIES = {
  PAGE_VIEW: 'page_view',
  USER_INTERACTION: 'user_interaction',
  CONVERSION: 'conversion',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  BUSINESS_LOGIC: 'business_logic'
} as const;

/**
 * Standardized event names for consistent tracking
 * Following the pattern: {category}_{action}_{context}
 */
export const STATSIG_EVENTS = {
  // Landing Page Events
  LANDING_PAGE_VIEWED: 'page_viewed_landing',
  HERO_CTA_CLICKED: 'cta_clicked_hero_section',
  PROBLEM_SECTION_VIEWED: 'section_viewed_problem',
  PROBLEM_SECTION_CTA_CLICKED: 'cta_clicked_problem_section',
  TESTIMONIALS_VIEWED: 'section_viewed_testimonials',
  TESTIMONIAL_INTERACTED: 'testimonial_interacted',
  WAITLIST_SIGNUP_STARTED: 'form_started_waitlist_signup',
  WAITLIST_SIGNUP_COMPLETED: 'conversion_completed_waitlist_signup',
  SCROLL_DEPTH_REACHED: 'engagement_scroll_depth_reached',
  EXIT_INTENT_DETECTED: 'engagement_exit_intent_detected',
  
  // Authentication Events
  LOGIN_PAGE_VIEWED: 'page_viewed_login',
  REGISTER_PAGE_VIEWED: 'page_viewed_register',
  LOGIN_STARTED: 'form_started_login',
  LOGIN_COMPLETED: 'conversion_completed_login',
  LOGIN_FAILED: 'error_login_failed',
  REGISTER_STARTED: 'form_started_register',
  REGISTER_COMPLETED: 'conversion_completed_register',
  SOCIAL_LOGIN_CLICKED: 'cta_clicked_social_login',
  OAUTH_FLOW_COMPLETED: 'conversion_completed_oauth',
  OAUTH_FLOW_FAILED: 'error_oauth_failed',
  
  // CV Workspace Events
  WORKSPACE_VIEWED: 'page_viewed_cv_workspace',
  CV_CREATION_STARTED: 'action_started_cv_creation',
  CV_CREATION_COMPLETED: 'conversion_completed_cv_creation',
  CV_CARD_INTERACTED: 'interaction_cv_card',
  CV_CONTINUED: 'action_continued_cv_editing',
  CV_DOWNLOADED: 'conversion_completed_cv_download',
  CV_DELETED: 'action_completed_cv_deletion',
  
  // CV Upload Events
  UPLOAD_PAGE_VIEWED: 'page_viewed_cv_upload',
  CV_FILE_SELECTED: 'action_started_cv_file_upload',
  CV_UPLOAD_COMPLETED: 'conversion_completed_cv_upload',
  CV_UPLOAD_FAILED: 'error_cv_upload_failed',
  JD_INPUT_STARTED: 'form_started_jd_input',
  ANALYSIS_STARTED: 'action_started_cv_jd_analysis',
  ANALYSIS_COMPLETED: 'conversion_completed_cv_analysis',
  ANALYSIS_FAILED: 'error_analysis_failed',
  
  // CV Guided Editing Events
  EDITOR_PAGE_VIEWED: 'page_viewed_cv_editor',
  SECTION_SELECTED: 'interaction_cv_section_selected',
  CONTENT_EDITED: 'action_content_edited',
  AI_SUGGESTION_VIEWED: 'interaction_ai_suggestion_viewed',
  AI_SUGGESTION_ACCEPTED: 'action_ai_suggestion_accepted',
  AI_SUGGESTION_REJECTED: 'action_ai_suggestion_rejected',
  CV_PREVIEW_VIEWED: 'interaction_cv_preview_viewed',
  AUTO_SAVE_TRIGGERED: 'system_auto_save_triggered',
  
  // Performance & Error Events
  PAGE_LOAD_ERROR: 'error_page_load_failed',
  API_ERROR: 'error_api_request_failed',
  PERFORMANCE_SLOW: 'performance_threshold_exceeded',
  
  // Server-side API Events
  API_REQUEST_RECEIVED: 'server_api_request_received',
  API_REQUEST_COMPLETED: 'server_api_request_completed',
  API_REQUEST_FAILED: 'server_api_request_failed',
  DATABASE_QUERY_EXECUTED: 'server_database_query_executed',
  DATABASE_QUERY_FAILED: 'server_database_query_failed',
  
  // Server-side CV Processing Events
  CV_PARSING_STARTED: 'server_cv_parsing_started',
  CV_PARSING_COMPLETED: 'server_cv_parsing_completed',
  CV_PARSING_FAILED: 'server_cv_parsing_failed',
  CV_BLOB_UPLOADED: 'server_cv_blob_uploaded',
  CV_BLOB_DOWNLOAD: 'server_cv_blob_download',
  AI_ANALYSIS_INITIATED: 'server_ai_analysis_initiated',
  AI_ANALYSIS_COMPLETED: 'server_ai_analysis_completed',
  AI_ANALYSIS_FAILED: 'server_ai_analysis_failed',
  
  // Server-side Authentication Events
  AUTH_TOKEN_GENERATED: 'server_auth_token_generated',
  AUTH_TOKEN_VALIDATED: 'server_auth_token_validated',
  AUTH_SESSION_CREATED: 'server_auth_session_created',
  AUTH_SESSION_EXPIRED: 'server_auth_session_expired',
  OAUTH_CALLBACK_PROCESSED: 'server_oauth_callback_processed',
  PASSWORD_HASH_GENERATED: 'server_password_hash_generated',
  
  // Business Intelligence Events
  USER_JOURNEY_COMPLETED: 'conversion_user_journey_completed',
  FEATURE_ADOPTION: 'engagement_feature_adopted',
  USER_RETENTION: 'engagement_user_returned'
} as const;

/**
 * Export event names type for TypeScript support
 */
export type StatsigEventName = typeof STATSIG_EVENTS[keyof typeof STATSIG_EVENTS];

/**
 * Environment-specific configuration
 */
export function getStatsigInitConfig() {
  return {
    environment: {
      tier: statsigConfig.environment
    },
    api: statsigConfig.sdkKey,
    options: {
      disableNetworkKeepalive: statsigConfig.environment === 'development',
      eventLoggingApi: 'https://prodregistryv2.org/v1/rgstr', // Statsig default
      disableErrorLogging: false,
      disableAutoMetricsLogging: false,
      localModeLogging: statsigConfig.environment === 'development'
    }
  };
}

/**
 * Device detection utilities
 */
export function getDeviceInfo(): Pick<BaseEventProperties, 'device_type' | 'browser' | 'browser_version' | 'operating_system' | 'os_version' | 'screen_resolution' | 'viewport_size'> {
  if (typeof window === 'undefined') {
    return {
      device_type: 'desktop',
      browser: 'unknown',
      browser_version: 'unknown',
      operating_system: 'unknown',
      os_version: 'unknown',
      screen_resolution: 'unknown',
      viewport_size: 'unknown'
    };
  }

  const userAgent = navigator.userAgent;
  
  // Device type detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*tablet)|tablet/i.test(userAgent);
  const device_type: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  // Browser detection
  let browser = 'unknown';
  let browser_version = 'unknown';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browser_version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browser_version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Safari\/([0-9.]+)/);
    browser_version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    browser_version = match ? match[1] : 'unknown';
  }
  
  // Operating system detection
  let operating_system = 'unknown';
  let os_version = 'unknown';
  
  if (userAgent.includes('Windows')) {
    operating_system = 'Windows';
    if (userAgent.includes('Windows NT 10.0')) os_version = '10';
    else if (userAgent.includes('Windows NT 6.3')) os_version = '8.1';
    else if (userAgent.includes('Windows NT 6.2')) os_version = '8';
    else if (userAgent.includes('Windows NT 6.1')) os_version = '7';
  } else if (userAgent.includes('Mac OS X')) {
    operating_system = 'macOS';
    const match = userAgent.match(/Mac OS X ([0-9_]+)/);
    os_version = match ? match[1].replace(/_/g, '.') : 'unknown';
  } else if (userAgent.includes('Android')) {
    operating_system = 'Android';
    const match = userAgent.match(/Android ([0-9.]+)/);
    os_version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    operating_system = 'iOS';
    const match = userAgent.match(/OS ([0-9_]+)/);
    os_version = match ? match[1].replace(/_/g, '.') : 'unknown';
  }
  
  return {
    device_type,
    browser,
    browser_version,
    operating_system,
    os_version,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`
  };
}

/**
 * URL parameter extraction for UTM tracking
 */
export function getUTMParameters(): Pick<BaseEventProperties, 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term'> {
  if (typeof window === 'undefined') {
    return {
      utm_source: undefined,
      utm_medium: undefined,
      utm_campaign: undefined,
      utm_content: undefined,
      utm_term: undefined
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined
  };
}

/**
 * Generate session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validation function for event properties
 */
export function validateEventProperties(properties: Record<string, any>): boolean {
  // Ensure required properties are present
  const requiredProps = ['device_type', 'language', 'app_version', 'session_id', 'timestamp'];
  
  return requiredProps.every(prop => prop in properties && properties[prop] !== undefined);
}