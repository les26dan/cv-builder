/**
 * Performance Analytics API Endpoint
 * Collects and stores performance metrics from both local and production
 */

import { NextRequest, NextResponse } from 'next/server'

interface PerformancePayload {
  sessionId: string
  environment: 'local' | 'vercel' | 'unknown'
  metrics: Array<{
    name: string
    value: number
    timestamp: number
    url: string
    userAgent?: string
  }>
  errors: Array<{
    type: string
    message: string
    severity: string
    timestamp: number
  }>
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: PerformancePayload = await request.json()
    
    // Log performance metrics for analysis
    console.log('📊 PERFORMANCE METRICS RECEIVED:')
    console.log(`Environment: ${payload.environment}`)
    console.log(`Session: ${payload.sessionId}`)
    console.log(`URL: ${payload.url}`)
    console.log(`Metrics count: ${payload.metrics.length}`)
    console.log(`Errors count: ${payload.errors.length}`)
    
    // Log critical metrics
    const criticalMetrics = payload.metrics.filter(m => 
      ['fcp', 'lcp', 'ttfb', 'authCheckTime', 'windowLoad'].includes(m.name)
    )
    
    if (criticalMetrics.length > 0) {
      console.log('🎯 CRITICAL METRICS:')
      criticalMetrics.forEach(metric => {
        console.log(`  ${metric.name.toUpperCase()}: ${metric.value.toFixed(2)}ms`)
      })
    }
    
    // Log errors
    if (payload.errors.length > 0) {
      console.log('🚨 ERRORS DETECTED:')
      payload.errors.forEach(error => {
        console.log(`  [${error.severity.toUpperCase()}] ${error.type}: ${error.message}`)
      })
    }
    
    // Analyze performance issues
    const performanceIssues = analyzePerformanceIssues(payload)
    if (performanceIssues.length > 0) {
      console.log('⚠️ PERFORMANCE ISSUES DETECTED:')
      performanceIssues.forEach(issue => {
        console.log(`  ${issue}`)
      })
    }
    
    // Store in database (if available) or file system for analysis
    await storePerformanceData(payload)
    
    // Send to external analytics if configured
    if (process.env.VERCEL_ANALYTICS_ID) {
      await sendToVercelAnalytics(payload)
    }
    
    return NextResponse.json({ 
      success: true, 
      received: payload.metrics.length,
      issues: performanceIssues
    })
    
  } catch (error) {
    console.error('❌ Failed to process performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    )
  }
}

function analyzePerformanceIssues(payload: PerformancePayload): string[] {
  const issues: string[] = []
  
  // Check Core Web Vitals
  const fcp = payload.metrics.find(m => m.name === 'fcp')?.value
  const lcp = payload.metrics.find(m => m.name === 'lcp')?.value
  const ttfb = payload.metrics.find(m => m.name === 'ttfb')?.value
  const authTime = payload.metrics.find(m => m.name === 'authCheckTime')?.value
  
  if (fcp && fcp > 1800) {
    issues.push(`SLOW FCP: ${fcp.toFixed(0)}ms (should be < 1800ms)`)
  }
  
  if (lcp && lcp > 2500) {
    issues.push(`SLOW LCP: ${lcp.toFixed(0)}ms (should be < 2500ms)`)
  }
  
  if (ttfb && ttfb > 800) {
    issues.push(`SLOW TTFB: ${ttfb.toFixed(0)}ms (should be < 800ms) - ${payload.environment === 'vercel' ? 'Vercel cold start?' : 'Local server issue?'}`)
  }
  
  if (authTime && authTime > 2000) {
    issues.push(`SLOW AUTH: ${authTime.toFixed(0)}ms (should be < 2000ms) - Check auth caching`)
  }
  
  // Check bundle sizes
  const jsSize = payload.metrics.find(m => m.name === 'jsSize')?.value
  const totalSize = payload.metrics.find(m => m.name === 'totalSize')?.value
  
  if (jsSize && jsSize > 500000) { // 500KB
    issues.push(`LARGE JS BUNDLE: ${(jsSize / 1024).toFixed(0)}KB (should be < 500KB)`)
  }
  
  if (totalSize && totalSize > 2000000) { // 2MB
    issues.push(`LARGE TOTAL SIZE: ${(totalSize / 1024 / 1024).toFixed(1)}MB (should be < 2MB)`)
  }
  
  // Check for critical errors
  const criticalErrors = payload.errors.filter(e => e.severity === 'critical')
  if (criticalErrors.length > 0) {
    issues.push(`CRITICAL ERRORS: ${criticalErrors.length} critical errors detected`)
  }
  
  return issues
}

async function storePerformanceData(payload: PerformancePayload) {
  try {
    // For now, store in a simple JSON file for analysis
    // In production, this would go to a proper database
    const fs = require('fs').promises
    const path = require('path')
    
    const logDir = path.join(process.cwd(), 'logs', 'performance')
    await fs.mkdir(logDir, { recursive: true })
    
    const filename = `${payload.environment}-${new Date().toISOString().split('T')[0]}.jsonl`
    const filepath = path.join(logDir, filename)
    
    const logEntry = JSON.stringify({
      ...payload,
      receivedAt: new Date().toISOString()
    }) + '\n'
    
    await fs.appendFile(filepath, logEntry)
    
  } catch (error) {
    console.error('Failed to store performance data:', error)
  }
}

async function sendToVercelAnalytics(payload: PerformancePayload) {
  try {
    // Send key metrics to Vercel Analytics
    const keyMetrics = payload.metrics.filter(m => 
      ['fcp', 'lcp', 'ttfb', 'authCheckTime'].includes(m.name)
    )
    
    // This would integrate with Vercel Analytics API
    console.log('📈 Would send to Vercel Analytics:', keyMetrics.length, 'metrics')
    
  } catch (error) {
    console.error('Failed to send to Vercel Analytics:', error)
  }
}
