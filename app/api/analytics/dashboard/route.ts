/**
 * Performance Analytics Dashboard API
 * Provides aggregated performance data for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment') || 'all'
    const days = parseInt(searchParams.get('days') || '7')
    
    // Read performance logs
    const performanceData = await readPerformanceLogs(environment, days)
    const errorData = await readErrorLogs(environment, days)
    const vercelData = await readVercelLogs(days)
    
    // Aggregate metrics
    const dashboard = {
      summary: generateSummary(performanceData, errorData),
      performance: aggregatePerformanceMetrics(performanceData),
      errors: aggregateErrorMetrics(errorData),
      vercel: aggregateVercelMetrics(vercelData),
      trends: generateTrends(performanceData, days),
      alerts: generateAlerts(performanceData, errorData, vercelData)
    }
    
    return NextResponse.json(dashboard)
    
  } catch (error) {
    console.error('Failed to generate dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to generate dashboard' },
      { status: 500 }
    )
  }
}

async function readPerformanceLogs(environment: string, days: number) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'performance')
    const files = await readdir(logsDir)
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const relevantFiles = files.filter(file => {
      if (environment !== 'all' && !file.startsWith(environment)) return false
      
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) return false
      
      const fileDate = new Date(dateMatch[1])
      return fileDate >= cutoffDate
    })
    
    const allData = []
    for (const file of relevantFiles) {
      const content = await readFile(join(logsDir, file), 'utf-8')
      const lines = content.trim().split('\n').filter(line => line)
      
      for (const line of lines) {
        try {
          allData.push(JSON.parse(line))
        } catch (e) {
          console.warn('Failed to parse log line:', line)
        }
      }
    }
    
    return allData
  } catch (error) {
    console.warn('No performance logs found:', error)
    return []
  }
}

async function readErrorLogs(environment: string, days: number) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'errors')
    const files = await readdir(logsDir)
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const relevantFiles = files.filter(file => {
      if (environment !== 'all' && !file.startsWith(environment)) return false
      
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) return false
      
      const fileDate = new Date(dateMatch[1])
      return fileDate >= cutoffDate
    })
    
    const allData = []
    for (const file of relevantFiles) {
      const content = await readFile(join(logsDir, file), 'utf-8')
      const lines = content.trim().split('\n').filter(line => line)
      
      for (const line of lines) {
        try {
          allData.push(JSON.parse(line))
        } catch (e) {
          console.warn('Failed to parse error log line:', line)
        }
      }
    }
    
    return allData
  } catch (error) {
    console.warn('No error logs found:', error)
    return []
  }
}

async function readVercelLogs(days: number) {
  try {
    const logsDir = join(process.cwd(), 'logs', 'vercel')
    const files = await readdir(logsDir)
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const relevantFiles = files.filter(file => {
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) return false
      
      const fileDate = new Date(dateMatch[1])
      return fileDate >= cutoffDate
    })
    
    const allData = []
    for (const file of relevantFiles) {
      const content = await readFile(join(logsDir, file), 'utf-8')
      const lines = content.trim().split('\n').filter(line => line)
      
      for (const line of lines) {
        try {
          allData.push(JSON.parse(line))
        } catch (e) {
          console.warn('Failed to parse Vercel log line:', line)
        }
      }
    }
    
    return allData
  } catch (error) {
    console.warn('No Vercel logs found:', error)
    return []
  }
}

function generateSummary(performanceData: any[], errorData: any[]) {
  const totalSessions = new Set(performanceData.map(d => d.sessionId)).size
  const totalErrors = errorData.length
  const criticalErrors = errorData.filter(e => e.severity === 'critical').length
  
  // Calculate average metrics
  const allMetrics = performanceData.flatMap(d => d.metrics || [])
  const fcpMetrics = allMetrics.filter(m => m.name === 'fcp').map(m => m.value)
  const lcpMetrics = allMetrics.filter(m => m.name === 'lcp').map(m => m.value)
  const ttfbMetrics = allMetrics.filter(m => m.name === 'ttfb').map(m => m.value)
  
  const avgFcp = fcpMetrics.length > 0 ? fcpMetrics.reduce((a, b) => a + b, 0) / fcpMetrics.length : 0
  const avgLcp = lcpMetrics.length > 0 ? lcpMetrics.reduce((a, b) => a + b, 0) / lcpMetrics.length : 0
  const avgTtfb = ttfbMetrics.length > 0 ? ttfbMetrics.reduce((a, b) => a + b, 0) / ttfbMetrics.length : 0
  
  return {
    totalSessions,
    totalErrors,
    criticalErrors,
    averageMetrics: {
      fcp: Math.round(avgFcp),
      lcp: Math.round(avgLcp),
      ttfb: Math.round(avgTtfb)
    }
  }
}

function aggregatePerformanceMetrics(data: any[]) {
  const metrics = data.flatMap(d => d.metrics || [])
  
  const metricsByName = {}
  for (const metric of metrics) {
    if (!metricsByName[metric.name]) {
      metricsByName[metric.name] = []
    }
    metricsByName[metric.name].push(metric.value)
  }
  
  const aggregated = {}
  for (const [name, values] of Object.entries(metricsByName)) {
    const numValues = values as number[]
    aggregated[name] = {
      count: numValues.length,
      average: Math.round(numValues.reduce((a, b) => a + b, 0) / numValues.length),
      min: Math.min(...numValues),
      max: Math.max(...numValues),
      p95: Math.round(numValues.sort((a, b) => a - b)[Math.floor(numValues.length * 0.95)] || 0)
    }
  }
  
  return aggregated
}

function aggregateErrorMetrics(data: any[]) {
  const errorsByType = {}
  const errorsBySeverity = {}
  
  for (const error of data) {
    // By type
    if (!errorsByType[error.type]) {
      errorsByType[error.type] = 0
    }
    errorsByType[error.type]++
    
    // By severity
    if (!errorsBySeverity[error.severity]) {
      errorsBySeverity[error.severity] = 0
    }
    errorsBySeverity[error.severity]++
  }
  
  return {
    byType: errorsByType,
    bySeverity: errorsBySeverity,
    total: data.length
  }
}

function aggregateVercelMetrics(data: any[]) {
  const coldStarts = data.filter(d => d.name === 'coldStart').length
  const timeouts = data.filter(d => d.name === 'timeoutError').length
  const highMemory = data.filter(d => d.name === 'highMemoryUsage').length
  
  return {
    coldStarts,
    timeouts,
    highMemoryUsage: highMemory,
    totalMetrics: data.length
  }
}

function generateTrends(data: any[], days: number) {
  // Group by day
  const dailyMetrics = {}
  
  for (const entry of data) {
    const date = new Date(entry.timestamp).toISOString().split('T')[0]
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = { fcp: [], lcp: [], ttfb: [] }
    }
    
    for (const metric of entry.metrics || []) {
      if (['fcp', 'lcp', 'ttfb'].includes(metric.name)) {
        dailyMetrics[date][metric.name].push(metric.value)
      }
    }
  }
  
  // Calculate daily averages
  const trends = {}
  for (const [date, metrics] of Object.entries(dailyMetrics)) {
    trends[date] = {}
    for (const [name, values] of Object.entries(metrics)) {
      const numValues = values as number[]
      trends[date][name] = numValues.length > 0 ? 
        Math.round(numValues.reduce((a, b) => a + b, 0) / numValues.length) : 0
    }
  }
  
  return trends
}

function generateAlerts(performanceData: any[], errorData: any[], vercelData: any[]) {
  const alerts = []
  
  // Performance alerts
  const recentMetrics = performanceData
    .filter(d => Date.now() - d.timestamp < 3600000) // Last hour
    .flatMap(d => d.metrics || [])
  
  const recentFcp = recentMetrics.filter(m => m.name === 'fcp').map(m => m.value)
  const recentLcp = recentMetrics.filter(m => m.name === 'lcp').map(m => m.value)
  
  if (recentFcp.length > 0) {
    const avgFcp = recentFcp.reduce((a, b) => a + b, 0) / recentFcp.length
    if (avgFcp > 2000) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `High FCP: ${Math.round(avgFcp)}ms average in last hour`
      })
    }
  }
  
  if (recentLcp.length > 0) {
    const avgLcp = recentLcp.reduce((a, b) => a + b, 0) / recentLcp.length
    if (avgLcp > 3000) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `High LCP: ${Math.round(avgLcp)}ms average in last hour`
      })
    }
  }
  
  // Error alerts
  const recentErrors = errorData.filter(e => Date.now() - e.timestamp < 3600000)
  const criticalErrors = recentErrors.filter(e => e.severity === 'critical')
  
  if (criticalErrors.length > 0) {
    alerts.push({
      type: 'error',
      severity: 'critical',
      message: `${criticalErrors.length} critical errors in last hour`
    })
  }
  
  // Vercel alerts
  const recentVercel = vercelData.filter(d => Date.now() - d.timestamp < 3600000)
  const coldStarts = recentVercel.filter(d => d.name === 'coldStart')
  
  if (coldStarts.length > 5) {
    alerts.push({
      type: 'vercel',
      severity: 'medium',
      message: `${coldStarts.length} cold starts in last hour`
    })
  }
  
  return alerts
}
