import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AI Configuration Tests', () => {
  describe('Environment Configuration', () => {
    it('should load development configuration', () => {
      const loadConfig = (environment: string) => {
        const configs = {
          development: {
            apiKey: 'dev-test-key',
            model: 'gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.8,
            timeout: 30000,
            retryAttempts: 3,
            enableLogging: true,
            enableCaching: true,
            cacheSize: 50
          },
          staging: {
            apiKey: process.env.OPENAI_API_KEY || 'staging-key',
            model: 'gpt-4o-mini',
            maxTokens: 1500,
            temperature: 0.7,
            timeout: 25000,
            retryAttempts: 5,
            enableLogging: true,
            enableCaching: true,
            cacheSize: 100
          },
          production: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: 'gpt-4o-mini',
            maxTokens: 2000,
            temperature: 0.6,
            timeout: 20000,
            retryAttempts: 5,
            enableLogging: false,
            enableCaching: true,
            cacheSize: 200
          }
        };

        return configs[environment as keyof typeof configs] || configs.development;
      };

      const devConfig = loadConfig('development');
      const prodConfig = loadConfig('production');

      expect(devConfig.apiKey).toBe('dev-test-key');
      expect(devConfig.temperature).toBe(0.8);
      expect(devConfig.enableLogging).toBe(true);
      expect(devConfig.cacheSize).toBe(50);

      expect(prodConfig.temperature).toBe(0.6);
      expect(prodConfig.enableLogging).toBe(false);
      expect(prodConfig.cacheSize).toBe(200);
      expect(prodConfig.retryAttempts).toBe(5);
    });

    it('should validate configuration completeness', () => {
      const validateConfig = (config: any) => {
        const requiredFields = [
          'apiKey', 'model', 'maxTokens', 'temperature', 
          'timeout', 'retryAttempts', 'enableLogging', 'enableCaching'
        ];

        const missing = requiredFields.filter(field => config[field] === undefined);
        const errors = [];

        if (missing.length > 0) {
          errors.push(`Missing required fields: ${missing.join(', ')}`);
        }

        if (config.temperature < 0 || config.temperature > 2) {
          errors.push('Temperature must be between 0 and 2');
        }

        if (config.maxTokens <= 0 || config.maxTokens > 32768) {
          errors.push('MaxTokens must be between 1 and 32768');
        }

        if (config.timeout <= 0) {
          errors.push('Timeout must be positive');
        }

        if (!config.apiKey || config.apiKey.trim().length === 0) {
          errors.push('API key is required');
        }

        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validConfig = {
        apiKey: 'valid-key',
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
        enableLogging: true,
        enableCaching: true
      };

      const invalidConfig = {
        apiKey: '',
        model: 'gpt-4o-mini',
        maxTokens: -100,
        temperature: 3.0,
        timeout: 0,
        retryAttempts: 3,
        enableLogging: true,
        enableCaching: true
      };

      const validResult = validateConfig(validConfig);
      const invalidResult = validateConfig(invalidConfig);

      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(4);
      expect(invalidResult.errors).toContain('API key is required');
      expect(invalidResult.errors).toContain('MaxTokens must be between 1 and 32768');
      expect(invalidResult.errors).toContain('Temperature must be between 0 and 2');
      expect(invalidResult.errors).toContain('Timeout must be positive');
    });
  });

  describe('Project-Specific Configuration', () => {
    it('should provide project-specific optimization profiles', () => {
      const getProjectConfig = (project: string) => {
        const projectConfigs = {
          cvGuided: {
            maxTokens: 1500,
            temperature: 0.7,
            systemPrompt: 'You are a professional CV writing assistant.',
            specializations: ['cv_writing', 'professional_language', 'ats_optimization'],
            contextWindow: 8000,
            responseFormat: 'structured'
          },
          cvJdUpload: {
            maxTokens: 2000,
            temperature: 0.6,
            systemPrompt: 'You are an expert job description analyzer.',
            specializations: ['job_analysis', 'requirement_extraction', 'skill_matching'],
            contextWindow: 12000,
            responseFormat: 'json'
          },
          cvWorkspace: {
            maxTokens: 1000,
            temperature: 0.8,
            systemPrompt: 'You are a career guidance assistant.',
            specializations: ['career_advice', 'workflow_optimization', 'productivity'],
            contextWindow: 6000,
            responseFormat: 'conversational'
          },
          landingPage: {
            maxTokens: 800,
            temperature: 0.9,
            systemPrompt: 'You are a marketing copy expert.',
            specializations: ['marketing_copy', 'conversion_optimization', 'a_b_testing'],
            contextWindow: 4000,
            responseFormat: 'marketing'
          }
        };

        return projectConfigs[project as keyof typeof projectConfigs] || null;
      };

      const cvGuidedConfig = getProjectConfig('cvGuided');
      const jdUploadConfig = getProjectConfig('cvJdUpload');

      expect(cvGuidedConfig?.maxTokens).toBe(1500);
      expect(cvGuidedConfig?.specializations).toContain('cv_writing');
      expect(cvGuidedConfig?.responseFormat).toBe('structured');

      expect(jdUploadConfig?.maxTokens).toBe(2000);
      expect(jdUploadConfig?.specializations).toContain('job_analysis');
      expect(jdUploadConfig?.responseFormat).toBe('json');
      expect(jdUploadConfig?.contextWindow).toBe(12000);
    });

    it('should merge base and project configurations', () => {
      const mergeConfigs = (baseConfig: any, projectConfig: any) => {
        return {
          ...baseConfig,
          ...projectConfig,
          // Ensure critical base settings aren't overridden
          apiKey: baseConfig.apiKey,
          retryAttempts: baseConfig.retryAttempts,
          timeout: baseConfig.timeout
        };
      };

      const baseConfig = {
        apiKey: 'secret-key',
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 3,
        enableLogging: true
      };

      const projectConfig = {
        maxTokens: 2000,
        temperature: 0.6,
        systemPrompt: 'Custom prompt',
        specializations: ['custom_feature'],
        timeout: 15000 // Should not override base timeout
      };

      const merged = mergeConfigs(baseConfig, projectConfig);

      expect(merged.maxTokens).toBe(2000); // From project config
      expect(merged.temperature).toBe(0.6); // From project config
      expect(merged.systemPrompt).toBe('Custom prompt'); // From project config
      expect(merged.apiKey).toBe('secret-key'); // Preserved from base
      expect(merged.timeout).toBe(30000); // Preserved from base
      expect(merged.retryAttempts).toBe(3); // Preserved from base
    });
  });

  describe('Dynamic Configuration Updates', () => {
    it('should support runtime configuration updates', () => {
      class DynamicConfig {
        private config: any;
        private subscribers: Array<(config: any) => void> = [];

        constructor(initialConfig: any) {
          this.config = { ...initialConfig };
        }

        updateConfig(updates: Partial<any>) {
          const oldConfig = { ...this.config };
          this.config = { ...this.config, ...updates };
          
          this.notifySubscribers(this.config, oldConfig);
        }

        getConfig() {
          return { ...this.config };
        }

        subscribe(callback: (config: any) => void) {
          this.subscribers.push(callback);
          return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
              this.subscribers.splice(index, 1);
            }
          };
        }

        private notifySubscribers(newConfig: any, oldConfig: any) {
          this.subscribers.forEach(callback => callback(newConfig));
        }
      }

      const initialConfig = {
        maxTokens: 1000,
        temperature: 0.7,
        model: 'gpt-4o-mini'
      };

      const dynamicConfig = new DynamicConfig(initialConfig);
      let notificationReceived = false;
      let receivedConfig: any = null;

      const unsubscribe = dynamicConfig.subscribe((config) => {
        notificationReceived = true;
        receivedConfig = config;
      });

      expect(dynamicConfig.getConfig().maxTokens).toBe(1000);

      dynamicConfig.updateConfig({ maxTokens: 1500, temperature: 0.8 });

      expect(dynamicConfig.getConfig().maxTokens).toBe(1500);
      expect(dynamicConfig.getConfig().temperature).toBe(0.8);
      expect(dynamicConfig.getConfig().model).toBe('gpt-4o-mini'); // Unchanged
      expect(notificationReceived).toBe(true);
      expect(receivedConfig.maxTokens).toBe(1500);

      unsubscribe();
    });
  });

  describe('Security and API Key Management', () => {
    it('should validate API key format', () => {
      const validateAPIKey = (apiKey: string) => {
        const errors = [];

        if (!apiKey || apiKey.trim().length === 0) {
          errors.push('API key is required');
        }

        if (apiKey && apiKey.length < 20) {
          errors.push('API key appears too short');
        }

        if (apiKey && !apiKey.startsWith('sk-')) {
          errors.push('API key should start with "sk-"');
        }

        if (apiKey && !/^sk-[A-Za-z0-9]+$/.test(apiKey)) {
          errors.push('API key contains invalid characters');
        }

        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validKey = 'sk-1234567890abcdef1234567890abcdef12345678';
      const invalidKeys = [
        '',
        'sk-short',
        'invalid-prefix-key',
        'sk-invalid@characters!'
      ];

      expect(validateAPIKey(validKey).valid).toBe(true);

      invalidKeys.forEach(key => {
        expect(validateAPIKey(key).valid).toBe(false);
      });

      expect(validateAPIKey('sk-short').errors).toContain('API key appears too short');
      expect(validateAPIKey('invalid-prefix-key').errors).toContain('API key should start with "sk-"');
      expect(validateAPIKey('sk-invalid@characters!').errors).toContain('API key contains invalid characters');
    });

    it('should mask API keys in logs', () => {
      const maskAPIKey = (apiKey: string) => {
        if (!apiKey || apiKey.length < 8) {
          return '[INVALID_KEY]';
        }
        
        const prefix = apiKey.substring(0, 3);
        const suffix = apiKey.substring(apiKey.length - 4);
        const middle = '*'.repeat(Math.max(8, apiKey.length - 7));
        
        return `${prefix}${middle}${suffix}`;
      };

      const testKey = 'sk-1234567890abcdef1234567890abcdef12345678';
      const masked = maskAPIKey(testKey);

      expect(masked).toBe('sk-************************************5678');
      expect(masked).not.toContain('1234567890abcdef');
      expect(masked.startsWith('sk-')).toBe(true);
      expect(masked.endsWith('5678')).toBe(true);

      expect(maskAPIKey('')).toBe('[INVALID_KEY]');
      expect(maskAPIKey('short')).toBe('[INVALID_KEY]');
    });
  });

  describe('Cost and Performance Optimization', () => {
    it('should provide cost-optimized configurations', () => {
      const getCostOptimizedConfig = (priority: 'cost' | 'performance' | 'balanced') => {
        const configurations = {
          cost: {
            model: 'gpt-4o-mini',
            maxTokens: 800,
            temperature: 0.6,
            enableCaching: true,
            cacheSize: 200,
            retryAttempts: 2,
            timeout: 45000
          },
          performance: {
            model: 'gpt-4',
            maxTokens: 2000,
            temperature: 0.7,
            enableCaching: true,
            cacheSize: 100,
            retryAttempts: 5,
            timeout: 15000
          },
          balanced: {
            model: 'gpt-4o-mini',
            maxTokens: 1200,
            temperature: 0.7,
            enableCaching: true,
            cacheSize: 150,
            retryAttempts: 3,
            timeout: 30000
          }
        };

        return configurations[priority];
      };

      const costConfig = getCostOptimizedConfig('cost');
      const performanceConfig = getCostOptimizedConfig('performance');
      const balancedConfig = getCostOptimizedConfig('balanced');

      expect(costConfig.model).toBe('gpt-4o-mini');
      expect(costConfig.maxTokens).toBe(800);
      expect(costConfig.cacheSize).toBe(200); // Higher cache for cost savings

      expect(performanceConfig.model).toBe('gpt-4');
      expect(performanceConfig.maxTokens).toBe(2000);
      expect(performanceConfig.timeout).toBe(15000); // Lower timeout for speed

      expect(balancedConfig.model).toBe('gpt-4o-mini');
      expect(balancedConfig.maxTokens).toBe(1200);
      expect(balancedConfig.retryAttempts).toBe(3);
    });

    it('should calculate estimated costs per configuration', () => {
             const calculateEstimatedCost = (config: any, estimatedMonthlyRequests: number) => {
         const modelCosts = {
           'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
           'gpt-4': { input: 0.03, output: 0.06 }
         };

         const modelCost = modelCosts[config.model as keyof typeof modelCosts];
         if (!modelCost) return { costPerRequest: 0, monthlyCost: 0, model: config.model, maxTokens: config.maxTokens };

        // Estimate tokens per request (rough approximation)
        const avgInputTokens = config.maxTokens * 0.3; // Assume 30% input, 70% output
        const avgOutputTokens = config.maxTokens * 0.7;

        const costPerRequest = 
          (avgInputTokens / 1000) * modelCost.input +
          (avgOutputTokens / 1000) * modelCost.output;

        const monthlyCost = costPerRequest * estimatedMonthlyRequests;

        return {
          costPerRequest: Math.round(costPerRequest * 100000) / 100000, // 5 decimal places
          monthlyCost: Math.round(monthlyCost * 100) / 100, // 2 decimal places
          model: config.model,
          maxTokens: config.maxTokens
        };
      };

      const costConfig = { model: 'gpt-4o-mini', maxTokens: 800 };
      const performanceConfig = { model: 'gpt-4', maxTokens: 2000 };

      const costEstimate = calculateEstimatedCost(costConfig, 1000);
      const perfEstimate = calculateEstimatedCost(performanceConfig, 1000);

      expect(costEstimate.costPerRequest).toBeLessThan(perfEstimate.costPerRequest);
      expect(costEstimate.monthlyCost).toBeLessThan(perfEstimate.monthlyCost);
      expect(costEstimate.model).toBe('gpt-4o-mini');
      expect(perfEstimate.model).toBe('gpt-4');
    });
  });

  describe('Configuration Monitoring', () => {
    it('should track configuration usage patterns', () => {
      class ConfigMonitor {
        private usageStats = new Map<string, {
          requestCount: number;
          totalTokens: number;
          averageResponseTime: number;
          errorRate: number;
        }>();

        trackUsage(configKey: string, tokens: number, responseTime: number, success: boolean) {
          if (!this.usageStats.has(configKey)) {
            this.usageStats.set(configKey, {
              requestCount: 0,
              totalTokens: 0,
              averageResponseTime: 0,
              errorRate: 0
            });
          }

          const stats = this.usageStats.get(configKey)!;
          const prevCount = stats.requestCount;
          
          stats.requestCount++;
          stats.totalTokens += tokens;
          stats.averageResponseTime = (stats.averageResponseTime * prevCount + responseTime) / stats.requestCount;
          
          if (!success) {
            stats.errorRate = (stats.errorRate * prevCount + 1) / stats.requestCount;
          } else {
            stats.errorRate = (stats.errorRate * prevCount) / stats.requestCount;
          }
        }

                 getOptimizationRecommendations(): Array<{config: string; issue: string; recommendation: string; priority: string}> {
           const recommendations: Array<{config: string; issue: string; recommendation: string; priority: string}> = [];

           this.usageStats.forEach((stats, configKey) => {
             if (stats.errorRate > 0.1) {
               recommendations.push({
                 config: configKey,
                 issue: 'High error rate',
                 recommendation: 'Increase timeout or retry attempts',
                 priority: 'high'
               });
             }

             if (stats.averageResponseTime > 5000) {
               recommendations.push({
                 config: configKey,
                 issue: 'Slow response times',
                 recommendation: 'Consider reducing max tokens or using faster model',
                 priority: 'medium'
               });
             }
           });

           return recommendations;
         }

        getUsageStats() {
          return Object.fromEntries(this.usageStats);
        }
      }

      const monitor = new ConfigMonitor();

      // Track usage for different configs
      monitor.trackUsage('cost-optimized', 500, 2000, true);
      monitor.trackUsage('cost-optimized', 600, 2200, true);
      monitor.trackUsage('cost-optimized', 550, 8000, false); // Error case

      monitor.trackUsage('performance', 1200, 1000, true);
      monitor.trackUsage('performance', 1300, 1100, true);

      const stats = monitor.getUsageStats();
      const recommendations = monitor.getOptimizationRecommendations();

      expect(stats['cost-optimized'].requestCount).toBe(3);
      expect(stats['cost-optimized'].totalTokens).toBe(1650);
      expect(stats['cost-optimized'].errorRate).toBeCloseTo(0.33, 2);

      expect(stats['performance'].requestCount).toBe(2);
      expect(stats['performance'].averageResponseTime).toBe(1050);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].config).toBe('cost-optimized');
      expect(recommendations[0].issue).toBe('High error rate');
    });
  });
}); 