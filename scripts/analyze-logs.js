#!/usr/bin/env node

/**
 * 📊 LOG ANALYSIS TOOL
 * 
 * Analyzes collected production logs and generates insights
 * Usage: node scripts/analyze-logs.js [--export-csv] [--days=7]
 */

const fs = require('fs').promises;
const path = require('path');

const PRODUCTION_URL = 'https://www.okbuddy.io';
const LOG_DIR = path.join(__dirname, '..', 'logs', 'production-analysis');

class LogAnalyzer {
  constructor() {
    this.data = [];
    this.insights = {};
  }

  async analyze(options = {}) {
    console.log('📊 OKBUDDY LOG ANALYZER');
    console.log('========================');
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log('');

    // Collect fresh data
    await this.collectFreshData(options.days || 7);
    
    // Load existing analysis files
    await this.loadAnalysisFiles();
    
    // Generate insights
    this.generateInsights();
    
    // Display results
    this.displayResults();
    
    // Export if requested
    if (options.exportCsv) {
      await this.exportToCsv();
    }
    
    // Save comprehensive report
    await this.saveReport();
  }

  async collectFreshData(days) {
    console.log(`🔄 Collecting fresh data (${days} days)...`);
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/analytics/dashboard?environment=production&days=${days}`);
      const data = await response.json();
      
      const timestamp = new Date().toISOString();
      const filename = `fresh-data-${Date.now()}.json`;
      const filepath = path.join(LOG_DIR, filename);
      
      await fs.mkdir(LOG_DIR, { recursive: true });
      await fs.writeFile(filepath, JSON.stringify({ timestamp, data }, null, 2));
      
      console.log(`✅ Fresh data collected: ${filename}`);
      this.data.push({ timestamp, data, source: 'fresh' });
      
    } catch (error) {
      console.log(`⚠️  Could not collect fresh data: ${error.message}`);
    }
  }

  async loadAnalysisFiles() {
    console.log('📂 Loading existing analysis files...');
    
    try {
      const files = await fs.readdir(LOG_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filepath = path.join(LOG_DIR, file);
          const content = await fs.readFile(filepath, 'utf8');
          const parsed = JSON.parse(content);
          
          if (parsed.data || parsed.summary) {
            this.data.push({
              filename: file,
              timestamp: parsed.timestamp || parsed.collectionInfo?.timestamp,
              data: parsed.data || parsed,
              source: 'file'
            });
          }
        } catch (error) {
          console.log(`⚠️  Skipped ${file}: ${error.message}`);
        }
      }
      
      console.log(`✅ Loaded ${this.data.length} data points`);
      
    } catch (error) {
      console.log(`⚠️  Could not load analysis files: ${error.message}`);
    }
  }

  generateInsights() {
    console.log('🧠 Generating insights...');
    
    if (this.data.length === 0) {
      this.insights = {
        status: 'NO_DATA',
        message: 'No data available for analysis',
        recommendations: [
          'Share https://www.okbuddy.io with friends to generate user data',
          'Run the live monitor to collect real-time metrics',
          'Check back in a few hours after users visit the site'
        ]
      };
      return;
    }

    // Analyze trends
    this.insights = {
      status: 'DATA_AVAILABLE',
      totalDataPoints: this.data.length,
      timeRange: this.getTimeRange(),
      userActivity: this.analyzeUserActivity(),
      performance: this.analyzePerformance(),
      errors: this.analyzeErrors(),
      vercelMetrics: this.analyzeVercelMetrics(),
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations()
    };
  }

  getTimeRange() {
    if (this.data.length === 0) return null;
    
    const timestamps = this.data
      .map(d => d.timestamp)
      .filter(t => t)
      .sort();
    
    return {
      earliest: timestamps[0],
      latest: timestamps[timestamps.length - 1],
      span: timestamps.length > 1 ? 
        new Date(timestamps[timestamps.length - 1]) - new Date(timestamps[0]) : 0
    };
  }

  analyzeUserActivity() {
    const sessions = this.data.map(d => d.data?.summary?.totalSessions || 0);
    const maxSessions = Math.max(...sessions);
    const totalSessions = sessions.reduce((a, b) => a + b, 0);
    
    return {
      maxConcurrentSessions: maxSessions,
      totalSessionsRecorded: totalSessions,
      averageSessionsPerDataPoint: totalSessions / sessions.length || 0,
      hasUserActivity: maxSessions > 0
    };
  }

  analyzePerformance() {
    const performanceData = this.data
      .map(d => d.data?.summary?.averageMetrics)
      .filter(m => m && m.fcp > 0);
    
    if (performanceData.length === 0) {
      return { status: 'NO_PERFORMANCE_DATA' };
    }

    const fcpValues = performanceData.map(m => m.fcp);
    const lcpValues = performanceData.map(m => m.lcp);
    const ttfbValues = performanceData.map(m => m.ttfb);

    return {
      status: 'PERFORMANCE_DATA_AVAILABLE',
      fcp: {
        average: this.average(fcpValues),
        min: Math.min(...fcpValues),
        max: Math.max(...fcpValues)
      },
      lcp: {
        average: this.average(lcpValues),
        min: Math.min(...lcpValues),
        max: Math.max(...lcpValues)
      },
      ttfb: {
        average: this.average(ttfbValues),
        min: Math.min(...ttfbValues),
        max: Math.max(...ttfbValues)
      },
      overallScore: this.calculatePerformanceScore(performanceData)
    };
  }

  analyzeErrors() {
    const errorData = this.data.map(d => ({
      total: d.data?.summary?.totalErrors || 0,
      critical: d.data?.summary?.criticalErrors || 0
    }));

    const totalErrors = errorData.reduce((sum, e) => sum + e.total, 0);
    const criticalErrors = errorData.reduce((sum, e) => sum + e.critical, 0);

    return {
      totalErrors,
      criticalErrors,
      errorRate: totalErrors > 0 ? (criticalErrors / totalErrors) : 0,
      status: criticalErrors > 0 ? 'HAS_CRITICAL_ERRORS' : 
              totalErrors > 0 ? 'HAS_ERRORS' : 'NO_ERRORS'
    };
  }

  analyzeVercelMetrics() {
    const vercelData = this.data
      .map(d => d.data?.vercel)
      .filter(v => v && v.totalMetrics > 0);

    if (vercelData.length === 0) {
      return { status: 'NO_VERCEL_DATA' };
    }

    return {
      status: 'VERCEL_DATA_AVAILABLE',
      coldStarts: vercelData.reduce((sum, v) => sum + v.coldStarts, 0),
      timeouts: vercelData.reduce((sum, v) => sum + v.timeouts, 0),
      highMemoryUsage: vercelData.reduce((sum, v) => sum + v.highMemoryUsage, 0),
      totalMetrics: vercelData.reduce((sum, v) => sum + v.totalMetrics, 0)
    };
  }

  analyzeTrends() {
    if (this.data.length < 2) {
      return { status: 'INSUFFICIENT_DATA_FOR_TRENDS' };
    }

    // Simple trend analysis
    const sessions = this.data.map(d => d.data?.summary?.totalSessions || 0);
    const isGrowing = sessions[sessions.length - 1] > sessions[0];

    return {
      status: 'TRENDS_AVAILABLE',
      userGrowth: isGrowing ? 'GROWING' : 'STABLE',
      dataPoints: this.data.length,
      timeSpan: this.insights.timeRange?.span || 0
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.insights.userActivity?.hasUserActivity) {
      recommendations.push({
        priority: 'HIGH',
        category: 'User Acquisition',
        action: 'Generate Traffic',
        description: 'Share https://www.okbuddy.io with friends, colleagues, and social media to start collecting real user metrics'
      });
    }

    if (this.insights.performance?.status === 'PERFORMANCE_DATA_AVAILABLE') {
      const perf = this.insights.performance;
      if (perf.fcp.average > 1800) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Performance',
          action: 'Optimize FCP',
          description: `First Contentful Paint averaging ${Math.round(perf.fcp.average)}ms - consider optimizing critical resources`
        });
      }
    }

    if (this.insights.errors?.criticalErrors > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Reliability',
        action: 'Fix Critical Errors',
        description: `${this.insights.errors.criticalErrors} critical errors detected - investigate immediately`
      });
    }

    recommendations.push({
      priority: 'LOW',
      category: 'Monitoring',
      action: 'Regular Analysis',
      description: 'Run this analysis tool daily to track trends and catch issues early'
    });

    return recommendations;
  }

  calculatePerformanceScore(performanceData) {
    if (performanceData.length === 0) return 0;
    
    const avgFcp = this.average(performanceData.map(m => m.fcp));
    const avgLcp = this.average(performanceData.map(m => m.lcp));
    const avgTtfb = this.average(performanceData.map(m => m.ttfb));
    
    let score = 100;
    if (avgFcp > 1800) score -= 20;
    if (avgLcp > 2500) score -= 20;
    if (avgTtfb > 800) score -= 10;
    
    return Math.max(0, score);
  }

  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  displayResults() {
    console.log('');
    console.log('📊 ANALYSIS RESULTS');
    console.log('==================');
    
    if (this.insights.status === 'NO_DATA') {
      console.log('⏳ No data available for analysis');
      console.log('');
      console.log('🎯 RECOMMENDATIONS:');
      this.insights.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      return;
    }

    console.log(`📈 Data Points: ${this.insights.totalDataPoints}`);
    console.log(`⏰ Time Range: ${this.insights.timeRange?.earliest} to ${this.insights.timeRange?.latest}`);
    console.log('');

    // User Activity
    console.log('👥 USER ACTIVITY:');
    if (this.insights.userActivity.hasUserActivity) {
      console.log(`   Max Sessions: ${this.insights.userActivity.maxConcurrentSessions}`);
      console.log(`   Total Recorded: ${this.insights.userActivity.totalSessionsRecorded}`);
    } else {
      console.log('   No user activity detected yet');
    }
    console.log('');

    // Performance
    if (this.insights.performance.status === 'PERFORMANCE_DATA_AVAILABLE') {
      console.log('⚡ PERFORMANCE:');
      console.log(`   FCP: ${Math.round(this.insights.performance.fcp.average)}ms avg`);
      console.log(`   LCP: ${Math.round(this.insights.performance.lcp.average)}ms avg`);
      console.log(`   TTFB: ${Math.round(this.insights.performance.ttfb.average)}ms avg`);
      console.log(`   Score: ${this.insights.performance.overallScore}/100`);
      console.log('');
    }

    // Errors
    if (this.insights.errors.totalErrors > 0) {
      console.log('❌ ERRORS:');
      console.log(`   Total: ${this.insights.errors.totalErrors}`);
      console.log(`   Critical: ${this.insights.errors.criticalErrors}`);
      console.log('');
    }

    // Recommendations
    if (this.insights.recommendations.length > 0) {
      console.log('🎯 RECOMMENDATIONS:');
      this.insights.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.action}: ${rec.description}`);
      });
    }
  }

  async exportToCsv() {
    console.log('');
    console.log('📄 Exporting to CSV...');
    
    const csvData = this.data.map(d => ({
      timestamp: d.timestamp,
      source: d.source,
      totalSessions: d.data?.summary?.totalSessions || 0,
      totalErrors: d.data?.summary?.totalErrors || 0,
      criticalErrors: d.data?.summary?.criticalErrors || 0,
      fcp: d.data?.summary?.averageMetrics?.fcp || 0,
      lcp: d.data?.summary?.averageMetrics?.lcp || 0,
      ttfb: d.data?.summary?.averageMetrics?.ttfb || 0
    }));

    const csvContent = [
      'timestamp,source,totalSessions,totalErrors,criticalErrors,fcp,lcp,ttfb',
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const filename = `okbuddy-analysis-${Date.now()}.csv`;
    const filepath = path.join(LOG_DIR, filename);
    
    await fs.writeFile(filepath, csvContent);
    console.log(`✅ CSV exported: ${filename}`);
  }

  async saveReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      insights: this.insights,
      rawDataCount: this.data.length
    };

    const filename = `comprehensive-report-${Date.now()}.json`;
    const filepath = path.join(LOG_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log('');
    console.log(`📋 Comprehensive report saved: ${filename}`);
    console.log(`📁 All files saved to: ${LOG_DIR}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    exportCsv: args.includes('--export-csv'),
    days: args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) || 7 : 7
  };

  const analyzer = new LogAnalyzer();
  
  try {
    await analyzer.analyze(options);
    console.log('');
    console.log('✅ Analysis completed successfully!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LogAnalyzer;
