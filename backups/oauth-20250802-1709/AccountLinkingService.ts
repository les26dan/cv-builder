import { createClient } from '@supabase/supabase-js';
import { OAuthUserProfile, AccountLinkingResult } from './types';
import { SecurityService } from './security';
import { EmailConflictResolver } from './EmailConflictResolver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export class AccountLinkingService {
  private supabase;
  private conflictResolver: EmailConflictResolver;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.conflictResolver = new EmailConflictResolver();
  }

  /**
   * Resolve account by email - either find existing or create new
   */
  public async resolveAccount(profile: OAuthUserProfile): Promise<AccountLinkingResult> {
    try {
      // Use conflict resolver to handle complex scenarios
      const conflictResult = await this.conflictResolver.resolveAccountConflict(profile.email, profile);

      switch (conflictResult.action) {
        case 'link':
          if (conflictResult.user) {
            return await this.conflictResolver.handleExistingAccount(conflictResult.user, profile);
          }
          throw new Error('User data missing for link action');

        case 'create':
          return await this.conflictResolver.handleNewAccount(profile);

        case 'reject':
          SecurityService.logSecurityEvent('account_linking_rejected', {
            provider: profile.provider,
            email: profile.email,
            reason: conflictResult.resolution
          });
          throw new Error(`Account linking rejected: ${conflictResult.resolution}`);

        default:
          throw new Error(`Unknown conflict resolution action: ${conflictResult.action}`);
      }
    } catch (error) {
      console.error('❌ Error resolving account:', error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  public async resolveAccountLegacy(profile: OAuthUserProfile): Promise<AccountLinkingResult> {
    try {
      // First, check if account exists by email
      const existingUser = await this.findAccountByEmail(profile.email);

      if (existingUser) {
        // Account exists - link provider and log in
        await this.linkProviderToAccount(existingUser.id, profile);
        const linkedProviders = await this.getLinkedProviders(existingUser.id);

        SecurityService.logSecurityEvent('account_linking_existing', {
          userId: existingUser.id,
          provider: profile.provider,
          email: profile.email
        });

        return {
          action: 'login',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            fullName: existingUser.full_name || profile.name,
            profilePicture: existingUser.profile_picture_url || profile.profilePicture,
            signupMethod: existingUser.signup_method || 'email',
            linkedProviders
          },
          isNewAccount: false,
          linkedProviders
        };
      } else {
        // No account exists - create new account
        const newUser = await this.createAccountFromOAuth(profile);
        await this.linkProviderToAccount(newUser.id, profile);

        SecurityService.logSecurityEvent('account_creation_oauth', {
          userId: newUser.id,
          provider: profile.provider,
          email: profile.email
        });

        return {
          action: 'register',
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.full_name,
            profilePicture: newUser.profile_picture_url,
            signupMethod: profile.provider,
            linkedProviders: [profile.provider]
          },
          isNewAccount: true,
          linkedProviders: [profile.provider]
        };
      }
    } catch (error) {
      SecurityService.logSecurityEvent('account_resolution_error', {
        provider: profile.provider,
        email: profile.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Link additional provider to existing account
   */
  public async linkProvider(userId: string, profile: OAuthUserProfile): Promise<AccountLinkingResult> {
    try {
      // Get existing user
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Check if provider is already linked
      const { data: existingProvider } = await this.supabase
        .from('user_oauth_providers')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', profile.provider)
        .single();

      if (existingProvider) {
        // Update existing provider data
        await this.supabase
          .from('user_oauth_providers')
          .update({
            provider_user_id: profile.id,
            provider_email: profile.email,
            provider_data: profile.providerData,
            last_used_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('provider', profile.provider);
      } else {
        // Link new provider
        await this.linkProviderToAccount(userId, profile);
      }

      const linkedProviders = await this.getLinkedProviders(userId);

      SecurityService.logSecurityEvent('provider_linking', {
        userId,
        provider: profile.provider,
        email: profile.email
      });

      return {
        action: 'link',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          profilePicture: user.profile_picture_url,
          signupMethod: user.signup_method,
          linkedProviders
        },
        isNewAccount: false,
        linkedProviders
      };
    } catch (error) {
      SecurityService.logSecurityEvent('provider_linking_error', {
        userId,
        provider: profile.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Unlink provider from account
   */
  public async unlinkProvider(userId: string, provider: string): Promise<void> {
    try {
      // Check if user has other authentication methods
      const linkedProviders = await this.getLinkedProviders(userId);
      
      // Get user to check if they have a password
      const { data: user } = await this.supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      const hasPassword = user?.password_hash;
      const hasOtherProviders = linkedProviders.filter(p => p !== provider).length > 0;

      if (!hasPassword && !hasOtherProviders) {
        throw new Error('Cannot unlink last authentication method');
      }

      // Remove provider
      const { error } = await this.supabase
        .from('user_oauth_providers')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) {
        throw error;
      }

      SecurityService.logSecurityEvent('provider_unlinking', {
        userId,
        provider
      });
    } catch (error) {
      SecurityService.logSecurityEvent('provider_unlinking_error', {
        userId,
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get linked providers for user
   */
  public async getLinkedProviders(userId: string): Promise<string[]> {
    try {
      const { data: providers, error } = await this.supabase
        .from('user_oauth_providers')
        .select('provider')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return providers?.map(p => p.provider) || [];
    } catch (error) {
      console.error('Error getting linked providers:', error);
      return [];
    }
  }

  /**
   * Find account by email
   */
  private async findAccountByEmail(email: string): Promise<any> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return user;
  }

  /**
   * Create new account from OAuth profile
   */
  private async createAccountFromOAuth(profile: OAuthUserProfile): Promise<any> {
    const userData = {
      email: profile.email,
      full_name: profile.name,
      profile_picture_url: profile.profilePicture,
      signup_method: profile.provider,
      email_verified: profile.emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  }

  /**
   * Link OAuth provider to account
   */
  private async linkProviderToAccount(userId: string, profile: OAuthUserProfile): Promise<void> {
    const providerData = {
      user_id: userId,
      provider: profile.provider,
      provider_user_id: profile.id,
      provider_email: profile.email,
      provider_data: profile.providerData,
      linked_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    // Use upsert to handle both insert and update cases
    const { error } = await this.supabase
      .from('user_oauth_providers')
      .upsert(providerData, {
        onConflict: 'user_id,provider'
      });

    if (error) {
      throw error;
    }

    // Update user's profile picture if they don't have one
    if (profile.profilePicture) {
      const { data: user } = await this.supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();

      if (user && !user.profile_picture_url) {
        await this.supabase
          .from('users')
          .update({
            profile_picture_url: profile.profilePicture,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    }
  }

  /**
   * Update user profile with OAuth data
   */
  public async updateUserProfile(userId: string, profile: OAuthUserProfile): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update if current value is empty
      const { data: currentUser } = await this.supabase
        .from('users')
        .select('full_name, profile_picture_url')
        .eq('id', userId)
        .single();

      if (currentUser) {
        if (!currentUser.full_name && profile.name) {
          updateData.full_name = profile.name;
        }
        if (!currentUser.profile_picture_url && profile.profilePicture) {
          updateData.profile_picture_url = profile.profilePicture;
        }
      }

      if (Object.keys(updateData).length > 1) { // More than just updated_at
        const { error } = await this.supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Don't throw - this is not critical for OAuth flow
    }
  }

  /**
   * Check if email is already linked to another account
   */
  public async checkEmailConflict(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('users')
        .select('id')
        .eq('email', email);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error checking email conflict:', error);
      return false;
    }
  }

  /**
   * Get OAuth provider data for user
   */
  public async getProviderData(userId: string, provider: string): Promise<any> {
    try {
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
    } catch (error) {
      console.error('Error getting provider data:', error);
      return null;
    }
  }
} 