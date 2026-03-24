import { createClient } from '@supabase/supabase-js';
import { OAuthUserProfile, AccountLinkingResult } from './types';
import { SecurityService } from './security';
import { EmailConflictResolver } from './EmailConflictResolver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ProviderPreference {
  provider: string;
  priority: number;
  enabled: boolean;
  lastUsed?: string;
}

export interface ProviderManagementResult {
  success: boolean;
  message: string;
  linkedProviders: string[];
  error?: string;
}

export interface ProviderStatus {
  provider: string;
  linked: boolean;
  lastUsed?: string;
  linkedAt?: string;
  canUnlink: boolean;
  isPrimary: boolean;
}

export class MultiProviderManager {
  private supabase;
  private conflictResolver: EmailConflictResolver;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.conflictResolver = new EmailConflictResolver();
  }

  /**
   * Link multiple OAuth providers to a single account
   */
  public async linkProvider(
    userId: string,
    profile: OAuthUserProfile,
    isPrimary: boolean = false
  ): Promise<ProviderManagementResult> {
    try {
      // Validate account linking
      const isValid = await this.conflictResolver.validateAccountLinking(
        userId,
        profile.provider,
        profile.id
      );

      if (!isValid) {
        return {
          success: false,
          message: 'Provider linking validation failed',
          linkedProviders: await this.getLinkedProviders(userId),
          error: 'Security validation failed'
        };
      }

      // Check if provider is already linked
      const existingProvider = await this.getProviderData(userId, profile.provider);
      
      if (existingProvider) {
        // Update existing provider data
        await this.updateProviderData(userId, profile);
        
        SecurityService.logSecurityEvent('oauth_provider_updated', {
          userId,
          provider: profile.provider,
          email: profile.email
        });

        return {
          success: true,
          message: 'Provider updated successfully',
          linkedProviders: await this.getLinkedProviders(userId)
        };
      }

      // Link new provider
      await this.linkProviderToAccount(userId, profile, isPrimary);

      // Update provider priorities if this is set as primary
      if (isPrimary) {
        await this.setPrimaryProvider(userId, profile.provider);
      }

      SecurityService.logSecurityEvent('oauth_provider_linked', {
        userId,
        provider: profile.provider,
        email: profile.email,
        isPrimary
      });

      return {
        success: true,
        message: 'Provider linked successfully',
        linkedProviders: await this.getLinkedProviders(userId)
      };

    } catch (error) {
      console.error('❌ Error linking provider:', error);
      return {
        success: false,
        message: 'Failed to link provider',
        linkedProviders: await this.getLinkedProviders(userId),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unlink OAuth provider from account
   */
  public async unlinkProvider(
    userId: string,
    provider: string
  ): Promise<ProviderManagementResult> {
    try {
      // Check if provider can be unlinked (ensure at least one auth method remains)
      const canUnlink = await this.canUnlinkProvider(userId, provider);
      
      if (!canUnlink) {
        return {
          success: false,
          message: 'Cannot unlink provider - at least one authentication method must remain',
          linkedProviders: await this.getLinkedProviders(userId),
          error: 'Last authentication method'
        };
      }

      // Remove provider from account
      const { error } = await this.supabase
        .from('user_oauth_providers')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) {
        throw error;
      }

      // If this was the primary provider, set another as primary
      const remainingProviders = await this.getLinkedProviders(userId);
      if (remainingProviders.length > 0) {
        await this.setPrimaryProvider(userId, remainingProviders[0]);
      }

      SecurityService.logSecurityEvent('oauth_provider_unlinked', {
        userId,
        provider,
        remainingProviders: remainingProviders.length
      });

      return {
        success: true,
        message: 'Provider unlinked successfully',
        linkedProviders: remainingProviders
      };

    } catch (error) {
      console.error('❌ Error unlinking provider:', error);
      return {
        success: false,
        message: 'Failed to unlink provider',
        linkedProviders: await this.getLinkedProviders(userId),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider status for a user
   */
  public async getProviderStatus(userId: string): Promise<ProviderStatus[]> {
    try {
      const allProviders = ['google', 'linkedin']; // Add more providers as needed
      const linkedProviders = await this.getDetailedProviderData(userId);
      const primaryProvider = await this.getPrimaryProvider(userId);

      return allProviders.map(provider => {
        const linkedData = linkedProviders.find(p => p.provider === provider);
        
        return {
          provider,
          linked: !!linkedData,
          lastUsed: linkedData?.last_used_at,
          linkedAt: linkedData?.linked_at,
          canUnlink: linkedData ? this.canUnlinkProviderSync(linkedProviders, provider) : false,
          isPrimary: provider === primaryProvider
        };
      });

    } catch (error) {
      console.error('❌ Error getting provider status:', error);
      return [];
    }
  }

  /**
   * Set provider priority and preferences
   */
  public async setProviderPreferences(
    userId: string,
    preferences: ProviderPreference[]
  ): Promise<ProviderManagementResult> {
    try {
      // Validate preferences
      const validProviders = ['google', 'linkedin'];
      const invalidProviders = preferences.filter(p => !validProviders.includes(p.provider));
      
      if (invalidProviders.length > 0) {
        return {
          success: false,
          message: 'Invalid provider preferences',
          linkedProviders: await this.getLinkedProviders(userId),
          error: `Invalid providers: ${invalidProviders.map(p => p.provider).join(', ')}`
        };
      }

      // Update provider preferences
      for (const pref of preferences) {
        await this.updateProviderPreference(userId, pref);
      }

      SecurityService.logSecurityEvent('oauth_provider_preferences_updated', {
        userId,
        preferences: preferences.length
      });

      return {
        success: true,
        message: 'Provider preferences updated successfully',
        linkedProviders: await this.getLinkedProviders(userId)
      };

    } catch (error) {
      console.error('❌ Error setting provider preferences:', error);
      return {
        success: false,
        message: 'Failed to update provider preferences',
        linkedProviders: await this.getLinkedProviders(userId),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Switch primary authentication provider
   */
  public async switchPrimaryProvider(
    userId: string,
    newPrimaryProvider: string
  ): Promise<ProviderManagementResult> {
    try {
      // Verify the provider is linked
      const linkedProviders = await this.getLinkedProviders(userId);
      
      if (!linkedProviders.includes(newPrimaryProvider)) {
        return {
          success: false,
          message: 'Provider is not linked to this account',
          linkedProviders,
          error: 'Provider not linked'
        };
      }

      // Set as primary provider
      await this.setPrimaryProvider(userId, newPrimaryProvider);

      SecurityService.logSecurityEvent('oauth_primary_provider_changed', {
        userId,
        newPrimaryProvider,
        availableProviders: linkedProviders.length
      });

      return {
        success: true,
        message: 'Primary provider updated successfully',
        linkedProviders
      };

    } catch (error) {
      console.error('❌ Error switching primary provider:', error);
      return {
        success: false,
        message: 'Failed to switch primary provider',
        linkedProviders: await this.getLinkedProviders(userId),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider management analytics
   */
  public async getProviderAnalytics(userId: string): Promise<{
    totalProviders: number;
    activeProviders: number;
    mostUsedProvider: string | null;
    lastActivity: string | null;
    securityScore: number;
  }> {
    try {
      const providers = await this.getDetailedProviderData(userId);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const activeProviders = providers.filter(p => 
        new Date(p.last_used_at) > thirtyDaysAgo
      );

      const mostUsedProvider = providers.length > 0 
        ? providers.reduce((prev, current) => 
            new Date(prev.last_used_at) > new Date(current.last_used_at) ? prev : current
          )
        : null;

      const lastActivity = providers.length > 0 
        ? Math.max(...providers.map(p => new Date(p.last_used_at).getTime()))
        : null;

      // Calculate security score based on provider diversity and usage
      const securityScore = this.calculateSecurityScore(providers);

      return {
        totalProviders: providers.length,
        activeProviders: activeProviders.length,
        mostUsedProvider: mostUsedProvider?.provider || null,
        lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
        securityScore
      };

    } catch (error) {
      console.error('❌ Error getting provider analytics:', error);
      return {
        totalProviders: 0,
        activeProviders: 0,
        mostUsedProvider: null,
        lastActivity: null,
        securityScore: 0
      };
    }
  }

  // Private helper methods

  private async linkProviderToAccount(
    userId: string,
    profile: OAuthUserProfile,
    isPrimary: boolean = false
  ): Promise<void> {
    const providerData = {
      user_id: userId,
      provider: profile.provider,
      provider_user_id: profile.id,
      provider_email: profile.email,
      provider_data: profile.providerData,
      is_primary: isPrimary,
      linked_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('user_oauth_providers')
      .upsert(providerData, {
        onConflict: 'user_id,provider',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }
  }

  private async updateProviderData(userId: string, profile: OAuthUserProfile): Promise<void> {
    const { error } = await this.supabase
      .from('user_oauth_providers')
      .update({
        provider_data: profile.providerData,
        last_used_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', profile.provider);

    if (error) {
      throw error;
    }
  }

  private async getLinkedProviders(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_oauth_providers')
      .select('provider')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return (data || []).map(p => p.provider);
  }

  private async getDetailedProviderData(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_oauth_providers')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data || [];
  }

  private async getProviderData(userId: string, provider: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_oauth_providers')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  private async canUnlinkProvider(userId: string, provider: string): Promise<boolean> {
    // Check if user has password authentication
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError) {
      return false;
    }

    const hasPassword = user.password_hash && user.password_hash.length > 0;
    const linkedProviders = await this.getLinkedProviders(userId);

    // Can unlink if user has password OR has other providers
    return hasPassword || linkedProviders.filter(p => p !== provider).length > 0;
  }

  private canUnlinkProviderSync(providers: any[], provider: string): boolean {
    // Simplified sync version for status checks
    return providers.filter(p => p.provider !== provider).length > 0;
  }

  private async setPrimaryProvider(userId: string, provider: string): Promise<void> {
    // First, remove primary flag from all providers
    await this.supabase
      .from('user_oauth_providers')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Then set the new primary provider
    await this.supabase
      .from('user_oauth_providers')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('provider', provider);
  }

  private async getPrimaryProvider(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_oauth_providers')
      .select('provider')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.provider;
  }

  private async updateProviderPreference(userId: string, preference: ProviderPreference): Promise<void> {
    const { error } = await this.supabase
      .from('user_oauth_providers')
      .update({
        priority: preference.priority,
        enabled: preference.enabled
      })
      .eq('user_id', userId)
      .eq('provider', preference.provider);

    if (error) {
      throw error;
    }
  }

  private calculateSecurityScore(providers: any[]): number {
    let score = 0;

    // Base score for having OAuth providers
    score += providers.length * 20;

    // Bonus for provider diversity
    if (providers.length >= 2) {
      score += 20;
    }

    // Bonus for recent activity
    const recentActivity = providers.filter(p => {
      const lastUsed = new Date(p.last_used_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return lastUsed > thirtyDaysAgo;
    });

    score += recentActivity.length * 10;

    // Cap at 100
    return Math.min(score, 100);
  }
} 