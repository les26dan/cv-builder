#!/usr/bin/env node

/**
 * 🔴 LIVE PRODUCTION MONITOR
 * 
 * Real-time monitoring of OkBuddy production performance
 * Usage: node scripts/live-monitor.js
 */

const PRODUCTION_URL = 'https://www.okbuddy.io';
const MONITOR_INTERVAL = 30000; // 30 seconds

class LiveMonitor {
  constructor() {
    this.isRunning = false;
    this.sessionCount = 0;
    this.lastMetrics = null;
    this.alerts = [];
  }

  async start() {
    console.clear();
    console.log('🔴 OKBUDDY LIVE PRODUCTION MONITOR');
    console.log('==================================');
    console.log(`🌐 Monitoring: ${PRODUCTION_URL}`);
    console.log(`⏱️  Interval: ${MONITOR_INTERVAL / 1000}s`);
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Press Ctrl+C to stop monitoring');
    console.log('');

    this.isRunning = true;
    
    // Set up graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping monitor...');
      this.isRunning = false;
      process.exit(0);
    });

    // Start monitoring loop
    while (this.isRunning) {
      await this.checkStatus();
      await this.sleep(MONITOR_INTERVAL);
    }
  }

  async checkStatus() {
    const timestamp = new Date().toLocaleString();
    
    try {
      // Check dashboard endpoint
      const startTime = Date.now();
      const response = await fetch(`${PRODUCTION_URL}/api/analytics/dashboard?environment=production&days=1`);
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      this.updateDisplay(timestamp, responseTime, data);
      this.checkForAlerts(data, responseTime);
      
    } catch (error) {
      this.displayError(timestamp, error);
    }
  }

  updateDisplay(timestamp, responseTime, data) {
    // Clear screen and show header
    console.clear();
    console.log('🔴 OKBUDDY LIVE PRODUCTION MONITOR');
    console.log('==================================');
    console.log(`🌐 ${PRODUCTION_URL}`);
    console.log(`🕐 Last Update: ${timestamp}`);
    console.log(`⚡ API Response: ${responseTime}ms`);
    console.log('');

    // Show current metrics
    console.log('📊 CURRENT METRICS:');
    console.log('-------------------');
    
    if (data.summary.totalSessions > 0) {
      console.log(`👥 Total Sessions: ${data.summary.totalSessions}`);
      console.log(`❌ Total Errors: ${data.summary.totalErrors}`);
      console.log(`🚨 Critical Errors: ${data.summary.criticalErrors}`);
      
      if (data.summary.averageMetrics.fcp > 0) {
        console.log('');
        console.log('⚡ PERFORMANCE:');
        console.log(`   FCP: ${data.summary.averageMetrics.fcp}ms`);
        console.log(`   LCP: ${data.summary.averageMetrics.lcp}ms`);
        console.log(`   TTFB: ${data.summary.averageMetrics.ttfb}ms`);
      }
      
      if (data.vercel.totalMetrics > 0) {
        console.log('');
        console.log('☁️  VERCEL METRICS:');
        console.log(`   Cold Starts: ${data.vercel.coldStarts}`);
        console.log(`   Timeouts: ${data.vercel.timeouts}`);
        console.log(`   High Memory: ${data.vercel.highMemoryUsage}`);
      }
    } else {
      console.log('⏳ Waiting for user activity...');
      console.log('💡 Share the site with friends to see metrics!');
    }

    // Show alerts
    if (this.alerts.length > 0) {
      console.log('');
      console.log('🚨 ACTIVE ALERTS:');
      console.log('----------------');
      this.alerts.slice(-5).forEach(alert => {
        console.log(`   ${alert.time}: ${alert.message}`);
      });
    }

    // Show instructions
    console.log('');
    console.log('📋 ACTIONS:');
    console.log('-----------');
    console.log('• Share https://www.okbuddy.io with friends');
    console.log('• Watch for real-time performance data');
    console.log('• Press Ctrl+C to stop monitoring');
    
    this.sessionCount++;
  }

  checkForAlerts(data, responseTime) {
    const now = new Date().toLocaleString();
    
    // API response time alert
    if (responseTime > 2000) {
      this.addAlert(now, `Slow API response: ${responseTime}ms`);
    }
    
    // Error rate alert
    if (data.summary.criticalErrors > 0) {
      this.addAlert(now, `Critical errors detected: ${data.summary.criticalErrors}`);
    }
    
    // Performance alerts
    if (data.summary.averageMetrics.fcp > 3000) {
      this.addAlert(now, `Slow FCP: ${data.summary.averageMetrics.fcp}ms`);
    }
    
    if (data.summary.averageMetrics.lcp > 4000) {
      this.addAlert(now, `Slow LCP: ${data.summary.averageMetrics.lcp}ms`);
    }
  }

  addAlert(time, message) {
    this.alerts.push({ time, message });
    // Keep only last 10 alerts
    if (this.alerts.length > 10) {
      this.alerts = this.alerts.slice(-10);
    }
  }

  displayError(timestamp, error) {
    console.clear();
    console.log('🔴 OKBUDDY LIVE PRODUCTION MONITOR');
    console.log('==================================');
    console.log(`🕐 ${timestamp}`);
    console.log('');
    console.log('❌ CONNECTION ERROR:');
    console.log(`   ${error.message}`);
    console.log('');
    console.log('🔄 Retrying in 30 seconds...');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start monitoring
if (require.main === module) {
  const monitor = new LiveMonitor();
  monitor.start().catch(console.error);
}

module.exports = LiveMonitor;
