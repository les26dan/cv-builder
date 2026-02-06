import { createClient } from '@supabase/supabase-js';
import { OAuthUserProfile, AccountLinkingResult } from './types';
import { SecurityService } from './security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface ConflictResolutionResult {
  action: 'merge' | 'link' | 'create' | 'reject';
  user?: any;
  conflictType: 'email_exists' | 'provider_exists' | 'multiple_accounts' | 'none';
  resolution: string;
  securityFlags?: string[];
}

export class EmailConflictResolver {
  private supabase: any | null;
  private supabaseService: any | null;

  constructor() {
    // Validate Supabase configuration
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ EmailConflictResolver: Supabase not configured - using mock mode');
      this.supabase = null;
      this.supabaseService = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      // Service client for operations that need to bypass RLS (like user creation)
      this.supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  /**
   * Handle existing account when OAuth profile has same email
   */
  public async handleExistingAccount(
    existingUser: any, 
    oauthProfile: OAuthUserProfile
  ): Promise<AccountLinkingResult> {
    try {
      // Check if this provider is already linked to this account
      const existingProvider = await this.checkExistingProvider(existingUser.id, oauthProfile.provider);
      
      if (existingProvider) {
        // Provider already linked - update last used time and profile data
        await this.updateProviderData(existingUser.id, oauthProfile);
        
        SecurityService.logSecurityEvent('oauth_existing_provider_login', {
          userId: existingUser.id,
          provider: oauthProfile.provider,
          email: oauthProfile.email
        });

        return {
          action: 'login',
          user: await this.enrichUserWithProviders(existingUser),
          isNewAccount: false,
          linkedProviders: await this.getLinkedProviders(existingUser.id)
        };
      }

      // Check for security concerns
      const securityFlags = await this.performSecurityChecks(existingUser, oauthProfile);
      
      if (securityFlags.length > 0) {
        SecurityService.logSecurityEvent('oauth_security_flag', {
          userId: existingUser.id,
          provider: oauthProfile.provider,
          email: oauthProfile.email,
          flags: securityFlags
        });
      }

      // Link new provider to existing account
      await this.linkProviderToAccount(existingUser.id, oauthProfile);
      
      // Update user profile with OAuth data if beneficial
      const updatedUser = await this.enhanceUserProfile(existingUser, oauthProfile);

      SecurityService.logSecurityEvent('oauth_provider_linked', {
        userId: existingUser.id,
        provider: oauthProfile.provider,
        email: oauthProfile.email
      });

      return {
        action: 'login',
        user: updatedUser,
        isNewAccount: false,
        linkedProviders: await this.getLinkedProviders(existingUser.id)
      };

    } catch (error) {
      console.error('❌ Error handling existing account:', error);
      throw error;
    }
  }

  /**
   * Handle new account creation from OAuth profile
   */
  public async handleNewAccount(
    oauthProfile: OAuthUserProfile
  ): Promise<AccountLinkingResult> {
    try {
      // Perform security checks for new account
      const securityFlags = await this.performNewAccountSecurityChecks(oauthProfile);
      
      if (securityFlags.includes('suspicious_activity')) {
        SecurityService.logSecurityEvent('oauth_new_account_blocked', {
          provider: oauthProfile.provider,
          email: oauthProfile.email,
          flags: securityFlags
        });
        
        throw new Error('Account creation blocked due to security concerns');
      }

      // Create new account
      const newUser = await this.createAccountFromOAuth(oauthProfile);
      
      // Link OAuth provider
      await this.linkProviderToAccount(newUser.id, oauthProfile);

      SecurityService.logSecurityEvent('oauth_new_account_created', {
        userId: newUser.id,
        provider: oauthProfile.provider,
        email: oauthProfile.email
      });

      return {
        action: 'register',
        user: newUser,
        isNewAccount: true,
        linkedProviders: [oauthProfile.provider]
      };

    } catch (error) {
      console.error('❌ Error handling new account:', error);
      throw error;
    }
  }

  /**
   * Validate account linking for security
   */
  public async validateAccountLinking(
    userId: string, 
    provider: string, 
    providerId: string
  ): Promise<boolean> {
    try {
      // Check if provider is already linked to another account (production schema)
      const { data: existingLink, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('oauth_provider', provider)
        .eq('oauth_id', providerId)
        .neq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingLink) {
        SecurityService.logSecurityEvent('oauth_provider_conflict', {
          userId,
          provider,
          providerId,
          conflictUserId: existingLink.id
        });
        return false;
      }

      // Additional validation checks
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      // Check account status (optional field)
      if (user.account_status && (user.account_status === 'suspended' || user.account_status === 'banned')) {
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Error validating account linking:', error);
      return false;
    }
  }

  /**
   * Resolve complex account conflicts
   */
  public async resolveAccountConflict(
    email: string,
    oauthProfile: OAuthUserProfile
  ): Promise<ConflictResolutionResult> {
    try {
      // Find all accounts with this email
      const accountsWithEmail = await this.findAccountsByEmail(email);
      
      if (accountsWithEmail.length === 0) {
        return {
          action: 'create',
          conflictType: 'none',
          resolution: 'No conflicts found - create new account'
        };
      }

      if (accountsWithEmail.length === 1) {
        const account = accountsWithEmail[0];
        
        // Check if provider already linked
        const providerLinked = await this.checkExistingProvider(account.id, oauthProfile.provider);
        
        if (providerLinked) {
          return {
            action: 'link',
            user: account,
            conflictType: 'provider_exists',
            resolution: 'Provider already linked - proceed with login'
          };
        }

        // Check security flags
        const securityFlags = await this.performSecurityChecks(account, oauthProfile);
        
        return {
          action: 'link',
          user: account,
          conflictType: 'email_exists',
          resolution: 'Link provider to existing account',
          securityFlags
        };
      }

      // Multiple accounts with same email (should not happen in normal flow)
      SecurityService.logSecurityEvent('oauth_multiple_accounts_conflict', {
        email,
        provider: oauthProfile.provider,
        accountCount: accountsWithEmail.length
      });

      return {
        action: 'reject',
        conflictType: 'multiple_accounts',
        resolution: 'Multiple accounts found - manual intervention required'
      };

    } catch (error) {
      console.error('❌ Error resolving account conflict:', error);
      return {
        action: 'reject',
        conflictType: 'none',
        resolution: 'Error during conflict resolution'
      };
    }
  }

  // Private helper methods

  private async checkExistingProvider(userId: string, provider: string): Promise<any> {
    // Check if user already has this OAuth provider linked (production schema)
    const { data, error } = await this.supabase
      .from('users')
      .select('oauth_provider, oauth_id')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    // Return provider data if it matches, null otherwise
    return (data?.oauth_provider === provider) ? data : null;
  }

  private async updateProviderData(userId: string, profile: OAuthUserProfile): Promise<void> {
    // Update user's OAuth data in users table (production schema)
    const { error } = await this.supabase
      .from('users')
      .update({
        oauth_id: profile.id,
        email_verified: profile.emailVerified || true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('oauth_provider', profile.provider);

    if (error) {
      throw error;
    }
  }

  private async performSecurityChecks(user: any, profile: OAuthUserProfile): Promise<string[]> {
    const flags: string[] = [];

    // Check for email domain mismatch
    const userDomain = user.email.split('@')[1];
    const oauthDomain = profile.email.split('@')[1];
    
    if (userDomain !== oauthDomain) {
      flags.push('email_domain_mismatch');
    }

    // Check for recent suspicious activity
    const recentActivity = await this.checkRecentActivity(user.id);
    if (recentActivity.suspicious) {
      flags.push('suspicious_recent_activity');
    }

    // Check for account age vs provider registration
    const accountAge = new Date().getTime() - new Date(user.created_at).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation < 1) {
      flags.push('new_account_oauth_linking');
    }

    return flags;
  }

  private async performNewAccountSecurityChecks(profile: OAuthUserProfile): Promise<string[]> {
    const flags: string[] = [];

    // Check for suspicious email patterns
    if (this.isSuspiciousEmail(profile.email)) {
      flags.push('suspicious_email_pattern');
    }

    // Check for rate limiting
    const recentCreations = await this.checkRecentAccountCreations(profile.email);
    if (recentCreations > 3) {
      flags.push('rate_limit_exceeded');
    }

    return flags;
  }

  private async linkProviderToAccount(userId: string, profile: OAuthUserProfile): Promise<void> {
    // Update users table directly with OAuth provider info (production schema)
    const { error } = await this.supabase
      .from('users')
      .update({
        oauth_provider: profile.provider,
        oauth_id: profile.id,
        email_verified: profile.emailVerified || true, // OAuth emails are typically verified
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  private async enhanceUserProfile(user: any, profile: OAuthUserProfile): Promise<any> {
    const updates: any = {};

    // Update profile picture if not set or if OAuth provides a better one
    if (!user.profile_picture_url && profile.profilePicture) {
      updates.profile_picture_url = profile.profilePicture;
    }

    // Update name if OAuth provides more complete information
    if (profile.name && profile.name.length > (user.full_name || '').length) {
      updates.full_name = profile.name;
    }

    // Mark email as verified if OAuth provider confirms it
    if (profile.emailVerified && !user.email_verified) {
      updates.email_verified = true;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    return user;
  }

  private async createAccountFromOAuth(profile: OAuthUserProfile): Promise<any> {
    const userData = {
      email: profile.email,
      full_name: profile.name,
      // profile_picture_url: profile.profilePicture, // Column not in current schema
      oauth_provider: profile.provider,
      oauth_id: profile.id,
      email_verified: profile.emailVerified || false,
      // account_status removed - not in current schema
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error } = await this.supabaseService
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  }

  private async enrichUserWithProviders(user: any): Promise<any> {
    const linkedProviders = await this.getLinkedProviders(user.id);
    return {
      ...user,
      linkedProviders
    };
  }

  private async getLinkedProviders(userId: string): Promise<string[]> {
    // Get OAuth provider from users table (production schema)
    const { data, error } = await this.supabase
      .from('users')
      .select('oauth_provider')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data?.oauth_provider ? [data.oauth_provider] : [];
  }

  private async getUserById(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  private async findAccountsByEmail(email: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      throw error;
    }

    return data || [];
  }

  private async checkRecentActivity(userId: string): Promise<{ suspicious: boolean }> {
    // This would integrate with a security audit system
    // For now, return a simple check
    return { suspicious: false };
  }

  private isSuspiciousEmail(email: string): boolean {
    // Check for common suspicious patterns
    const suspiciousPatterns = [
      /^[a-z0-9]{32}@/i, // Random string emails
      /\+.*\+.*@/i,      // Multiple + signs
      /^temp.*@/i,       // Temporary email patterns
      /^test.*@/i,       // Test email patterns
    ];

    return suspiciousPatterns.some(pattern => pattern.test(email));
  }

  private async checkRecentAccountCreations(email: string): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .gte('created_at', oneDayAgo);

    if (error) {
      return 0;
    }

    return data.length;
  }
} 