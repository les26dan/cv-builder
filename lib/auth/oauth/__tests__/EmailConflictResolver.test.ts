import { EmailConflictResolver } from '../EmailConflictResolver';
import { OAuthUserProfile } from '../types';
import { SecurityService } from '../security';

// Mock Supabase with proper chain methods
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};

const mockSupabase = {
  from: jest.fn(() => mockSupabaseChain),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock SecurityService
jest.mock('../security', () => ({
  SecurityService: {
    logSecurityEvent: jest.fn(),
  },
}));

describe('EmailConflictResolver', () => {
  let resolver: EmailConflictResolver;
  
  const mockOAuthProfile: OAuthUserProfile = {
    id: 'google123',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    profilePicture: 'https://example.com/avatar.jpg',
    provider: 'google',
    emailVerified: true,
    providerData: { locale: 'en' },
  };

  const mockExistingUser = {
    id: 'user123',
    email: 'test@example.com',
    full_name: 'Test User',
    profile_picture_url: null,
    signup_method: 'email',
    email_verified: false,
    account_status: 'active',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    resolver = new EmailConflictResolver();
    jest.clearAllMocks();
    
    // Reset mock chain to default behavior with fresh mocks
    mockSupabaseChain.select = jest.fn().mockReturnThis();
    mockSupabaseChain.insert = jest.fn().mockReturnThis();
    mockSupabaseChain.update = jest.fn().mockReturnThis();
    mockSupabaseChain.upsert = jest.fn().mockReturnThis();
    mockSupabaseChain.delete = jest.fn().mockReturnThis();
    mockSupabaseChain.eq = jest.fn().mockReturnThis();
    mockSupabaseChain.neq = jest.fn().mockReturnThis();
    mockSupabaseChain.gte = jest.fn().mockReturnThis();
    mockSupabaseChain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    mockSupabaseChain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    
    // Reset the from mock as well
    mockSupabase.from = jest.fn(() => mockSupabaseChain);
  });

  describe('handleExistingAccount', () => {
    it('should handle existing provider successfully', async () => {
      const mockProviderData = {
        id: 'provider123',
        provider: 'google',
        last_used_at: new Date().toISOString(),
      };

      // Mock checkExistingProvider to return existing provider
      jest.spyOn(resolver as any, 'checkExistingProvider').mockResolvedValue(mockProviderData);

      // Mock updateProviderData
      jest.spyOn(resolver as any, 'updateProviderData').mockResolvedValue(undefined);

      // Mock enrichUserWithProviders to avoid Supabase calls
      jest.spyOn(resolver as any, 'enrichUserWithProviders').mockResolvedValue(mockExistingUser);

      // Mock getLinkedProviders
      jest.spyOn(resolver as any, 'getLinkedProviders').mockResolvedValue(['google']);

      const result = await resolver.handleExistingAccount(mockExistingUser, mockOAuthProfile);

      expect(result.action).toBe('login');
      expect(result.isNewAccount).toBe(false);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_existing_provider_login', {
        userId: 'user123',
        provider: 'google',
        email: 'test@example.com',
      });
    });

    it('should link new provider to existing account', async () => {
      // Mock no existing provider
      jest.spyOn(resolver as any, 'checkExistingProvider').mockResolvedValue(null);

      // Mock security checks
      jest.spyOn(resolver as any, 'performSecurityChecks').mockResolvedValue([]);

      // Mock linkProviderToAccount
      jest.spyOn(resolver as any, 'linkProviderToAccount').mockResolvedValue(undefined);

      // Mock enhanceUserProfile
      jest.spyOn(resolver as any, 'enhanceUserProfile').mockResolvedValue(mockExistingUser);

      // Mock enrichUserWithProviders to avoid Supabase calls
      jest.spyOn(resolver as any, 'enrichUserWithProviders').mockResolvedValue(mockExistingUser);

      // Mock getLinkedProviders
      jest.spyOn(resolver as any, 'getLinkedProviders').mockResolvedValue(['google']);

      const result = await resolver.handleExistingAccount(mockExistingUser, mockOAuthProfile);

      expect(result.action).toBe('login');
      expect(result.isNewAccount).toBe(false);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_provider_linked', {
        userId: 'user123',
        provider: 'google',
        email: 'test@example.com',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock checkExistingProvider to throw error
      jest.spyOn(resolver as any, 'checkExistingProvider').mockRejectedValue(new Error('Database error'));

      await expect(resolver.handleExistingAccount(mockExistingUser, mockOAuthProfile))
        .rejects.toThrow('Database error');
    });
  });

  describe('handleNewAccount', () => {
    it('should create new account successfully', async () => {
      // Mock security checks
      jest.spyOn(resolver as any, 'performNewAccountSecurityChecks').mockResolvedValue([]);

      const newUser = { ...mockExistingUser, id: 'newuser123' };
      
      // Mock createAccountFromOAuth
      jest.spyOn(resolver as any, 'createAccountFromOAuth').mockResolvedValue(newUser);

      // Mock enrichUserWithProviders
      jest.spyOn(resolver as any, 'enrichUserWithProviders').mockResolvedValue(newUser);

      // Mock getLinkedProviders
      jest.spyOn(resolver as any, 'getLinkedProviders').mockResolvedValue(['google']);

      const result = await resolver.handleNewAccount(mockOAuthProfile);

      expect(result.action).toBe('register');
      expect(result.isNewAccount).toBe(true);
      expect(result.linkedProviders).toEqual(['google']);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_new_account_created', {
        userId: 'newuser123',
        provider: 'google',
        email: 'test@example.com',
      });
    });

    it('should block suspicious account creation', async () => {
      // Mock security checks with suspicious activity
      jest.spyOn(resolver as any, 'performNewAccountSecurityChecks')
        .mockResolvedValue(['suspicious_activity']);

      await expect(resolver.handleNewAccount(mockOAuthProfile))
        .rejects.toThrow('Account creation blocked due to security concerns');

      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_new_account_blocked', {
        provider: 'google',
        email: 'test@example.com',
        flags: ['suspicious_activity'],
      });
    });

    it('should handle database errors during account creation', async () => {
      jest.spyOn(resolver as any, 'performNewAccountSecurityChecks').mockResolvedValue([]);
      
      // Mock createAccountFromOAuth to throw error
      jest.spyOn(resolver as any, 'createAccountFromOAuth').mockRejectedValue(new Error('Database error'));

      await expect(resolver.handleNewAccount(mockOAuthProfile))
        .rejects.toThrow('Database error');
    });
  });

  describe('validateAccountLinking', () => {
    it('should validate account linking successfully', async () => {
      // Mock getUserById to return active user
      jest.spyOn(resolver as any, 'getUserById').mockResolvedValue({ 
        ...mockExistingUser, 
        account_status: 'active' 
      });

      // Mock no existing link (first call)
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await resolver.validateAccountLinking('user123', 'google', 'google123');

      expect(result).toBe(true);
    });

    it('should reject linking if provider already linked to another account', async () => {
      // Mock existing link - this should cause the method to return false
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { user_id: 'otheruser123' },
        error: null,
      });

      const result = await resolver.validateAccountLinking('user123', 'google', 'google123');

      expect(result).toBe(false);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_provider_conflict', {
        userId: 'user123',
        provider: 'google',
        providerId: 'google123',
        conflictUserId: 'otheruser123',
      });
    });

    it('should reject linking for suspended accounts', async () => {
      // Mock no existing link
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock get suspended user
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { ...mockExistingUser, account_status: 'suspended' },
        error: null,
      });

      const result = await resolver.validateAccountLinking('user123', 'google', 'google123');

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseChain.single.mockRejectedValueOnce(new Error('Database error'));

      const result = await resolver.validateAccountLinking('user123', 'google', 'google123');

      expect(result).toBe(false);
    });
  });

  describe('resolveAccountConflict', () => {
    it('should resolve no conflict scenario', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await resolver.resolveAccountConflict('test@example.com', mockOAuthProfile);

      expect(result.action).toBe('create');
      expect(result.conflictType).toBe('none');
    });

    it('should resolve single account conflict', async () => {
      // Mock findAccountsByEmail to return single user
      jest.spyOn(resolver as any, 'findAccountsByEmail').mockResolvedValue([mockExistingUser]);

      // Mock check existing provider
      jest.spyOn(resolver as any, 'checkExistingProvider').mockResolvedValue(null);

      // Mock security checks
      jest.spyOn(resolver as any, 'performSecurityChecks').mockResolvedValue([]);

      const result = await resolver.resolveAccountConflict('test@example.com', mockOAuthProfile);

      expect(result.action).toBe('link');
      expect(result.conflictType).toBe('email_exists');
      expect(result.user).toEqual(mockExistingUser);
    });

    it('should handle multiple accounts conflict', async () => {
      // Mock findAccountsByEmail to return multiple users
      jest.spyOn(resolver as any, 'findAccountsByEmail').mockResolvedValue([
        mockExistingUser, 
        { ...mockExistingUser, id: 'user456' }
      ]);

      const result = await resolver.resolveAccountConflict('test@example.com', mockOAuthProfile);

      expect(result.action).toBe('reject');
      expect(result.conflictType).toBe('multiple_accounts');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_multiple_accounts_conflict', {
        email: 'test@example.com',
        provider: 'google',
        accountCount: 2,
      });
    });

    it('should handle database errors', async () => {
      // Mock findAccountsByEmail to throw error
      jest.spyOn(resolver as any, 'findAccountsByEmail').mockRejectedValue(new Error('Database error'));

      const result = await resolver.resolveAccountConflict('test@example.com', mockOAuthProfile);

      expect(result.action).toBe('reject');
      expect(result.resolution).toBe('Error during conflict resolution');
    });
  });

  describe('Private helper methods', () => {
    describe('performSecurityChecks', () => {
      it('should detect email domain mismatch', async () => {
        const userWithDifferentDomain = {
          ...mockExistingUser,
          email: 'test@different.com',
        };

        jest.spyOn(resolver as any, 'checkRecentActivity').mockResolvedValue({ suspicious: false });

        const flags = await (resolver as any).performSecurityChecks(
          userWithDifferentDomain, 
          mockOAuthProfile
        );

        expect(flags).toContain('email_domain_mismatch');
      });

      it('should detect new account OAuth linking', async () => {
        const newUser = {
          ...mockExistingUser,
          created_at: new Date().toISOString(), // Very recent
        };

        jest.spyOn(resolver as any, 'checkRecentActivity').mockResolvedValue({ suspicious: false });

        const flags = await (resolver as any).performSecurityChecks(newUser, mockOAuthProfile);

        expect(flags).toContain('new_account_oauth_linking');
      });

      it('should detect suspicious recent activity', async () => {
        jest.spyOn(resolver as any, 'checkRecentActivity').mockResolvedValue({ suspicious: true });

        const flags = await (resolver as any).performSecurityChecks(mockExistingUser, mockOAuthProfile);

        expect(flags).toContain('suspicious_recent_activity');
      });
    });

    describe('performNewAccountSecurityChecks', () => {
      it('should detect suspicious email patterns', async () => {
        const suspiciousProfile = {
          ...mockOAuthProfile,
          email: 'abcdef1234567890abcdef1234567890@example.com', // Random string pattern
        };

        jest.spyOn(resolver as any, 'checkRecentAccountCreations').mockResolvedValue(0);

        const flags = await (resolver as any).performNewAccountSecurityChecks(suspiciousProfile);

        expect(flags).toContain('suspicious_email_pattern');
      });

      it('should detect rate limit exceeded', async () => {
        jest.spyOn(resolver as any, 'checkRecentAccountCreations').mockResolvedValue(5);

        const flags = await (resolver as any).performNewAccountSecurityChecks(mockOAuthProfile);

        expect(flags).toContain('rate_limit_exceeded');
      });
    });

    describe('isSuspiciousEmail', () => {
      it('should detect random string emails', () => {
        const result = (resolver as any).isSuspiciousEmail('abcdef1234567890abcdef1234567890@example.com');
        expect(result).toBe(true);
      });

      it('should detect multiple plus signs', () => {
        const result = (resolver as any).isSuspiciousEmail('test+something+else@example.com');
        expect(result).toBe(true);
      });

      it('should detect temp email patterns', () => {
        const result = (resolver as any).isSuspiciousEmail('temp123@example.com');
        expect(result).toBe(true);
      });

      it('should detect test email patterns', () => {
        const result = (resolver as any).isSuspiciousEmail('test123@example.com');
        expect(result).toBe(true);
      });

      it('should allow normal emails', () => {
        const result = (resolver as any).isSuspiciousEmail('john.doe@example.com');
        expect(result).toBe(false);
      });
    });

    describe('enhanceUserProfile', () => {
      it('should update profile picture if not set', async () => {
        const userWithoutPicture = {
          ...mockExistingUser,
          profile_picture_url: null,
        };

        const updatedUser = { ...userWithoutPicture, profile_picture_url: mockOAuthProfile.profilePicture };
        
        mockSupabaseChain.single.mockResolvedValueOnce({
          data: updatedUser,
          error: null,
        });

        const result = await (resolver as any).enhanceUserProfile(userWithoutPicture, mockOAuthProfile);

        expect(result.profile_picture_url).toBe(mockOAuthProfile.profilePicture);
      });

      it('should update name if OAuth provides better info', async () => {
        const userWithShortName = {
          ...mockExistingUser,
          full_name: 'Test',
        };

        mockSupabaseChain.single.mockResolvedValueOnce({
          data: { ...userWithShortName, full_name: mockOAuthProfile.name },
          error: null,
        });

        const result = await (resolver as any).enhanceUserProfile(userWithShortName, mockOAuthProfile);

        expect(result.full_name).toBe(mockOAuthProfile.name);
      });

      it('should verify email if OAuth confirms it', async () => {
        const userWithUnverifiedEmail = {
          ...mockExistingUser,
          email_verified: false,
        };

        const updatedUser = { ...userWithUnverifiedEmail, email_verified: true };
        
        mockSupabaseChain.single.mockResolvedValueOnce({
          data: updatedUser,
          error: null,
        });

        const result = await (resolver as any).enhanceUserProfile(userWithUnverifiedEmail, mockOAuthProfile);

        expect(result.email_verified).toBe(true);
      });

      it('should return user unchanged if no updates needed', async () => {
        const completeUser = {
          ...mockExistingUser,
          profile_picture_url: 'existing.jpg',
          full_name: 'Very Long Complete Name',
          email_verified: true,
        };

        const result = await (resolver as any).enhanceUserProfile(completeUser, mockOAuthProfile);

        expect(result).toEqual(completeUser);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in conflict resolution', async () => {
      // Mock findAccountsByEmail to throw error
      jest.spyOn(resolver as any, 'findAccountsByEmail').mockRejectedValue(new Error('Database error'));

      const result = await resolver.resolveAccountConflict('test@example.com', mockOAuthProfile);

      expect(result.action).toBe('reject');
      expect(result.resolution).toBe('Error during conflict resolution');
    });

    it('should handle validation errors gracefully', async () => {
      mockSupabaseChain.single.mockRejectedValueOnce(new Error('Validation error'));

      const result = await resolver.validateAccountLinking('user123', 'google', 'google123');

      expect(result).toBe(false);
    });
  });
}); 