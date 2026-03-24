import { MultiProviderManager } from '../MultiProviderManager';
import { OAuthUserProfile } from '../types';
import { SecurityService } from '../security';

// Create a flexible mock that can be configured per test
let mockSupabaseClient: any;

beforeEach(() => {
  mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }))
  };
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock SecurityService
jest.mock('../security', () => ({
  SecurityService: {
    logSecurityEvent: jest.fn()
  }
}));

// Mock EmailConflictResolver
jest.mock('../EmailConflictResolver', () => ({
  EmailConflictResolver: jest.fn(() => ({
    validateAccountLinking: jest.fn()
  }))
}));

describe('MultiProviderManager', () => {
  let manager: MultiProviderManager;
  let mockConflictResolver: any;
  
  const mockOAuthProfile: OAuthUserProfile = {
    id: 'google123',
    email: 'test@example.com',
    name: 'Test User',
    provider: 'google',
    emailVerified: true,
    profilePicture: 'https://example.com/avatar.jpg',
    providerData: { locale: 'en' }
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    password_hash: 'hashedpassword'
  };

  beforeEach(() => {
    manager = new MultiProviderManager();
    mockConflictResolver = (manager as any).conflictResolver;
    jest.clearAllMocks();
  });

  describe('linkProvider', () => {
    it('should link new provider successfully', async () => {
      // Mock validation
      mockConflictResolver.validateAccountLinking.mockResolvedValue(true);

      // Mock no existing provider
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      // Mock link provider
      mockSupabaseClient.from.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValue({ error: null })
      });

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.linkProvider('user123', mockOAuthProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider linked successfully');
      expect(result.linkedProviders).toEqual(['google']);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'oauth_provider_linked',
        expect.objectContaining({
          userId: 'user123',
          provider: 'google'
        })
      );
    });

    it('should update existing provider', async () => {
      // Mock validation
      mockConflictResolver.validateAccountLinking.mockResolvedValue(true);

      // Mock existing provider
      const existingProvider = {
        provider: 'google',
        last_used_at: new Date().toISOString()
      };
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingProvider, error: null })
            })
          })
        })
      });

      // Mock update provider
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.linkProvider('user123', mockOAuthProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider updated successfully');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'oauth_provider_updated',
        expect.objectContaining({
          userId: 'user123',
          provider: 'google'
        })
      );
    });

    it('should fail validation', async () => {
      // Mock validation failure
      mockConflictResolver.validateAccountLinking.mockResolvedValue(false);

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await manager.linkProvider('user123', mockOAuthProfile);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Provider linking validation failed');
      expect(result.error).toBe('Security validation failed');
    });

    it('should set as primary provider', async () => {
      // Mock validation
      mockConflictResolver.validateAccountLinking.mockResolvedValue(true);

      // Mock no existing provider
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      });

      // Mock link provider
      mockSupabaseClient.from.mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValue({ error: null })
      });

      // Mock set primary provider
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.linkProvider('user123', mockOAuthProfile, true);

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock validation
      mockConflictResolver.validateAccountLinking.mockRejectedValue(new Error('Validation error'));

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await manager.linkProvider('user123', mockOAuthProfile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
    });
  });

  describe('unlinkProvider', () => {
    it('should unlink provider successfully', async () => {
      // Mock can unlink (has password)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }, { provider: 'linkedin' }], error: null })
        })
      });

      // Mock delete provider
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      // Mock get remaining providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'linkedin' }], error: null })
        })
      });

      // Mock set primary provider
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await manager.unlinkProvider('user123', 'google');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider unlinked successfully');
      expect(result.linkedProviders).toEqual(['linkedin']);
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'oauth_provider_unlinked',
        expect.objectContaining({
          userId: 'user123',
          provider: 'google'
        })
      );
    });

    it('should prevent unlinking last authentication method', async () => {
      // Mock can't unlink (no password, only one provider)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { ...mockUser, password_hash: null }, 
              error: null 
            })
          })
        })
      });

      // Mock get linked providers (only one)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      // Mock get linked providers for return value
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.unlinkProvider('user123', 'google');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot unlink provider - at least one authentication method must remain');
      expect(result.error).toBe('Last authentication method');
    });

    it('should handle database errors', async () => {
      // Mock can unlink
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }, { provider: 'linkedin' }], error: null })
        })
      });

      // Mock delete error
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Delete error'))
          })
        })
      });

      // Mock get linked providers for error response
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.unlinkProvider('user123', 'google');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete error');
    });
  });

  describe('getProviderStatus', () => {
    it('should return provider status correctly', async () => {
      const mockProviders = [
        {
          provider: 'google',
          last_used_at: new Date().toISOString(),
          linked_at: new Date().toISOString()
        }
      ];

      // Mock get detailed provider data
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockProviders, error: null })
        })
      });

      // Mock get primary provider
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { provider: 'google' }, error: null })
            })
          })
        })
      });

      const result = await manager.getProviderStatus('user123');

      expect(result).toHaveLength(2); // google and linkedin
      expect(result[0]).toMatchObject({
        provider: 'google',
        linked: true,
        isPrimary: true,
        canUnlink: false // Only one provider
      });
      expect(result[1]).toMatchObject({
        provider: 'linkedin',
        linked: false,
        isPrimary: false,
        canUnlink: false
      });
    });

    it('should handle errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const result = await manager.getProviderStatus('user123');

      expect(result).toEqual([]);
    });
  });

  describe('setProviderPreferences', () => {
    it('should set provider preferences successfully', async () => {
      const preferences = [
        { provider: 'google', priority: 1, enabled: true },
        { provider: 'linkedin', priority: 2, enabled: false }
      ];

      // Mock update provider preferences
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.setProviderPreferences('user123', preferences);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider preferences updated successfully');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'oauth_provider_preferences_updated',
        expect.objectContaining({
          userId: 'user123',
          preferences: 2
        })
      );
    });

    it('should reject invalid providers', async () => {
      const preferences = [
        { provider: 'invalid', priority: 1, enabled: true }
      ];

      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await manager.setProviderPreferences('user123', preferences);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid provider preferences');
      expect(result.error).toContain('Invalid providers: invalid');
    });

    it('should handle database errors', async () => {
      const preferences = [
        { provider: 'google', priority: 1, enabled: true }
      ];

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Update error'))
          })
        })
      });

      const result = await manager.setProviderPreferences('user123', preferences);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update error');
    });
  });

  describe('switchPrimaryProvider', () => {
    it('should switch primary provider successfully', async () => {
      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }, { provider: 'linkedin' }], error: null })
        })
      });

      // Mock set primary provider
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await manager.switchPrimaryProvider('user123', 'linkedin');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Primary provider updated successfully');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'oauth_primary_provider_changed',
        expect.objectContaining({
          userId: 'user123',
          newPrimaryProvider: 'linkedin'
        })
      );
    });

    it('should reject switching to unlinked provider', async () => {
      // Mock get linked providers (only google)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
        })
      });

      const result = await manager.switchPrimaryProvider('user123', 'linkedin');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Provider is not linked to this account');
      expect(result.error).toBe('Provider not linked');
    });

    it('should handle database errors', async () => {
      // Mock get linked providers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }, { provider: 'linkedin' }], error: null })
        })
      });

      // Mock set primary provider error
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Update error'))
        })
      });

      const result = await manager.switchPrimaryProvider('user123', 'linkedin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update error');
    });
  });

  describe('getProviderAnalytics', () => {
    it('should return provider analytics', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const mockProviders = [
        {
          provider: 'google',
          last_used_at: recentDate.toISOString()
        },
        {
          provider: 'linkedin',
          last_used_at: thirtyDaysAgo.toISOString()
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockProviders, error: null })
        })
      });

      const result = await manager.getProviderAnalytics('user123');

      expect(result.totalProviders).toBe(2);
      expect(result.activeProviders).toBe(1); // Only google is active (within 30 days)
      expect(result.mostUsedProvider).toBe('google');
      expect(result.securityScore).toBeGreaterThan(0);
    });

    it('should handle empty providers', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await manager.getProviderAnalytics('user123');

      expect(result.totalProviders).toBe(0);
      expect(result.activeProviders).toBe(0);
      expect(result.mostUsedProvider).toBe(null);
      expect(result.lastActivity).toBe(null);
      expect(result.securityScore).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const result = await manager.getProviderAnalytics('user123');

      expect(result.totalProviders).toBe(0);
      expect(result.securityScore).toBe(0);
    });
  });

  describe('Private helper methods', () => {
    describe('calculateSecurityScore', () => {
      it('should calculate security score correctly', () => {
        const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        const providers = [
          { provider: 'google', last_used_at: recentDate.toISOString() },
          { provider: 'linkedin', last_used_at: recentDate.toISOString() }
        ];

        const score = (manager as any).calculateSecurityScore(providers);

        // Base score: 2 * 20 = 40
        // Diversity bonus: 20
        // Recent activity bonus: 2 * 10 = 20
        // Total: 80
        expect(score).toBe(80);
      });

      it('should cap score at 100', () => {
        const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        const providers = Array.from({ length: 10 }, (_, i) => ({
          provider: `provider${i}`,
          last_used_at: recentDate.toISOString()
        }));

        const score = (manager as any).calculateSecurityScore(providers);

        expect(score).toBe(100);
      });
    });

    describe('canUnlinkProvider', () => {
      it('should allow unlinking if user has password', async () => {
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
            })
          })
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ provider: 'google' }], error: null })
          })
        });

        const result = await (manager as any).canUnlinkProvider('user123', 'google');

        expect(result).toBe(true);
      });

      it('should allow unlinking if user has other providers', async () => {
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { ...mockUser, password_hash: null }, 
                error: null 
              })
            })
          })
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ 
              data: [{ provider: 'google' }, { provider: 'linkedin' }], 
              error: null 
            })
          })
        });

        const result = await (manager as any).canUnlinkProvider('user123', 'google');

        expect(result).toBe(true);
      });

      it('should prevent unlinking last authentication method', async () => {
        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { ...mockUser, password_hash: null }, 
                error: null 
              })
            })
          })
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ 
              data: [{ provider: 'google' }], 
              error: null 
            })
          })
        });

        const result = await (manager as any).canUnlinkProvider('user123', 'google');

        expect(result).toBe(false);
      });

      it('should handle database errors', async () => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        });

        const result = await (manager as any).canUnlinkProvider('user123', 'google');

        expect(result).toBe(false);
      });
    });
  });
}); 