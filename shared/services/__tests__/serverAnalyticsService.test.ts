/**
 * Server Analytics Service Test
 * Basic test to validate our Statsig server-side analytics implementation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Statsig to avoid external dependencies in tests
jest.mock('statsig-node', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  logEvent: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
  shutdown: jest.fn().mockResolvedValue(true),
}));

// Mock our config
jest.mock('../../../config/statsig', () => ({
  statsigConfig: {
    enabled: true,
    serverSecretKey: 'test-secret-key',
    environment: 'test',
    server: {
      enabled: true,
      batchSize: 10,
      flushIntervalMs: 5000,
    },
  },
  STATSIG_EVENTS: {
    FEATURE_ADOPTION: 'engagement_feature_adopted',
    API_REQUEST_RECEIVED: 'server_api_request_received',
    API_REQUEST_COMPLETED: 'server_api_request_completed',
    CV_PARSING_COMPLETED: 'server_cv_parsing_completed',
  },
}));

// Mock monitoring
jest.mock('../../../config/monitoring', () => ({
  monitoring: {
    errorTracking: {
      captureException: jest.fn(),
    },
    analytics: {
      track: jest.fn(),
    },
  },
}));

import { ServerAnalyticsService } from '../serverAnalyticsService';
import Statsig from 'statsig-node';

describe('ServerAnalyticsService', () => {
  let service: ServerAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh instance for each test
    service = ServerAnalyticsService.getInstance();
  });

  it('should initialize successfully', async () => {
    await service.initialize();
    
    expect(Statsig.initialize).toHaveBeenCalledWith('test-secret-key', {
      environment: {
        tier: 'test'
      }
    });
  });

  it('should track events with proper formatting', () => {
    const mockUser = { userID: 'test-user' };
    const mockProperties = {
      feature_name: 'test_feature',
      test_property: 'test_value'
    };

    service.track('engagement_feature_adopted', mockUser, mockProperties);

    expect(Statsig.logEvent).toHaveBeenCalledWith(
      mockUser,
      'engagement_feature_adopted',
      undefined,
      expect.objectContaining({
        feature_name: 'test_feature',
        test_property: 'test_value',
        server_timestamp: expect.any(String),
        environment: 'test',
        app_version: expect.any(String),
      })
    );
  });

  it('should track API requests with correct event names', () => {
    const mockUser = { userID: 'test-user' };

    service.trackAPIRequest(
      '/api/test',
      'POST',
      200,
      150,
      mockUser,
      { additional_prop: 'value' }
    );

    expect(Statsig.logEvent).toHaveBeenCalledWith(
      mockUser,
      'server_api_request_completed',
      undefined,
      expect.objectContaining({
        endpoint: '/api/test',
        method: 'POST',
        status_code: '200',
        response_time_ms: '150',
        additional_prop: 'value',
      })
    );
  });

  it('should track CV processing operations', () => {
    const mockUser = { userID: 'test-user' };

    service.trackCVProcessing(
      'parsing',
      true,
      mockUser,
      1500,
      1024000,
      'gpt-4',
      500,
      undefined
    );

    expect(Statsig.logEvent).toHaveBeenCalledWith(
      mockUser,
      'server_cv_parsing_completed',
      undefined,
      expect.objectContaining({
        processing_duration_ms: '1500',
        file_size_bytes: '1024000',
        ai_model_used: 'gpt-4',
        ai_tokens_consumed: '500',
        success: 'true',
      })
    );
  });

  it('should handle shutdown gracefully', async () => {
    await service.shutdown();
    
    expect(Statsig.flush).toHaveBeenCalled();
    expect(Statsig.shutdown).toHaveBeenCalled();
  });
});