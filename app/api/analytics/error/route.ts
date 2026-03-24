/**
 * Error Analytics API Endpoint
 * Collects and analyzes critical errors from both local and production
 */

import { NextRequest, NextResponse } from 'next/server'

interface ErrorPayload {
  type: 'javascript' | 'network' | 'auth' | 'component' | 'api'
  message: string
  stack?: string
  url: string
  timestamp: number
  environment: string
  sessionId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export async function POST(request: NextRequest) {
  try {
    const error: ErrorPayload = await request.json()
    
    // Log error immediately
    console.error(`🚨 ${error.severity.toUpperCase()} ERROR [${error.environment}]:`)
    console.error(`Type: ${error.type}`)
    console.error(`Message: ${error.message}`)
    console.error(`URL: ${error.url}`)
    console.error(`Session: ${error.sessionId}`)
    
    if (error.stack) {
      console.error(`Stack: ${error.stack}`)
    }
    
    // Analyze error patterns
    const errorAnalysis = analyzeError(error)
    if (errorAnalysis.length > 0) {
      console.error('🔍 ERROR ANALYSIS:')
      errorAnalysis.forEach(analysis => {
        console.error(`  ${analysis}`)
      })
    }
    
    // Store error for analysis
    await storeErrorData(error)
    
    // Send alerts for critical errors
    if (error.severity === 'critical') {
      await sendCriticalErrorAlert(error)
    }
    
    return NextResponse.json({ 
      success: true,
      analysis: errorAnalysis
    })
    
  } catch (err) {
    console.error('❌ Failed to process error report:', err)
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}

function analyzeError(error: ErrorPayload): string[] {
  const analysis: string[] = []
  
  // Auth-related errors
  if (error.type === 'auth' || error.message.includes('auth')) {
    analysis.push('AUTH ISSUE: Check authentication caching and token validity')
    if (error.environment === 'vercel') {
      analysis.push('VERCEL AUTH: Check environment variables and OAuth configuration')
    }
  }
  
  // Network errors
  if (error.type === 'network' || error.message.includes('fetch') || error.message.includes('network')) {
    analysis.push('NETWORK ISSUE: Check API endpoints and network connectivity')
    if (error.environment === 'vercel') {
      analysis.push('VERCEL NETWORK: Possible cold start or function timeout')
    }
  }
  
  // Component loading errors
  if (error.type === 'component' || error.message.includes('import') || error.message.includes('module')) {
    analysis.push('COMPONENT ISSUE: Check dynamic imports and lazy loading')
  }
  
  // API errors
  if (error.type === 'api' || error.url.includes('/api/')) {
    analysis.push('API ISSUE: Check API route implementation and database connectivity')
    if (error.environment === 'vercel') {
      analysis.push('VERCEL API: Check function timeout and memory limits')
    }
  }
  
  // JavaScript errors
  if (error.type === 'javascript') {
    if (error.message.includes('Cannot read property') || error.message.includes('Cannot read properties')) {
      analysis.push('NULL/UNDEFINED: Check for null/undefined values before property access')
    }
    
    if (error.message.includes('is not a function')) {
      analysis.push('FUNCTION ERROR: Check function definitions and imports')
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('blocked')) {
      analysis.push('PERMISSION ERROR: Check CORS, CSP, or browser security policies')
    }
  }
  
  return analysis
}

async function storeErrorData(error: ErrorPayload) {
  try {
    const { promises: fs } = await import('fs')
    const { join } = await import('path')
    
    const logDir = join(process.cwd(), 'logs', 'errors')
    await fs.mkdir(logDir, { recursive: true })
    
    const filename = `${error.environment}-errors-${new Date().toISOString().split('T')[0]}.jsonl`
    const filepath = join(logDir, filename)
    
    const logEntry = JSON.stringify({
      ...error,
      receivedAt: new Date().toISOString()
    }) + '\n'
    
    await fs.appendFile(filepath, logEntry)
    
  } catch (err) {
    console.error('Failed to store error data:', err)
  }
}

async function sendCriticalErrorAlert(error: ErrorPayload) {
  try {
    // In production, this would send to Slack, email, or monitoring service
    console.error('🚨 CRITICAL ERROR ALERT:')
    console.error(`Environment: ${error.environment}`)
    console.error(`Type: ${error.type}`)
    console.error(`Message: ${error.message}`)
    console.error(`URL: ${error.url}`)
    console.error(`Time: ${new Date(error.timestamp).toISOString()}`)
    
    // TODO: Integrate with alerting service
    // await sendSlackAlert(error)
    // await sendEmailAlert(error)
    
  } catch (err) {
    console.error('Failed to send critical error alert:', err)
  }
}
