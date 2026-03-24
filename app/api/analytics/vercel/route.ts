/**
 * Vercel-Specific Analytics Endpoint
 * Collects Vercel deployment and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'

interface VercelMetric {
  name: string
  value: any
  timestamp: number
  region?: string
  deploymentId?: string
  environment: string
}

export async function POST(request: NextRequest) {
  try {
    const metric: VercelMetric = await request.json()
    
    // Log Vercel-specific metrics
    console.log('🚀 VERCEL METRIC RECEIVED:')
    console.log(`Name: ${metric.name}`)
    console.log(`Value: ${metric.value}`)
    console.log(`Region: ${metric.region}`)
    console.log(`Deployment: ${metric.deploymentId}`)
    console.log(`Environment: ${metric.environment}`)
    
    // Analyze Vercel-specific issues
    const issues = analyzeVercelMetric(metric)
    if (issues.length > 0) {
      console.log('⚠️ VERCEL ISSUES DETECTED:')
      issues.forEach(issue => {
        console.log(`  ${issue}`)
      })
    }
    
    // Store Vercel metrics
    await storeVercelMetric(metric)
    
    return NextResponse.json({ 
      success: true,
      issues
    })
    
  } catch (error) {
    console.error('❌ Failed to process Vercel metric:', error)
    return NextResponse.json(
      { error: 'Failed to process Vercel metric' },
      { status: 500 }
    )
  }
}

function analyzeVercelMetric(metric: VercelMetric): string[] {
  const issues: string[] = []
  
  switch (metric.name) {
    case 'coldStart':
      if (metric.value === true) {
        issues.push('COLD START: Function experienced cold start - consider warming strategies')
      }
      break
      
    case 'possibleColdStart':
      if (metric.value > 5000) {
        issues.push(`SLOW COLD START: ${metric.value}ms initial load - optimize bundle size`)
      }
      break
      
    case 'slowApiCall':
      if (metric.value > 8000) {
        issues.push(`API TIMEOUT RISK: ${metric.value}ms call approaching 10s Vercel limit`)
      }
      break
      
    case 'timeoutError':
      issues.push(`FUNCTION TIMEOUT: ${metric.value}ms - exceeded Vercel function timeout`)
      break
      
    case 'highMemoryUsage':
      if (metric.value > 900) {
        issues.push(`MEMORY LIMIT RISK: ${metric.value}MB approaching 1024MB Vercel limit`)
      }
      break
      
    case 'cacheStatus':
      if (metric.value === 'MISS') {
        issues.push('CACHE MISS: Consider optimizing caching strategy for better performance')
      }
      break
  }
  
  // Region-specific analysis
  if (metric.region && metric.name.includes('function_')) {
    const duration = metric.value
    if (duration > 2000) {
      issues.push(`SLOW FUNCTION in ${metric.region}: ${duration}ms - consider regional optimization`)
    }
  }
  
  return issues
}

async function storeVercelMetric(metric: VercelMetric) {
  try {
    const { promises: fs } = await import('fs')
    const { join } = await import('path')
    
    const logDir = join(process.cwd(), 'logs', 'vercel')
    await fs.mkdir(logDir, { recursive: true })
    
    const filename = `vercel-metrics-${new Date().toISOString().split('T')[0]}.jsonl`
    const filepath = join(logDir, filename)
    
    const logEntry = JSON.stringify({
      ...metric,
      receivedAt: new Date().toISOString(),
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA
    }) + '\n'
    
    await fs.appendFile(filepath, logEntry)
    
  } catch (error) {
    console.error('Failed to store Vercel metric:', error)
  }
}
