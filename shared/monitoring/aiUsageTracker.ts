/**
 * AI Usage Tracker - Cross-Project Monitoring System
 * Following OkBuddy tenets: modular, swappable, data-driven optimization
 * Centralized monitoring for AI usage, costs, and performance
 */

import { AIUsageMetrics, TokenUsage, ServiceStatistics, ServiceHealth, SupportedLanguage } from '../types/aiInterfaces';

/**
 * AI Usage Tracker Class
 * Monitors API usage, tracks costs, measures performance, and provides analytics
 */
export class AIUsageTracker {
  private metrics: AIUsageMetrics;
  private requestTimes: number[] = [];
  private errorCounts = new Map<string, number>();
  private dailyTokens = new Map<string, number>(); // date -> token count
  private startTime: number = Date.now();
  private lastHealthCheck: number = Date.now();

  // Cost tracking infrastructure
  private static readonly TOKEN_COSTS = {
    'gpt-4o-mini': {
      input: 0.00015, // per 1K tokens
      output: 0.0006  // per 1K tokens
    },
    'gpt-4': {
      input: 0.03,
      output: 0.06
    }
  };

  private costs: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: number;
  }> = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDailyReset();
  }

  /**
   * Initialize metrics with default values
   */
  private initializeMetrics(): AIUsageMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Setup daily token reset for cost tracking
   */
  private setupDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyTokens();
      // Set up daily interval
      setInterval(() => this.resetDailyTokens(), 24 * 60 * 60 * 1000);
    }, msUntilTomorrow);
  }

  /**
   * Reset daily token counts
   */
  private resetDailyTokens(): void {
    const today = new Date().toISOString().split('T')[0];
    // Keep last 30 days of data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    for (const [date] of this.dailyTokens) {
      if (new Date(date) < cutoffDate) {
        this.dailyTokens.delete(date);
      }
    }
  }

  /**
   * Track a new API request
   */
  trackRequest(): void {
    this.metrics.totalRequests++;
    this.updateRates();
  }

  /**
   * Track successful API response
   */
  trackSuccess(tokenUsage: TokenUsage): void {
    this.metrics.successfulRequests++;
    this.metrics.totalTokens += tokenUsage.totalTokens;
    
    // Track daily tokens
    const today = new Date().toISOString().split('T')[0];
    const currentDailyTokens = this.dailyTokens.get(today) || 0;
    this.dailyTokens.set(today, currentDailyTokens + tokenUsage.totalTokens);
    
    this.updateRates();
  }

  /**
   * Track failed API request
   */
  trackError(error: Error): void {
    this.metrics.failedRequests++;
    
    // Track error by type
    const errorType = this.categorizeError(error);
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);
    
    this.updateRates();
  }

  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    this.metrics.cacheHits++;
    this.updateRates();
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    this.metrics.cacheMisses++;
    this.updateRates();
  }

  /**
   * Track request response time
   */
  trackResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.requestTimes.push(responseTime);
    
    // Keep only last 100 response times for rolling average
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }
    
    // Update average response time
    this.metrics.averageResponseTime = this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
  }

  /**
   * Categorize error for tracking
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'AUTH_ERROR';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'RATE_LIMIT_ERROR';
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'SERVER_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Update calculated rates
   */
  private updateRates(): void {
    // Error rate
    if (this.metrics.totalRequests > 0) {
      this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    }
    
    // Cache hit rate
    const totalCacheAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalCacheAttempts > 0) {
      this.metrics.cacheHitRate = this.metrics.cacheHits / totalCacheAttempts;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): AIUsageMetrics {
    return { ...this.metrics };
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): ServiceStatistics {
    const uptime = Date.now() - this.startTime;
    const p95ResponseTime = this.calculateP95ResponseTime();

    return {
      requests: this.getMetrics(),
      cache: {
        size: 0, // Would be updated by cache service
        hitRate: this.metrics.cacheHitRate,
        entries: 0, // Would be updated by cache service
        memoryUsage: 0 // Would be updated by cache service
      },
      performance: {
        averageResponseTime: this.metrics.averageResponseTime,
        p95ResponseTime,
        errorRate: this.metrics.errorRate,
        uptime
      }
    };
  }

  /**
   * Calculate 95th percentile response time
   */
  private calculateP95ResponseTime(): number {
    if (this.requestTimes.length === 0) return 0;
    
    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  /**
   * Get service health status
   */
  getHealth(): ServiceHealth {
    const now = Date.now();
    const uptime = now - this.startTime;
    const timeSinceLastCheck = now - this.lastHealthCheck;
    
    // Update last health check
    this.lastHealthCheck = now;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (this.metrics.errorRate > 0.1) { // More than 10% error rate
      status = 'unhealthy';
    } else if (this.metrics.errorRate > 0.05 || this.metrics.averageResponseTime > 5000) {
      status = 'degraded'; // More than 5% error rate or 5+ second response times
    }
    
    return {
      status,
      lastCheck: now,
      uptime,
      errorRate: this.metrics.errorRate,
      responseTime: this.metrics.averageResponseTime
    };
  }

  /**
   * Get daily token usage
   */
  getDailyTokenUsage(days: number = 7): { [date: string]: number } {
    const result: { [date: string]: number } = {};
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result[dateStr] = this.dailyTokens.get(dateStr) || 0;
    }
    
    return result;
  }

  /**
   * Get error breakdown
   */
  getErrorBreakdown(): { [errorType: string]: number } {
    const breakdown: { [errorType: string]: number } = {};
    this.errorCounts.forEach((count, type) => {
      breakdown[type] = count;
    });
    return breakdown;
  }

  /**
   * Estimate daily cost (approximate)
   */
  estimateDailyCost(): { [date: string]: number } {
    const costPerThousandTokens = 0.002; // Approximate GPT-4o-mini cost
    const dailyCosts: { [date: string]: number } = {};
    
    this.dailyTokens.forEach((tokens, date) => {
      dailyCosts[date] = (tokens / 1000) * costPerThousandTokens;
    });
    
    return dailyCosts;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): {
    cacheEffectiveness: 'excellent' | 'good' | 'poor';
    responsePerformance: 'excellent' | 'good' | 'poor';
    errorLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Cache effectiveness
    let cacheEffectiveness: 'excellent' | 'good' | 'poor' = 'excellent';
    if (this.metrics.cacheHitRate < 0.3) {
      cacheEffectiveness = 'poor';
      recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    } else if (this.metrics.cacheHitRate < 0.6) {
      cacheEffectiveness = 'good';
      recommendations.push('Cache performance is good but could be optimized further');
    }
    
    // Response performance
    let responsePerformance: 'excellent' | 'good' | 'poor' = 'excellent';
    if (this.metrics.averageResponseTime > 5000) {
      responsePerformance = 'poor';
      recommendations.push('Response times are slow - consider optimizing prompts or using faster models');
    } else if (this.metrics.averageResponseTime > 3000) {
      responsePerformance = 'good';
      recommendations.push('Response times could be improved with prompt optimization');
    }
    
    // Error level
    let errorLevel: 'low' | 'medium' | 'high' = 'low';
    if (this.metrics.errorRate > 0.1) {
      errorLevel = 'high';
      recommendations.push('High error rate detected - investigate API issues or network problems');
    } else if (this.metrics.errorRate > 0.05) {
      errorLevel = 'medium';
      recommendations.push('Monitor error rate and consider implementing additional retry logic');
    }
    
    // Cost optimization recommendations
    if (this.metrics.cacheHitRate < 0.4) {
      recommendations.push('Improve caching to reduce API costs');
    }
    
    return {
      cacheEffectiveness,
      responsePerformance,
      errorLevel,
      recommendations
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.requestTimes = [];
    this.errorCounts.clear();
    this.dailyTokens.clear();
    this.costs = []; // Reset cost tracking
    this.startTime = Date.now();
    this.lastHealthCheck = Date.now();
  }

  /**
   * Get cache hit rate for external services
   */
  getCacheHitRate(): number {
    return this.metrics.cacheHitRate;
  }

  /**
   * Track language usage for analytics
   */
  trackLanguageUsage(language: SupportedLanguage): void {
    // This could be extended to track language-specific usage patterns
    // For now, we just track it as part of general metrics
  }

  /**
   * Track token usage for cost calculation
   */
  trackTokenUsage(model: string, inputTokens: number, outputTokens: number): void {
    this.costs.push({
      model,
      inputTokens,
      outputTokens,
      timestamp: Date.now()
    });
  }

  /**
   * Calculate cost for specific usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = AIUsageTracker.TOKEN_COSTS[model as keyof typeof AIUsageTracker.TOKEN_COSTS];
    if (!rates) return 0;

    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;
    return inputCost + outputCost;
  }

  /**
   * Get total cost for tracked usage
   */
  getTotalCost(timeWindow?: number): number {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const relevantCosts = this.costs.filter(cost => cost.timestamp > cutoff);
    
    return relevantCosts.reduce((total, cost) => {
      return total + this.calculateCost(cost.model, cost.inputTokens, cost.outputTokens);
    }, 0);
  }

  /**
   * Get cost breakdown by model
   */
  getCostByModel(): Record<string, number> {
    return this.costs.reduce((acc, cost) => {
      const modelCost = this.calculateCost(cost.model, cost.inputTokens, cost.outputTokens);
      acc[cost.model] = (acc[cost.model] || 0) + modelCost;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    timestamp: string;
    metrics: AIUsageMetrics;
    health: ServiceHealth;
    dailyTokens: { [date: string]: number };
    errorBreakdown: { [errorType: string]: number };
  } {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      health: this.getHealth(),
      dailyTokens: this.getDailyTokenUsage(30), // Last 30 days
      errorBreakdown: this.getErrorBreakdown()
    };
  }
} 