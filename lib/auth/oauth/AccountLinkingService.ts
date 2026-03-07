import { createClient } from '@supabase/supabase-js';
import { OAuthUserProfile, AccountLinkingResult } from './types';
import { SecurityService } from './security';
import { EmailConflictResolver } from './EmailConflictResolver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export class AccountLinkingService {
  private supabase: any | null;
  private supabaseService: any | null;
  private conflictResolver: EmailConflictResolver;

  constructor() {
    // Validate Supabase configuration
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase not configured - OAuth will use mock mode');
      // Create mock clients that won't be used
      this.supabase = null;
      this.supabaseService = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      // Service client for operations that need to bypass RLS (like user creation)
      this.supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    }
    this.conflictResolver = new EmailConflictResolver();
  }

  /**
   * Ensure Supabase client is configured for operations
   */
  private ensureSupabaseConfigured(): void {
    if (!this.supabase) {
      throw new Error('Supabase client not configured for database operations');
    }
  }

  /**
   * Ensure Supabase service client is configured for privileged operations
   */
  private ensureSupabaseServiceConfigured(): void {
    if (!this.supabaseService) {
      throw new Error('Supabase service client not configured for privileged operations');
    }
  }

  /**
   * Resolve account by email - either find existing or create new (production schema)
   */
  public async resolveAccount(profile: OAuthUserProfile): Promise<AccountLinkingResult> {
    console.log('🔗 [ACCOUNT-LINKING] resolveAccount started');
    console.log('👤 [ACCOUNT-LINKING] Profile details:', {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      provider: profile.provider,
      emailVerified: profile.emailVerified
    });
    
    try {
      // If Supabase is not configured, return mock user for development
      if (!this.supabase) {
        console.log('🔧 [ACCOUNT-LINKING] Using mock OAuth user for development:', profile.email);
        
        // Generate a mock user ID
        const mockUserId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          action: 'login',
          user: {
            id: mockUserId,
            email: profile.email,
            fullName: profile.name,
            signupMethod: 'oauth',
            linkedProviders: [profile.provider]
          },
          isNewAccount: false,
          linkedProviders: [profile.provider]
        };
      }
      
      // Check if user already exists with this email
      console.log('🔍 [ACCOUNT-LINKING] Checking for existing user with email:', profile.email);
      this.ensureSupabaseServiceConfigured();
      
      const { data: existingUser, error: findError } = await this.supabaseService!
        .from('users')
        .select('*')
        .eq('email', profile.email)
        .single();

      console.log('📋 [ACCOUNT-LINKING] User lookup result:', {
        hasUser: !!existingUser,
        hasError: !!findError,
        errorCode: findError?.code,
        errorMessage: findError?.message,
        userDetails: existingUser ? {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.full_name,
          oauthProvider: existingUser.oauth_provider,
          oauthId: existingUser.oauth_id
        } : null
      });

      if (findError && findError.code !== 'PGRST116') {
        console.error('❌ [ACCOUNT-LINKING] Database error during user lookup:', findError);
        throw findError;
      }

      if (existingUser) {
        console.log('✅ [ACCOUNT-LINKING] Existing user found, updating OAuth information...');
        
        // User exists - update their OAuth info and return login result using service client
        const { error: updateError } = await this.supabaseService!
          .from('users')
          .update({
            oauth_provider: profile.provider,
            oauth_id: profile.id,
            email_verified: profile.emailVerified || true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('❌ [ACCOUNT-LINKING] Error updating existing user OAuth info:', updateError);
          throw updateError;
        }

        console.log('✅ [ACCOUNT-LINKING] Successfully updated existing user OAuth information');

        SecurityService.logSecurityEvent('oauth_account_linked', {
          userId: existingUser.id,
          provider: profile.provider,
          email: profile.email
        });

        const result = {
          action: 'login',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            fullName: existingUser.full_name,
            signupMethod: 'oauth',
            linkedProviders: [profile.provider]
          },
          isNewAccount: false,
          linkedProviders: [profile.provider]
        };
        
        console.log('🎉 [ACCOUNT-LINKING] Returning login result for existing user:', {
          action: result.action,
          userId: result.user.id,
          email: result.user.email,
          isNewAccount: result.isNewAccount
        });
        
        return result as AccountLinkingResult;
      } else {
        console.log('📝 [ACCOUNT-LINKING] No existing user found, creating new OAuth account...');
        
        // User doesn't exist - create new OAuth account using service client to bypass RLS
        this.ensureSupabaseServiceConfigured();
        
        console.log('🔧 [ACCOUNT-LINKING] Using service client to create new user...');
        const { data: newUser, error: createError } = await this.supabaseService!
          .from('users')
          .insert({
            email: profile.email,
            full_name: profile.name,
            oauth_provider: profile.provider,
            oauth_id: profile.id,
            email_verified: profile.emailVerified || true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        console.log('📋 [ACCOUNT-LINKING] User creation result:', {
          hasUser: !!newUser,
          hasError: !!createError,
          errorCode: createError?.code,
          errorMessage: createError?.message,
          userDetails: newUser ? {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.full_name
          } : null
        });

        if (createError) {
          throw createError;
        }

        SecurityService.logSecurityEvent('oauth_new_account_created', {
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
            signupMethod: 'oauth',
            linkedProviders: [profile.provider]
          },
          isNewAccount: true,
          linkedProviders: [profile.provider]
        };
      }
    } catch (error) {
      console.error('💥 [ACCOUNT-LINKING] Error resolving account:', error);
      console.error('💥 [ACCOUNT-LINKING] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorHint: (error as any)?.hint,
        profileEmail: profile.email,
        profileProvider: profile.provider
      });
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
      this.ensureSupabaseConfigured();
      
      // Get existing user
      const { data: user, error: userError } = await this.supabase!
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Check if provider is already linked
      const { data: existingProvider } = await this.supabase!
        .from('user_oauth_providers')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', profile.provider)
        .single();

      if (existingProvider) {
        // Update existing provider data
        await this.supabase!
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
      this.ensureSupabaseConfigured();
      // Check if user has other authentication methods
      const linkedProviders = await this.getLinkedProviders(userId);
      
      // Get user to check if they have a password
      const { data: user } = await this.supabase!
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
      const { error } = await this.supabase!
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
      this.ensureSupabaseConfigured();
      const { data: providers, error } = await this.supabase!
        .from('user_oauth_providers')
        .select('provider')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return providers?.map((p: any) => p.provider) || [];
    } catch (error) {
      console.error('Error getting linked providers:', error);
      return [];
    }
  }

  /**
   * Find account by email
   */
  private async findAccountByEmail(email: string): Promise<any> {
          const { data: user, error } = await this.supabase!
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
    this.ensureSupabaseServiceConfigured();
    
    const userData = {
      email: profile.email,
      full_name: profile.name,
      profile_picture_url: profile.profilePicture,
      signup_method: profile.provider,
      email_verified: profile.emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use service client to bypass RLS for user creation
    const { data: user, error } = await this.supabaseService!
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
      const { data: user } = await this.supabase!
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();

      if (user && !user.profile_picture_url) {
        await this.supabase!
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
      this.ensureSupabaseConfigured();
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update if current value is empty
      const { data: currentUser } = await this.supabase!
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
        const { error } = await this.supabase!
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
      this.ensureSupabaseConfigured();
      let query = this.supabase!
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
      this.ensureSupabaseConfigured();
      const { data, error } = await this.supabase!
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