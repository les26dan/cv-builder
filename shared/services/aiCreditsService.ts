/**
 * ===================================================================
 * AI CREDITS SERVICE - MONETIZATION SYSTEM CORE
 * ===================================================================
 * 
 * MISSION CRITICAL: This service manages the entire AI credits system
 * for OkBuddy's monetization model. Handles:
 * 
 * 1. Credit balance checking and display
 * 2. Credit deduction for AI feature usage
 * 3. Credit purchases and payment tracking
 * 4. Guest user credit display (5 credits visible, login required)
 * 5. Real-time balance updates and notifications
 * 
 * SECURITY: All database operations use service-level authentication
 * to ensure proper credit tracking and prevent tampering.
 * ===================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { databaseService } from './database'

/**
 * AI Credits related types
 */
export interface AICreditsBalance {
  success: boolean
  balance?: number
  used?: number
  purchased?: number
  updated_at?: string
  error?: string
}

export interface CreditDeductionResult {
  success: boolean
  new_balance?: number
  credits_deducted?: number
  error?: string
  current_balance?: number
}

export interface CreditAdditionResult {
  success: boolean
  new_balance?: number
  credits_added?: number
  transaction_id?: string
  error?: string
}

export interface AITransaction {
  id: string
  user_id: string
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'referral'
  credits_amount: number
  package_type?: string
  amount_paid?: number
  currency?: string
  payment_method?: string
  payment_reference?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  ai_feature_used?: string
  created_at: string
}

export interface CreditPackage {
  id: string
  credits: number
  price_usd: number
  price_vnd: number
  package_type: 'basic' | 'popular' | 'value'
  is_popular?: boolean
  discount_percentage?: number
  savings_text?: string
}

/**
 * AI Features that consume credits
 */
export enum AIFeature {
  SUMMARY_GENERATE = 'summary_generate',
  SUMMARY_IMPROVE = 'summary_improve',
  EXPERIENCE_WIZARD = 'experience_wizard',
  ACHIEVEMENT_WIZARD = 'achievement_wizard',
  BULLET_IMPROVE = 'bullet_improve',
  SKILLS_SUGGEST = 'skills_suggest'
}

/**
 * Credit Packages as per Product Specification
 */
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'basic',
    credits: 10,
    price_usd: 9.99,
    price_vnd: 49000,
    package_type: 'basic'
  },
  {
    id: 'popular',
    credits: 25,
    price_usd: 14.99,
    price_vnd: 69000,
    package_type: 'popular',
    is_popular: true,
    discount_percentage: 25,
    savings_text: 'Limited Time'
  },
  {
    id: 'value',
    credits: 50,
    price_usd: 34.99,
    price_vnd: 169000,
    package_type: 'value',
    discount_percentage: 30,
    savings_text: 'Best Value'
  }
]

/**
 * AI Credits Service - Main Implementation
 */
export class AICreditsService {
  private static instance: AICreditsService
  private supabase: any

  private constructor() {
    this.initializeService()
  }

  public static getInstance(): AICreditsService {
    if (!AICreditsService.instance) {
      AICreditsService.instance = new AICreditsService()
    }
    return AICreditsService.instance
  }

  private async initializeService(): Promise<void> {
    try {
      // Use database service to get Supabase client
      this.supabase = await databaseService.getClient()
      if (!this.supabase) {
        throw new Error('Failed to initialize Supabase client for AI credits')
      }
      console.log('✅ AI Credits Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize AI Credits Service:', error)
      throw error
    }
  }

  /**
   * ===================================================================
   * GUEST USER FUNCTIONS
   * ===================================================================
   */

  /**
   * Get guest user credits display (always shows 5)
   * Used for unauthenticated users to see credit counter
   */
  public getGuestCreditsDisplay(): AICreditsBalance {
    return {
      success: true,
      balance: 5,
      used: 0,
      purchased: 0,
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Check if user is guest and show login requirement
   */
  public requiresLoginForAI(userId?: string): boolean {
    return !userId || userId.startsWith('guest-')
  }

  /**
   * ===================================================================
   * AUTHENTICATED USER FUNCTIONS
   * ===================================================================
   */

  /**
   * Get current AI credits balance for authenticated user
   */
  public async getCreditsBalance(userId: string): Promise<AICreditsBalance> {
    try {
      if (!this.supabase) {
        await this.initializeService()
      }

      // Call the database function for credit balance
      const { data, error } = await this.supabase.rpc('get_ai_credits_balance', {
        p_user_id: userId
      })

      if (error) {
        console.error('❌ Failed to get credits balance:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Failed to retrieve balance'
        }
      }

      return {
        success: true,
        balance: data.balance,
        used: data.used,
        purchased: data.purchased,
        updated_at: data.updated_at
      }

    } catch (error) {
      console.error('❌ Error getting credits balance:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if user has sufficient credits for AI feature
   */
  public async checkSufficientCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const balance = await this.getCreditsBalance(userId)
    return balance.success && (balance.balance || 0) >= requiredCredits
  }

  /**
   * ===================================================================
   * CREDIT DEDUCTION FUNCTIONS
   * ===================================================================
   */

  /**
   * Deduct credits for AI feature usage
   * This is the core monetization function
   */
  public async deductCreditsForAI(
    userId: string, 
    feature: AIFeature, 
    creditsToDeduct: number = 1,
    sessionId?: string
  ): Promise<CreditDeductionResult> {
    try {
      if (!this.supabase) {
        await this.initializeService()
      }

      // First check if user has sufficient credits
      const hasCredits = await this.checkSufficientCredits(userId, creditsToDeduct)
      if (!hasCredits) {
        const currentBalance = await this.getCreditsBalance(userId)
        return {
          success: false,
          error: 'Insufficient credits',
          current_balance: currentBalance.balance || 0
        }
      }

      // Call the database function to deduct credits
      const { data, error } = await this.supabase.rpc('deduct_ai_credits', {
        p_user_id: userId,
        p_credits_amount: creditsToDeduct,
        p_ai_feature: feature,
        p_session_id: sessionId
      })

      if (error) {
        console.error('❌ Failed to deduct credits:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Failed to deduct credits',
          current_balance: data?.current_balance
        }
      }

      console.log(`✅ Credits deducted: ${creditsToDeduct} for ${feature}, new balance: ${data.new_balance}`)

      return {
        success: true,
        new_balance: data.new_balance,
        credits_deducted: data.credits_deducted
      }

    } catch (error) {
      console.error('❌ Error deducting credits:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * ===================================================================
   * CREDIT PURCHASE FUNCTIONS
   * ===================================================================
   */

  /**
   * Add credits for successful purchase
   */
  public async addCreditsForPurchase(
    userId: string,
    packageData: {
      credits: number
      packageType: string
      amountPaid: number
      currency: string
      paymentMethod: string
      paymentReference: string
    }
  ): Promise<CreditAdditionResult> {
    try {
      if (!this.supabase) {
        await this.initializeService()
      }

      // Call the database function to add credits
      const { data, error } = await this.supabase.rpc('add_ai_credits', {
        p_user_id: userId,
        p_credits_amount: packageData.credits,
        p_package_type: packageData.packageType,
        p_amount_paid: packageData.amountPaid,
        p_currency: packageData.currency,
        p_payment_method: packageData.paymentMethod,
        p_payment_reference: packageData.paymentReference
      })

      if (error) {
        console.error('❌ Failed to add credits:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Failed to add credits'
        }
      }

      console.log(`✅ Credits added: ${packageData.credits} for purchase, new balance: ${data.new_balance}`)

      return {
        success: true,
        new_balance: data.new_balance,
        credits_added: data.credits_added,
        transaction_id: data.transaction_id
      }

    } catch (error) {
      console.error('❌ Error adding credits:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get credit packages for market
   */
  public getCreditPackages(market: 'vietnam' | 'international'): CreditPackage[] {
    return CREDIT_PACKAGES.map(pkg => ({
      ...pkg,
      price: market === 'vietnam' ? pkg.price_vnd : pkg.price_usd,
      currency: market === 'vietnam' ? 'VND' : 'USD'
    }))
  }

  /**
   * ===================================================================
   * TRANSACTION HISTORY FUNCTIONS
   * ===================================================================
   */

  /**
   * Get user's transaction history
   */
  public async getTransactionHistory(userId: string, limit: number = 50): Promise<AITransaction[]> {
    try {
      if (!this.supabase) {
        await this.initializeService()
      }

      const { data, error } = await this.supabase
        .from('ai_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Failed to get transaction history:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('❌ Error getting transaction history:', error)
      return []
    }
  }

  /**
   * ===================================================================
   * UTILITY FUNCTIONS
   * ===================================================================
   */

  /**
   * Get color class for credit balance display
   */
  public getBalanceColorClass(balance: number): string {
    if (balance >= 10) return 'text-green-600'
    if (balance >= 3) return 'text-orange-600'
    return 'text-red-600'
  }

  /**
   * Get background color class for credit balance display
   */
  public getBalanceBackgroundClass(balance: number): string {
    if (balance >= 10) return 'bg-green-50'
    if (balance >= 3) return 'bg-orange-50'
    return 'bg-red-50'
  }

  /**
   * Format credits display text
   */
  public formatCreditsDisplay(balance: number): string {
    return `${balance} credit${balance !== 1 ? 's' : ''}`
  }

  /**
   * Check if should show low balance warning
   */
  public shouldShowLowBalanceWarning(balance: number): boolean {
    return balance <= 2 && balance > 0
  }

  /**
   * Check if should show zero balance state
   */
  public shouldShowZeroBalanceState(balance: number): boolean {
    return balance === 0
  }

  /**
   * ===================================================================
   * FEATURE-SPECIFIC WRAPPERS
   * ===================================================================
   */

  /**
   * Deduct credits for Summary generation/improvement
   */
  public async deductCreditsForSummary(userId: string, isGenerate: boolean, sessionId?: string): Promise<CreditDeductionResult> {
    const feature = isGenerate ? AIFeature.SUMMARY_GENERATE : AIFeature.SUMMARY_IMPROVE
    return this.deductCreditsForAI(userId, feature, 1, sessionId)
  }

  /**
   * Deduct credits for Work Experience wizard
   */
  public async deductCreditsForWorkExperience(userId: string, isNewExperience: boolean, sessionId?: string): Promise<CreditDeductionResult> {
    const feature = isNewExperience ? AIFeature.EXPERIENCE_WIZARD : AIFeature.ACHIEVEMENT_WIZARD
    return this.deductCreditsForAI(userId, feature, 1, sessionId)
  }

  /**
   * Deduct credits for individual bullet improvement
   */
  public async deductCreditsForBulletImprovement(userId: string, sessionId?: string): Promise<CreditDeductionResult> {
    return this.deductCreditsForAI(userId, AIFeature.BULLET_IMPROVE, 1, sessionId)
  }

  /**
   * Deduct credits for Skills suggestions
   */
  public async deductCreditsForSkillsSuggestions(userId: string, sessionId?: string): Promise<CreditDeductionResult> {
    return this.deductCreditsForAI(userId, AIFeature.SKILLS_SUGGEST, 1, sessionId)
  }
}

/**
 * Export singleton instance
 */
export const aiCreditsService = AICreditsService.getInstance()

/**
 * ===================================================================
 * CONVENIENCE FUNCTIONS FOR COMPONENTS
 * ===================================================================
 */

/**
 * Quick credit check before AI feature usage
 * Returns true if user can use feature, false if needs payment
 */
export async function canUseAIFeature(userId?: string): Promise<boolean> {
  if (!userId || userId.startsWith('guest-')) {
    return false // Guest users cannot use AI features
  }

  const creditsService = AICreditsService.getInstance()
  return await creditsService.checkSufficientCredits(userId, 1)
}

/**
 * Get credits display data for any user (guest or authenticated)
 */
export async function getCreditsDisplayData(userId?: string): Promise<AICreditsBalance> {
  const creditsService = AICreditsService.getInstance()
  
  if (!userId || userId.startsWith('guest-')) {
    return creditsService.getGuestCreditsDisplay()
  }

  return await creditsService.getCreditsBalance(userId)
}

/**
 * Execute AI feature with automatic credit deduction
 * Use this wrapper in AI feature components
 */
export async function executeAIFeatureWithCredits<T>(
  userId: string,
  feature: AIFeature,
  aiFunction: () => Promise<T>,
  sessionId?: string
): Promise<{ success: boolean; data?: T; error?: string; needsPayment?: boolean }> {
  const creditsService = AICreditsService.getInstance()

  // Check if guest user
  if (creditsService.requiresLoginForAI(userId)) {
    return {
      success: false,
      error: 'Login required for AI features',
      needsPayment: false
    }
  }

  // Check sufficient credits
  const hasCredits = await creditsService.checkSufficientCredits(userId, 1)
  if (!hasCredits) {
    return {
      success: false,
      error: 'Insufficient credits',
      needsPayment: true
    }
  }

  try {
    // Execute the AI function
    const result = await aiFunction()

    // Only deduct credits if AI function succeeded
    const deductionResult = await creditsService.deductCreditsForAI(userId, feature, 1, sessionId)
    
    if (!deductionResult.success) {
      console.warn('⚠️ AI function succeeded but credit deduction failed:', deductionResult.error)
      // Still return success since AI function worked
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('❌ AI function failed, no credits deducted:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI feature failed'
    }
  }
}
