import { NextRequest, NextResponse } from 'next/server';
import { cvParserService } from '../../../shared/services/cvParserService';

/**
 * CV Parser Cost Monitoring API
 * GET /api/cv-parser-stats
 * Returns current cost tracking statistics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get cost statistics from the CV parser service
    const stats = cvParserService.getCostStats();
    
    // Add additional calculated metrics
    const enhancedStats = {
      ...stats,
      formattedTotalCost: `$${stats.totalCost.toFixed(4)}`,
      formattedAverageCost: `$${stats.averageCostPerRequest.toFixed(4)}`,
      efficiency: {
        tokensPerDollar: stats.totalCost > 0 ? Math.round(stats.totalTokensUsed / stats.totalCost) : 0,
        averageProcessingCost: stats.averageCostPerRequest,
        dailySessionCount: stats.sessionsToday
      },
      projections: {
        monthlyCostAtCurrentRate: stats.sessionsToday > 0 
          ? (stats.totalCost / stats.sessionsToday) * 30 * stats.sessionsToday
          : 0,
        costPer1000Sessions: stats.totalRequests > 0
          ? (stats.totalCost / stats.totalRequests) * 1000
          : 0
      }
    };

    console.log('📊 CV Parser Stats requested:', {
      totalRequests: stats.totalRequests,
      totalCost: stats.totalCost,
      sessionsToday: stats.sessionsToday,
      averageTokensPerRequest: Math.round(stats.averageTokensPerRequest)
    });

    return NextResponse.json({
      success: true,
      data: enhancedStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CV Parser stats error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve CV parser statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 