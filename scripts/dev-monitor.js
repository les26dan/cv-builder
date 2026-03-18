#!/usr/bin/env node

/**
 * Local Development Performance Monitor
 * Tracks performance during development and provides real-time feedback
 * Following OkBuddy tenets: performance optimization, development efficiency
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

class DevMonitor {
  constructor() {
    this.startTime = Date.now()
    this.metrics = []
    this.logFile = path.join(__dirname, '..', 'logs', 'dev-performance.log')
    this.isMonitoring = false
    
    this.ensureLogDirectory()
    this.startMonitoring()
  }
  
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }
  
  startMonitoring() {
    console.log('🔍 Starting development performance monitoring...')
    this.isMonitoring = true
    
    // Monitor server startup
    this.monitorServerStartup()
    
    // Monitor build times
    this.monitorBuildTimes()
    
    // Monitor hot reload performance
    this.monitorHotReload()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
    
    // Generate periodic reports
    this.startPeriodicReporting()
  }
  
  monitorServerStartup() {
    const startupStart = Date.now()
    
    // Check when server becomes responsive
    const checkServer = () => {
      const http = require('http')
      
      const req = http.get('http://localhost:3000', (res) => {
        const startupTime = Date.now() - startupStart
        this.logMetric('server_startup', startupTime)
        console.log(`🚀 Server startup: ${startupTime}ms`)
        
        if (startupTime > 10000) {
          console.warn(`⚠️ Slow server startup: ${startupTime}ms`)
        }
      })
      
      req.on('error', () => {
        // Server not ready yet, try again
        setTimeout(checkServer, 1000)
      })
      
      req.setTimeout(1000)
    }
    
    setTimeout(checkServer, 2000) // Give server time to start
  }
  
  monitorBuildTimes() {
    // Monitor Next.js build output
    const originalConsoleLog = console.log
    
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Track compilation times
      if (message.includes('Compiled') && message.includes('in')) {
        const timeMatch = message.match(/in ([\d.]+)s/)
        if (timeMatch) {
          const compileTime = parseFloat(timeMatch[1]) * 1000
          this.logMetric('compilation_time', compileTime)
          
          if (compileTime > 5000) {
            console.warn(`⚠️ Slow compilation: ${compileTime}ms`)
          }
        }
      }
      
      // Track hot reload
      if (message.includes('Fast Refresh')) {
        this.logMetric('hot_reload', Date.now())
        console.log('🔥 Hot reload triggered')
      }
      
      originalConsoleLog.apply(console, args)
    }
  }
  
  monitorHotReload() {
    // Watch for file changes
    const chokidar = require('chokidar')
    
    const watcher = chokidar.watch(['app/**/*', 'components/**/*', 'lib/**/*'], {
      ignored: /node_modules/,
      persistent: true
    })
    
    let lastChange = Date.now()
    
    watcher.on('change', (filePath) => {
      const now = Date.now()
      const timeSinceLastChange = now - lastChange
      lastChange = now
      
      console.log(`📝 File changed: ${filePath}`)
      this.logMetric('file_change', timeSinceLastChange)
      
      // Track hot reload performance
      setTimeout(() => {
        this.checkPageResponse()
      }, 2000)
    })
  }
  
  async checkPageResponse() {
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000')
      const responseTime = Date.now() - startTime
      
      this.logMetric('page_response_after_change', responseTime)
      
      if (responseTime > 2000) {
        console.warn(`⚠️ Slow page response after change: ${responseTime}ms`)
      } else {
        console.log(`✅ Page responsive after change: ${responseTime}ms`)
      }
    } catch (error) {
      console.error(`❌ Page not responsive after change: ${error.message}`)
    }
  }
  
  monitorMemoryUsage() {
    setInterval(() => {
      const usage = process.memoryUsage()
      const usedMB = usage.heapUsed / 1024 / 1024
      
      this.logMetric('memory_usage', usedMB)
      
      if (usedMB > 500) {
        console.warn(`🧠 High memory usage: ${usedMB.toFixed(2)}MB`)
      }
      
      // Log memory stats every 5 minutes
      if (Date.now() % 300000 < 10000) {
        console.log(`💾 Memory: ${usedMB.toFixed(2)}MB heap, ${(usage.rss / 1024 / 1024).toFixed(2)}MB RSS`)
      }
    }, 10000) // Check every 10 seconds
  }
  
  logMetric(name, value) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      environment: 'local',
      session: 'dev-session'
    }
    
    this.metrics.push(metric)
    
    // Write to log file
    const logEntry = JSON.stringify(metric) + '\n'
    fs.appendFileSync(this.logFile, logEntry)
  }
  
  startPeriodicReporting() {
    setInterval(() => {
      this.generateReport()
    }, 60000) // Every minute
    
    // Generate report on exit
    process.on('SIGINT', () => {
      console.log('\n📊 Generating final development performance report...')
      this.generateReport()
      process.exit(0)
    })
  }
  
  generateReport() {
    const now = Date.now()
    const sessionDuration = now - this.startTime
    
    // Group metrics by type
    const metricsByType = {}
    for (const metric of this.metrics) {
      if (!metricsByType[metric.name]) {
        metricsByType[metric.name] = []
      }
      metricsByType[metric.name].push(metric.value)
    }
    
    console.log('\n📊 DEVELOPMENT PERFORMANCE REPORT:')
    console.log(`Session duration: ${Math.round(sessionDuration / 1000)}s`)
    console.log(`Total metrics: ${this.metrics.length}`)
    
    for (const [name, values] of Object.entries(metricsByType)) {
      if (values.length === 0) continue
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      console.log(`${name}: avg=${Math.round(avg)}ms, min=${Math.round(min)}ms, max=${Math.round(max)}ms (${values.length} samples)`)
    }
    
    // Identify issues
    const issues = this.identifyIssues(metricsByType)
    if (issues.length > 0) {
      console.log('\n⚠️ ISSUES IDENTIFIED:')
      issues.forEach(issue => {
        console.log(`  ${issue}`)
      })
    } else {
      console.log('\n✅ No performance issues detected')
    }
  }
  
  identifyIssues(metricsByType) {
    const issues = []
    
    // Check compilation times
    if (metricsByType.compilation_time) {
      const avg = metricsByType.compilation_time.reduce((a, b) => a + b, 0) / metricsByType.compilation_time.length
      if (avg > 3000) {
        issues.push(`Slow compilation: ${Math.round(avg)}ms average`)
      }
    }
    
    // Check server startup
    if (metricsByType.server_startup) {
      const startupTime = metricsByType.server_startup[0]
      if (startupTime > 8000) {
        issues.push(`Slow server startup: ${Math.round(startupTime)}ms`)
      }
    }
    
    // Check memory usage
    if (metricsByType.memory_usage) {
      const maxMemory = Math.max(...metricsByType.memory_usage)
      if (maxMemory > 800) {
        issues.push(`High memory usage: ${Math.round(maxMemory)}MB peak`)
      }
    }
    
    // Check page response times
    if (metricsByType.page_response_after_change) {
      const avg = metricsByType.page_response_after_change.reduce((a, b) => a + b, 0) / metricsByType.page_response_after_change.length
      if (avg > 1500) {
        issues.push(`Slow hot reload response: ${Math.round(avg)}ms average`)
      }
    }
    
    return issues
  }
}

// Start monitoring if this script is run directly
if (require.main === module) {
  new DevMonitor()
}

module.exports = DevMonitor
