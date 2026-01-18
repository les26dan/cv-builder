/**
 * Subscription Service
 * Handles user subscription status and premium feature access
 * Following tenet #7: Security is Sacred from the Beginning
 */

export interface UserSubscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  features: string[];
  creditsRemaining?: number;
  creditsTotal?: number;
  expiresAt?: Date;
  trialEndsAt?: Date;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredPlan: 'free' | 'premium' | 'enterprise';
  creditCost?: number;
}

// Premium features configuration
export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  APPLY_ALL: {
    id: 'apply_all',
    name: 'Apply All Suggestions',
    description: 'Apply all AI suggestions with one click to optimize your CV instantly',
    requiredPlan: 'premium'
  },
  ADVANCED_SUGGESTIONS: {
    id: 'advanced_suggestions',
    name: 'Advanced AI Suggestions',
    description: 'Get sophisticated AI-powered suggestions beyond basic recommendations',
    requiredPlan: 'premium',
    creditCost: 1
  },
  UNLIMITED_ANALYSIS: {
    id: 'unlimited_analysis',
    name: 'Unlimited JD Analysis',
    description: 'Analyze unlimited job descriptions without limits',
    requiredPlan: 'premium'
  },
  PRIORITY_SUPPORT: {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get priority customer support and faster response times',
    requiredPlan: 'premium'
  }
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private currentUser: UserSubscription | null = null;

  private constructor() {
    // Initialize with empty state - will load on first use with real user
    this.currentUser = null;
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private async loadUserSubscription(userId: string) {
    // Load real subscription data from database
    try {
      // TODO: Implement real subscription API calls
      // For now, default to basic free plan
      this.currentUser = {
        id: `sub_${userId}`,
        userId: userId,
        plan: 'free',
        status: 'active',
        features: [],
        creditsRemaining: 3,
        creditsTotal: 3,
        expiresAt: undefined,
        trialEndsAt: undefined
      };
    } catch (error) {
      console.error('Failed to load user subscription:', error);
      // Set default free plan on error
      this.currentUser = null;
    }
  }

  /**
   * Check if user has access to a premium feature
   */
  public hasFeatureAccess(featureId: string): boolean {
    if (!this.currentUser) return false;

    const feature = PREMIUM_FEATURES[featureId];
    if (!feature) return false;

    // Always allow for enterprise plan
    if (this.currentUser.plan === 'enterprise') return true;

    // Check if user's plan meets the requirement
    if (feature.requiredPlan === 'premium') {
      const userPlan = this.currentUser.plan as 'free' | 'premium' | 'enterprise';
      return userPlan === 'premium' || userPlan === 'enterprise';
    }
    
    if (feature.requiredPlan === 'enterprise') {
      // @ts-ignore - TypeScript strict type checking issue
      return this.currentUser.plan === 'enterprise';
    }

    return false;
  }

  /**
   * Check if user can use a credit-based feature
   */
  public canUseCredits(featureId: string): boolean {
    if (!this.currentUser) return false;

    const feature = PREMIUM_FEATURES[featureId];
    if (!feature || !feature.creditCost) return true;

    // Premium users have unlimited usage
    if (this.hasFeatureAccess(featureId)) return true;

    // Free users can use credits
    return (this.currentUser.creditsRemaining || 0) >= feature.creditCost;
  }

  /**
   * Consume credits for a feature
   */
  public async consumeCredits(featureId: string): Promise<{ success: boolean; creditsRemaining: number; error?: string }> {
    if (!this.currentUser) {
      return { success: false, creditsRemaining: 0, error: 'No user session' };
    }

    const feature = PREMIUM_FEATURES[featureId];
    if (!feature || !feature.creditCost) {
      return { success: true, creditsRemaining: this.currentUser.creditsRemaining || 0 };
    }

    // Premium users don't consume credits
    if (this.hasFeatureAccess(featureId)) {
      return { success: true, creditsRemaining: this.currentUser.creditsRemaining || 0 };
    }

    // Check if user has enough credits
    const currentCredits = this.currentUser.creditsRemaining || 0;
    if (currentCredits < feature.creditCost) {
      return { 
        success: false, 
        creditsRemaining: currentCredits, 
        error: 'Không đủ credits. Hãy nâng cấp để sử dụng tính năng này.' 
      };
    }

    // Consume credits
    this.currentUser.creditsRemaining = currentCredits - feature.creditCost;

    // In production, this would be an API call to update the backend
    // For now, save to localStorage for testing
    localStorage.setItem('okbuddy_user_credits', this.currentUser.creditsRemaining.toString());

    console.log('Credits consumed:', {
      featureId,
      creditCost: feature.creditCost,
      creditsRemaining: this.currentUser.creditsRemaining
    });

    return { 
      success: true, 
      creditsRemaining: this.currentUser.creditsRemaining 
    };
  }

  /**
   * Get current user subscription
   */
  public getCurrentSubscription(): UserSubscription | null {
    return this.currentUser;
  }

  /**
   * Check if user is on a premium plan
   */
  public isPremiumUser(): boolean {
    return this.currentUser?.plan === 'premium' || this.currentUser?.plan === 'enterprise';
  }

  /**
   * Check if user is on a free plan
   */
  public isFreeUser(): boolean {
    return this.currentUser?.plan === 'free';
  }

  /**
   * Get upgrade URL for current user
   */
  public getUpgradeUrl(): string {
    // In production, this would be the actual payment/upgrade URL
    return '/upgrade-to-premium';
  }

  /**
   * Get feature details
   */
  public getFeature(featureId: string): PremiumFeature | null {
    return PREMIUM_FEATURES[featureId] || null;
  }

  /**
   * Mock upgrade to premium (for testing)
   */
  public mockUpgradeToPremium(): void {
    if (this.currentUser) {
      this.currentUser.plan = 'premium';
      this.currentUser.features = Object.keys(PREMIUM_FEATURES);
      localStorage.setItem('okbuddy_test_subscription', JSON.stringify({
        plan: 'premium',
        features: Object.keys(PREMIUM_FEATURES)
      }));
      console.log('User upgraded to Premium (mock)');
    }
  }

  /**
   * Mock downgrade to free (for testing)
   */
  public mockDowngradeToFree(): void {
    if (this.currentUser) {
      this.currentUser.plan = 'free';
      this.currentUser.features = [];
      this.currentUser.creditsRemaining = 3;
      localStorage.setItem('okbuddy_test_subscription', JSON.stringify({
        plan: 'free',
        features: [],
        creditsRemaining: 3
      }));
      console.log('User downgraded to Free (mock)');
    }
  }

  /**
   * Reset credits (for testing)
   */
  public mockResetCredits(): void {
    if (this.currentUser) {
      this.currentUser.creditsRemaining = 3;
      localStorage.setItem('okbuddy_user_credits', '3');
      console.log('Credits reset to 3 (mock)');
    }
  }
} 