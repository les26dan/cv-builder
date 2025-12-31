import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AI Usage Tracker Tests', () => {
  describe('Request Tracking', () => {
    it('should track basic request metrics', () => {
      class BasicUsageTracker {
        private requests: Array<{
          operation: string;
          language: string;
          timestamp: number;
          tokens?: number;
          responseTime?: number;
          success: boolean;
        }> = [];

        trackRequest(operation: string, language: string) {
          this.requests.push({
            operation,
            language,
            timestamp: Date.now(),
            success: false
          });
        }

        trackSuccess(operation: string, responseTime: number, tokens: number) {
          const lastRequest = this.requests[this.requests.length - 1];
          if (lastRequest && lastRequest.operation === operation) {
            lastRequest.success = true;
            lastRequest.responseTime = responseTime;
            lastRequest.tokens = tokens;
          }
        }

        trackError(operation: string, errorType: string) {
          const lastRequest = this.requests[this.requests.length - 1];
          if (lastRequest && lastRequest.operation === operation) {
            lastRequest.success = false;
          }
        }

        getRequestCount(): number {
          return this.requests.length;
        }

        getSuccessRate(): number {
          const successful = this.requests.filter(req => req.success).length;
          return this.requests.length > 0 ? successful / this.requests.length : 1;
        }

        getTotalTokensUsed(): number {
          return this.requests.reduce((total, req) => total + (req.tokens || 0), 0);
        }
      }

      const tracker = new BasicUsageTracker();
      
      tracker.trackRequest('GENERATE_CV_SUMMARY', 'en');
      tracker.trackSuccess('GENERATE_CV_SUMMARY', 1500, 100);
      
      tracker.trackRequest('ANALYZE_JOB_DESCRIPTION', 'vi');
      tracker.trackError('ANALYZE_JOB_DESCRIPTION', 'NETWORK_ERROR');

      expect(tracker.getRequestCount()).toBe(2);
      expect(tracker.getSuccessRate()).toBe(0.5);
      expect(tracker.getTotalTokensUsed()).toBe(100);
    });

    it('should track operation-specific metrics', () => {
      class DetailedUsageTracker {
        private metrics = new Map<string, {
          requestCount: number;
          successCount: number;
          totalTokens: number;
          totalResponseTime: number;
          errorCounts: Record<string, number>;
        }>();

        private initializeOperation(operation: string) {
          if (!this.metrics.has(operation)) {
            this.metrics.set(operation, {
              requestCount: 0,
              successCount: 0,
              totalTokens: 0,
              totalResponseTime: 0,
              errorCounts: {}
            });
          }
        }

        trackRequest(operation: string, language: string) {
          this.initializeOperation(operation);
          const metric = this.metrics.get(operation)!;
          metric.requestCount++;
        }

        trackSuccess(operation: string, responseTime: number, tokens: number) {
          this.initializeOperation(operation);
          const metric = this.metrics.get(operation)!;
          metric.successCount++;
          metric.totalTokens += tokens;
          metric.totalResponseTime += responseTime;
        }

        trackError(operation: string, errorType: string) {
          this.initializeOperation(operation);
          const metric = this.metrics.get(operation)!;
          metric.errorCounts[errorType] = (metric.errorCounts[errorType] || 0) + 1;
        }

        getOperationMetrics(operation: string) {
          return this.metrics.get(operation) || null;
        }

        getAverageResponseTime(operation: string): number {
          const metric = this.metrics.get(operation);
          if (!metric || metric.successCount === 0) return 0;
          return metric.totalResponseTime / metric.successCount;
        }

        getOperationSuccessRate(operation: string): number {
          const metric = this.metrics.get(operation);
          if (!metric || metric.requestCount === 0) return 1;
          return metric.successCount / metric.requestCount;
        }
      }

      const tracker = new DetailedUsageTracker();
      
      // Track CV Summary operations
      tracker.trackRequest('GENERATE_CV_SUMMARY', 'en');
      tracker.trackSuccess('GENERATE_CV_SUMMARY', 1200, 80);
      
      tracker.trackRequest('GENERATE_CV_SUMMARY', 'en');
      tracker.trackSuccess('GENERATE_CV_SUMMARY', 1800, 120);
      
      // Track Job Analysis operations
      tracker.trackRequest('ANALYZE_JOB_DESCRIPTION', 'vi');
      tracker.trackError('ANALYZE_JOB_DESCRIPTION', 'TIMEOUT_ERROR');

      const summaryMetrics = tracker.getOperationMetrics('GENERATE_CV_SUMMARY');
      expect(summaryMetrics?.requestCount).toBe(2);
      expect(summaryMetrics?.successCount).toBe(2);
      expect(summaryMetrics?.totalTokens).toBe(200);
      
      expect(tracker.getAverageResponseTime('GENERATE_CV_SUMMARY')).toBe(1500);
      expect(tracker.getOperationSuccessRate('GENERATE_CV_SUMMARY')).toBe(1);
      expect(tracker.getOperationSuccessRate('ANALYZE_JOB_DESCRIPTION')).toBe(0);
    });
  });

  describe('Cost Analysis', () => {
    it('should calculate cost estimates', () => {
      class CostTracker {
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

        trackTokenUsage(model: string, inputTokens: number, outputTokens: number) {
          this.costs.push({
            model,
            inputTokens,
            outputTokens,
            timestamp: Date.now()
          });
        }

        calculateCost(model: string, inputTokens: number, outputTokens: number): number {
          const rates = CostTracker.TOKEN_COSTS[model as keyof typeof CostTracker.TOKEN_COSTS];
          if (!rates) return 0;

          const inputCost = (inputTokens / 1000) * rates.input;
          const outputCost = (outputTokens / 1000) * rates.output;
          return inputCost + outputCost;
        }

        getTotalCost(timeWindow?: number): number {
          const cutoff = timeWindow ? Date.now() - timeWindow : 0;
          const relevantCosts = this.costs.filter(cost => cost.timestamp > cutoff);
          
          return relevantCosts.reduce((total, cost) => {
            return total + this.calculateCost(cost.model, cost.inputTokens, cost.outputTokens);
          }, 0);
        }

        getDailyCostEstimate(): number {
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          return this.getTotalCost(oneDayAgo);
        }

        getCostByModel(): Record<string, number> {
          return this.costs.reduce((acc, cost) => {
            const modelCost = this.calculateCost(cost.model, cost.inputTokens, cost.outputTokens);
            acc[cost.model] = (acc[cost.model] || 0) + modelCost;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const tracker = new CostTracker();
      
      // Track some usage
      tracker.trackTokenUsage('gpt-4o-mini', 1000, 500); // $0.00045
      tracker.trackTokenUsage('gpt-4o-mini', 2000, 1000); // $0.0009
      tracker.trackTokenUsage('gpt-4', 500, 250); // $0.03

      expect(tracker.calculateCost('gpt-4o-mini', 1000, 500)).toBeCloseTo(0.00045, 5);
      expect(tracker.getTotalCost()).toBeCloseTo(0.03135, 4); // Include all models
      
      const costByModel = tracker.getCostByModel();
      expect(costByModel['gpt-4o-mini']).toBeCloseTo(0.00135, 5);
      expect(costByModel['gpt-4']).toBeCloseTo(0.03, 5);
    });

    it('should provide cost optimization recommendations', () => {
      class CostOptimizer {
        analyzeUsage(metrics: any) {
          const recommendations = [];
          
          // Check if using expensive models unnecessarily
          if (metrics.gpt4Usage > metrics.gpt4oMiniUsage * 0.1) {
            recommendations.push({
              type: 'MODEL_OPTIMIZATION',
              message: 'Consider using gpt-4o-mini for simpler tasks to reduce costs',
              potentialSavings: '80-90%'
            });
          }
          
          // Check for high error rates
          if (metrics.errorRate > 0.1) {
            recommendations.push({
              type: 'ERROR_REDUCTION',
              message: 'High error rate detected. Implement better error handling to reduce wasted API calls',
              potentialSavings: `${Math.round(metrics.errorRate * 100)}%`
            });
          }
          
          // Check for caching opportunities
          if (metrics.duplicateRequests > 0.05) {
            recommendations.push({
              type: 'CACHING',
              message: 'Implement caching for similar requests to reduce API usage',
              potentialSavings: `${Math.round(metrics.duplicateRequests * 100)}%`
            });
          }
          
          return recommendations;
        }
      }

      const optimizer = new CostOptimizer();
      
      const highErrorMetrics = {
        gpt4Usage: 100,
        gpt4oMiniUsage: 50,
        errorRate: 0.15,
        duplicateRequests: 0.08
      };
      
      const recommendations = optimizer.analyzeUsage(highErrorMetrics);
      
      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].type).toBe('MODEL_OPTIMIZATION');
      expect(recommendations[1].type).toBe('ERROR_REDUCTION');
      expect(recommendations[2].type).toBe('CACHING');
    });
  });

  describe('Performance Analytics', () => {
    it('should calculate performance percentiles', () => {
      class PerformanceAnalyzer {
        calculatePercentile(values: number[], percentile: number): number {
          const sorted = [...values].sort((a, b) => a - b);
          const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
          return sorted[Math.max(0, index)];
        }

        analyzeResponseTimes(responseTimes: number[]) {
          if (responseTimes.length === 0) {
            return { p50: 0, p95: 0, p99: 0, average: 0 };
          }

          const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
          
          return {
            p50: this.calculatePercentile(responseTimes, 50),
            p95: this.calculatePercentile(responseTimes, 95),
            p99: this.calculatePercentile(responseTimes, 99),
            average: Math.round(average)
          };
        }

        identifyPerformanceIssues(metrics: any) {
          const issues = [];
          
          if (metrics.p95 > 5000) {
            issues.push({
              severity: 'HIGH',
              issue: 'Slow response times detected',
              metric: `P95: ${metrics.p95}ms`,
              recommendation: 'Investigate API performance or implement timeout optimization'
            });
          }
          
          if (metrics.average > 3000) {
            issues.push({
              severity: 'MEDIUM',
              issue: 'Above average response times',
              metric: `Average: ${metrics.average}ms`,
              recommendation: 'Consider request optimization or model switching'
            });
          }
          
          return issues;
        }
      }

      const analyzer = new PerformanceAnalyzer();
      
      const responseTimes = [1200, 1500, 800, 2200, 1800, 900, 1100, 3500, 1300, 1600];
      const metrics = analyzer.analyzeResponseTimes(responseTimes);
      
      expect(metrics.p50).toBe(1300);
      expect(metrics.p95).toBe(3500);
      expect(metrics.average).toBe(1590);
      
      const issues = analyzer.identifyPerformanceIssues(metrics);
      expect(issues).toHaveLength(0); // No issues with these metrics
      
      const slowMetrics = { p95: 6000, average: 4000 };
      const slowIssues = analyzer.identifyPerformanceIssues(slowMetrics);
      expect(slowIssues).toHaveLength(2);
    });

    it('should track request patterns', () => {
      class PatternAnalyzer {
        private requests: Array<{
          operation: string;
          timestamp: number;
          language: string;
        }> = [];

        trackRequest(operation: string, language: string) {
          this.requests.push({
            operation,
            language,
            timestamp: Date.now()
          });
        }

        getHourlyDistribution(): Record<number, number> {
          const distribution: Record<number, number> = {};
          
          this.requests.forEach(request => {
            const hour = new Date(request.timestamp).getHours();
            distribution[hour] = (distribution[hour] || 0) + 1;
          });
          
          return distribution;
        }

        getLanguageDistribution(): Record<string, number> {
          return this.requests.reduce((acc, request) => {
            acc[request.language] = (acc[request.language] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }

        getOperationPopularity(): Array<{ operation: string; count: number; percentage: number }> {
          const counts = this.requests.reduce((acc, request) => {
            acc[request.operation] = (acc[request.operation] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const total = this.requests.length;
          
          return Object.entries(counts)
            .map(([operation, count]) => ({
              operation,
              count,
              percentage: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.count - a.count);
        }
      }

      const analyzer = new PatternAnalyzer();
      
      // Simulate various requests
      analyzer.trackRequest('GENERATE_CV_SUMMARY', 'en');
      analyzer.trackRequest('GENERATE_CV_SUMMARY', 'en');
      analyzer.trackRequest('ANALYZE_JOB_DESCRIPTION', 'vi');
      analyzer.trackRequest('GENERATE_BULLET_POINTS', 'en');
      
      const langDistribution = analyzer.getLanguageDistribution();
      expect(langDistribution.en).toBe(3);
      expect(langDistribution.vi).toBe(1);
      
      const popularity = analyzer.getOperationPopularity();
      expect(popularity[0].operation).toBe('GENERATE_CV_SUMMARY');
      expect(popularity[0].count).toBe(2);
      expect(popularity[0].percentage).toBe(50);
    });
  });

  describe('Health Monitoring', () => {
    it('should monitor service health status', () => {
      class HealthMonitor {
        private healthChecks: Array<{
          timestamp: number;
          status: 'healthy' | 'degraded' | 'unhealthy';
          metrics: {
            responseTime: number;
            errorRate: number;
            successRate: number;
          };
        }> = [];

        recordHealthCheck(metrics: any) {
          let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
          
          if (metrics.errorRate > 0.5 || metrics.responseTime > 10000) {
            status = 'unhealthy';
          } else if (metrics.errorRate > 0.1 || metrics.responseTime > 5000) {
            status = 'degraded';
          }
          
          this.healthChecks.push({
            timestamp: Date.now(),
            status,
            metrics
          });
        }

        getCurrentHealthStatus(): string {
          if (this.healthChecks.length === 0) return 'unknown';
          
          const recent = this.healthChecks.slice(-5); // Last 5 checks
          const unhealthyCount = recent.filter(check => check.status === 'unhealthy').length;
          const degradedCount = recent.filter(check => check.status === 'degraded').length;
          
          if (unhealthyCount >= 3) return 'unhealthy';
          if (degradedCount >= 3) return 'degraded';
          return 'healthy';
        }

        getUptimePercentage(timeWindow = 3600000): number { // 1 hour default
          const cutoff = Date.now() - timeWindow;
          const recentChecks = this.healthChecks.filter(check => check.timestamp > cutoff);
          
          if (recentChecks.length === 0) return 100;
          
          const healthyChecks = recentChecks.filter(check => check.status === 'healthy').length;
          return Math.round((healthyChecks / recentChecks.length) * 100);
        }
      }

      const monitor = new HealthMonitor();
      
      // Record healthy checks
      monitor.recordHealthCheck({ errorRate: 0.02, responseTime: 1500, successRate: 0.98 });
      monitor.recordHealthCheck({ errorRate: 0.01, responseTime: 1200, successRate: 0.99 });
      
      expect(monitor.getCurrentHealthStatus()).toBe('healthy');
      expect(monitor.getUptimePercentage()).toBe(100);
      
      // Record degraded checks
      monitor.recordHealthCheck({ errorRate: 0.15, responseTime: 6000, successRate: 0.85 });
      monitor.recordHealthCheck({ errorRate: 0.12, responseTime: 5500, successRate: 0.88 });
      monitor.recordHealthCheck({ errorRate: 0.11, responseTime: 5200, successRate: 0.89 });
      
      expect(monitor.getCurrentHealthStatus()).toBe('degraded');
      expect(monitor.getUptimePercentage()).toBe(40); // 2 healthy out of 5 total
    });
  });

  describe('Alert System', () => {
    it('should generate alerts based on thresholds', () => {
      class AlertSystem {
        private alerts: Array<{
          level: 'info' | 'warning' | 'critical';
          message: string;
          timestamp: number;
          metric: string;
          value: number;
        }> = [];

        checkThresholds(metrics: any) {
          const thresholds = {
            errorRate: { warning: 0.1, critical: 0.25 },
            responseTime: { warning: 3000, critical: 8000 },
            costPerHour: { warning: 10, critical: 50 }
          };

                     Object.entries(metrics).forEach(([metric, value]) => {
             const threshold = thresholds[metric as keyof typeof thresholds];
             if (!threshold || typeof value !== 'number') return;

             if (value >= threshold.critical) {
               this.alerts.push({
                 level: 'critical',
                 message: `Critical threshold exceeded for ${metric}`,
                 timestamp: Date.now(),
                 metric,
                 value: value
               });
             } else if (value >= threshold.warning) {
               this.alerts.push({
                 level: 'warning',
                 message: `Warning threshold exceeded for ${metric}`,
                 timestamp: Date.now(),
                 metric,
                 value: value
               });
             }
           });
        }

        getActiveAlerts(timeWindow = 3600000): Array<any> {
          const cutoff = Date.now() - timeWindow;
          return this.alerts.filter(alert => alert.timestamp > cutoff);
        }

        getCriticalAlerts(): Array<any> {
          return this.alerts.filter(alert => alert.level === 'critical');
        }
      }

      const alertSystem = new AlertSystem();
      
      // Normal metrics - no alerts
      alertSystem.checkThresholds({
        errorRate: 0.05,
        responseTime: 2000,
        costPerHour: 5
      });
      
      expect(alertSystem.getActiveAlerts()).toHaveLength(0);
      
      // High metrics - should generate alerts
      alertSystem.checkThresholds({
        errorRate: 0.3,  // Critical
        responseTime: 4000,  // Warning
        costPerHour: 60  // Critical
      });
      
      const activeAlerts = alertSystem.getActiveAlerts();
      const criticalAlerts = alertSystem.getCriticalAlerts();
      
      expect(activeAlerts).toHaveLength(3);
      expect(criticalAlerts).toHaveLength(2);
      expect(criticalAlerts[0].metric).toBe('errorRate');
      expect(criticalAlerts[1].metric).toBe('costPerHour');
    });
  });
}); 