#!/usr/bin/env node

/**
 * 🚀 PRODUCTION LOG COLLECTOR
 * 
 * Collects and analyzes logs from OkBuddy production environment
 * Usage: node scripts/production-log-collector.js [options]
 */

const fs = require('fs').promises;
const path = require('path');

const PRODUCTION_URL = 'https://www.okbuddy.io';
const LOG_DIR = path.join(__dirname, '..', 'logs', 'production-analysis');

class ProductionLogCollector {
  constructor() {
    this.startTime = new Date();
    this.collectionId = `collection-${Date.now()}`;
  }

  async init() {
    console.log('🚀 OKBUDDY PRODUCTION LOG COLLECTOR');
    console.log('=====================================');
    console.log(`📅 Started: ${this.startTime.toISOString()}`);
    console.log(`🆔 Collection ID: ${this.collectionId}`);
    console.log(`🌐 Target: ${PRODUCTION_URL}`);
    console.log('');

    // Ensure log directory exists
    await fs.mkdir(LOG_DIR, { recursive: true });
  }

  async collectDashboardData(days = 7) {
    console.log(`📊 Collecting dashboard data (${days} days)...`);
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/analytics/dashboard?environment=production&days=${days}`);
      const data = await response.json();
      
      const filename = `dashboard-${this.collectionId}.json`;
      const filepath = path.join(LOG_DIR, filename);
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`✅ Dashboard data saved: ${filename}`);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to collect dashboard data:', error.message);
      return null;
    }
  }

  async collectPerformanceData() {
    console.log('⚡ Collecting performance metrics...');
    
    try {
      // Simulate real user metrics that would be collected
      const testMetrics = {
        environment: 'production',
        timestamp: new Date().toISOString(),
        url: PRODUCTION_URL,
        userAgent: 'Production Log Collector',
        metrics: [
          { name: 'fcp', value: 800 },
          { name: 'lcp', value: 1200 },
          { name: 'ttfb', value: 200 }
        ]
      };

      const response = await fetch(`${PRODUCTION_URL}/api/analytics/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMetrics)
      });

      const result = await response.json();
      console.log('✅ Performance test completed');
      
      return result;
    } catch (error) {
      console.error('❌ Failed to test performance endpoint:', error.message);
      return null;
    }
  }

  async generateReport(dashboardData) {
    console.log('📋 Generating analysis report...');
    
    const report = {
      collectionInfo: {
        id: this.collectionId,
        timestamp: this.startTime.toISOString(),
        productionUrl: PRODUCTION_URL
      },
      summary: dashboardData?.summary || { message: 'No data collected yet' },
      analysis: this.analyzeData(dashboardData),
      recommendations: this.generateRecommendations(dashboardData),
      nextSteps: [
        'Share the production URL with friends to generate real user data',
        'Monitor the dashboard endpoint for incoming metrics',
        'Run this collector script periodically to track trends',
        'Set up automated alerts for performance issues'
      ]
    };

    const filename = `analysis-report-${this.collectionId}.json`;
    const filepath = path.join(LOG_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`✅ Analysis report saved: ${filename}`);
    
    return report;
  }

  analyzeData(data) {
    if (!data || !data.summary) {
      return {
        status: 'NO_DATA',
        message: 'No production data available yet. Share the site with friends to generate metrics!'
      };
    }

    const { summary } = data;
    const analysis = {
      userActivity: summary.totalSessions > 0 ? 'ACTIVE' : 'WAITING_FOR_USERS',
      performanceStatus: this.assessPerformance(summary.averageMetrics),
      errorRate: summary.totalErrors > 0 ? (summary.criticalErrors / summary.totalErrors) : 0,
      healthScore: this.calculateHealthScore(summary)
    };

    return analysis;
  }

  assessPerformance(metrics) {
    if (!metrics || metrics.fcp === 0) return 'NO_DATA';
    
    if (metrics.fcp < 1800 && metrics.lcp < 2500 && metrics.ttfb < 800) {
      return 'EXCELLENT';
    } else if (metrics.fcp < 3000 && metrics.lcp < 4000 && metrics.ttfb < 1200) {
      return 'GOOD';
    } else {
      return 'NEEDS_IMPROVEMENT';
    }
  }

  calculateHealthScore(summary) {
    if (summary.totalSessions === 0) return 'AWAITING_DATA';
    
    let score = 100;
    if (summary.totalErrors > 0) score -= (summary.totalErrors * 5);
    if (summary.criticalErrors > 0) score -= (summary.criticalErrors * 20);
    
    return Math.max(0, score);
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    if (!data || data.summary.totalSessions === 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Generate User Traffic',
        description: 'Share https://www.okbuddy.io with friends and colleagues to start collecting real user metrics'
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      action: 'Monitor Regularly',
      description: 'Run this collector script daily to track performance trends'
    });

    recommendations.push({
      priority: 'LOW',
      action: 'Set Up Alerts',
      description: 'Configure automated monitoring for performance degradation'
    });

    return recommendations;
  }

  async printSummary(report) {
    console.log('');
    console.log('📊 COLLECTION SUMMARY');
    console.log('====================');
    console.log(`🆔 Collection ID: ${report.collectionInfo.id}`);
    console.log(`📅 Timestamp: ${report.collectionInfo.timestamp}`);
    console.log(`🌐 Production URL: ${report.collectionInfo.productionUrl}`);
    console.log('');
    
    if (report.summary.totalSessions > 0) {
      console.log('📈 METRICS COLLECTED:');
      console.log(`   Sessions: ${report.summary.totalSessions}`);
      console.log(`   Errors: ${report.summary.totalErrors}`);
      console.log(`   Performance: ${report.analysis.performanceStatus}`);
    } else {
      console.log('⏳ WAITING FOR DATA:');
      console.log('   No user sessions detected yet.');
      console.log('   Share the site to start collecting metrics!');
    }
    
    console.log('');
    console.log('🎯 NEXT STEPS:');
    report.nextSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
    
    console.log('');
    console.log(`📁 Reports saved to: ${LOG_DIR}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const days = args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) || 7 : 7;
  
  const collector = new ProductionLogCollector();
  
  try {
    await collector.init();
    
    const dashboardData = await collector.collectDashboardData(days);
    await collector.collectPerformanceData();
    
    const report = await collector.generateReport(dashboardData);
    await collector.printSummary(report);
    
    console.log('');
    console.log('✅ Collection completed successfully!');
    
  } catch (error) {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionLogCollector;
