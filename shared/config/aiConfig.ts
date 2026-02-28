/**
 * Unified AI Configuration - Cross-Project Settings
 * Following OkBuddy tenets: modular, swappable, no vendor lock-in
 * Centralized configuration management for all AI services
 */

import { AIConfigOptions } from '../types/aiInterfaces';
import { SupportedLanguage } from '../types/workflow';
// import { SecureAPIKeyManager } from '../../security/apiKeyManagement'; // TODO: Implement this module

/**
 * AI Configuration Class
 * Manages OpenAI API settings, caching, error handling, and monitoring
 */
export class AIConfig implements AIConfigOptions {
  public readonly openaiApiKey: string;
  public readonly openaiApiUrl: string;
  public readonly model: string;
  public readonly maxTokens: number;
  public readonly temperature: number;
  public readonly timeout: number;
  public readonly retryAttempts: number;
  public readonly enableCaching: boolean;
  public readonly cacheTTL: number;
  public readonly fallbackEnabled: boolean;
  public readonly monitoringEnabled: boolean;

  constructor(options?: Partial<AIConfigOptions>) {
    // OpenAI API Configuration
    this.openaiApiKey = options?.openaiApiKey || process.env.OPENAI_API_KEY || this.getDefaultApiKey();
    this.openaiApiUrl = options?.openaiApiUrl || 'https://api.openai.com/v1/chat/completions';
    this.model = options?.model || 'gpt-4o-mini';

    // Request Configuration
    this.maxTokens = options?.maxTokens || 2048;
    this.temperature = options?.temperature || 0.7;
    this.timeout = options?.timeout || 30000; // 30 seconds

    // Retry Configuration
    this.retryAttempts = options?.retryAttempts || 3;

    // Caching Configuration
    this.enableCaching = options?.enableCaching ?? true;
    this.cacheTTL = options?.cacheTTL || 3600000; // 1 hour in milliseconds

    // Fallback Configuration
    this.fallbackEnabled = options?.fallbackEnabled ?? true;

    // Monitoring Configuration
    this.monitoringEnabled = options?.monitoringEnabled ?? true;

    // Validate configuration
    this.validateConfiguration();
  }

  /**
   * Get secure API key using new security infrastructure
   * Integrates with SecureAPIKeyManager for production-ready security
   */
  private getDefaultApiKey(): string {
    const environment = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
    
    // Use environment variable directly (TODO: Implement SecureAPIKeyManager)
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      if (environment === 'production') {
        throw new Error('OPENAI_API_KEY environment variable is required in production');
      }
      
      console.warn('⚠️ Security module not available - using basic validation');
      return process.env.OPENAI_API_KEY || '';
    }
    
    return apiKey;
  }

  /**
   * Validate configuration settings
   */
  private validateConfiguration(): void {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (!this.openaiApiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    if (this.maxTokens < 1 || this.maxTokens > 4096) {
      throw new Error('maxTokens must be between 1 and 4096');
    }

    if (this.temperature < 0 || this.temperature > 2) {
      throw new Error('temperature must be between 0 and 2');
    }

    if (this.timeout < 1000) {
      throw new Error('timeout must be at least 1000ms');
    }

    if (this.retryAttempts < 0 || this.retryAttempts > 10) {
      throw new Error('retryAttempts must be between 0 and 10');
    }

    if (this.cacheTTL < 0) {
      throw new Error('cacheTTL must be non-negative');
    }
  }

  /**
   * Create configuration for specific environments
   */
  static forEnvironment(env: 'development' | 'staging' | 'production'): AIConfig {
    const baseConfig: Partial<AIConfigOptions> = {
      model: 'gpt-4o-mini',
      maxTokens: 2048,
      temperature: 0.7,
      retryAttempts: 3,
      enableCaching: true,
      fallbackEnabled: true,
      monitoringEnabled: true
    };

    switch (env) {
      case 'development':
        return new AIConfig({
          ...baseConfig,
          timeout: 60000, // Longer timeout for development
          cacheTTL: 1800000, // 30 minutes cache
        });

      case 'staging':
        return new AIConfig({
          ...baseConfig,
          timeout: 30000,
          cacheTTL: 3600000, // 1 hour cache
        });

      case 'production':
        return new AIConfig({
          ...baseConfig,
          timeout: 15000, // Shorter timeout for production
          cacheTTL: 7200000, // 2 hours cache
          retryAttempts: 2, // Fewer retries for faster response
        });

      default:
        return new AIConfig(baseConfig);
    }
  }

  /**
   * Create configuration for different project types
   */
  static forProject(projectType: 'cv-guided-editing' | 'cv-jd-upload' | 'cv-workspace' | 'landing-page'): AIConfig {
    const baseConfig: Partial<AIConfigOptions> = {
      model: 'gpt-4o-mini',
      enableCaching: true,
      fallbackEnabled: true,
      monitoringEnabled: true
    };

    switch (projectType) {
      case 'cv-guided-editing':
        return new AIConfig({
          ...baseConfig,
          maxTokens: 2048,
          temperature: 0.7,
          timeout: 30000,
          cacheTTL: 3600000, // 1 hour - content editing benefits from caching
        });

      case 'cv-jd-upload':
        return new AIConfig({
          ...baseConfig,
          maxTokens: 3072, // Higher token limit for analysis
          temperature: 0.5, // Lower temperature for consistent analysis
          timeout: 45000, // Longer timeout for analysis
          cacheTTL: 7200000, // 2 hours - analysis results cache longer
        });

      case 'cv-workspace':
        return new AIConfig({
          ...baseConfig,
          maxTokens: 1024, // Lower token limit for workspace features
          temperature: 0.3, // Very consistent for workspace operations
          timeout: 15000, // Quick responses for workspace
          cacheTTL: 1800000, // 30 minutes - workspace data changes frequently
        });

      case 'landing-page':
        return new AIConfig({
          ...baseConfig,
          maxTokens: 512, // Minimal tokens for landing page features
          temperature: 0.8, // More creative for marketing content
          timeout: 10000, // Very quick for landing page
          cacheTTL: 86400000, // 24 hours - marketing content changes infrequently
        });

      default:
        return new AIConfig(baseConfig);
    }
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): object {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      enableCaching: this.enableCaching,
      cacheTTL: this.cacheTTL,
      fallbackEnabled: this.fallbackEnabled,
      monitoringEnabled: this.monitoringEnabled,
      hasApiKey: !!this.openaiApiKey,
      apiKeyFormat: this.openaiApiKey ? `${this.openaiApiKey.slice(0, 7)}...` : 'none'
    };
  }

  /**
   * Clone configuration with overrides
   */
  clone(overrides: Partial<AIConfigOptions>): AIConfig {
    return new AIConfig({
      openaiApiKey: this.openaiApiKey,
      openaiApiUrl: this.openaiApiUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      enableCaching: this.enableCaching,
      cacheTTL: this.cacheTTL,
      fallbackEnabled: this.fallbackEnabled,
      monitoringEnabled: this.monitoringEnabled,
      ...overrides
    });
  }

  /**
   * Create configuration for cost optimization
   */
  createCostOptimizedConfig(): AIConfig {
    return this.clone({
      maxTokens: Math.min(this.maxTokens, 1024), // Reduce token usage
      temperature: Math.min(this.temperature, 0.5), // More deterministic responses
      cacheTTL: Math.max(this.cacheTTL, 7200000), // Longer cache for cost savings
      retryAttempts: Math.min(this.retryAttempts, 2), // Fewer retries
    });
  }

  /**
   * Create configuration for performance optimization
   */
  createPerformanceOptimizedConfig(): AIConfig {
    return this.clone({
      timeout: Math.min(this.timeout, 15000), // Shorter timeout
      retryAttempts: Math.min(this.retryAttempts, 1), // Minimal retries
      cacheTTL: Math.min(this.cacheTTL, 1800000), // Shorter cache for fresher content
    });
  }
}

// Default configurations for easy import
export const defaultAIConfig = new AIConfig();
export const developmentAIConfig = AIConfig.forEnvironment('development');
export const productionAIConfig = AIConfig.forEnvironment('production');

// Project-specific configurations
export const cvGuidedEditingConfig = AIConfig.forProject('cv-guided-editing');
export const cvJdUploadConfig = AIConfig.forProject('cv-jd-upload');
export const cvWorkspaceConfig = AIConfig.forProject('cv-workspace');
export const landingPageConfig = AIConfig.forProject('landing-page'); 