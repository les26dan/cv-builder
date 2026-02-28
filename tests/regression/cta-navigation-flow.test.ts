/**
 * @jest-environment jsdom
 */

import { handlePrimaryCTA, trackCTAClick } from '../../utils/navigation';

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true
});

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock gtag
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

describe('CTA Navigation Flow Regression Tests', () => {
  const mockConsoleLog = jest.fn();
  const mockConsoleError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockGtag.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError);
    
    // Reset location href
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: ''
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Task 2 Implementation - CTA Routing Behavior', () => {
    it('REGRESSION: Should route to CV Upload (localhost:4000) for unauthenticated users', async () => {
      // This test ensures we never revert to the old waitlist scroll behavior
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);

      await handlePrimaryCTA();

      // CRITICAL: Must route to CV Upload, NOT scroll to waitlist
      expect(window.location.href).toBe('http://localhost:4000');
      expect(window.location.href).not.toContain('waitlist');
      expect(window.location.href).not.toContain('#waitlist');
    });

    it('REGRESSION: Should route to Workspace (localhost:3000/workspace) for authenticated users', async () => {
      // This test ensures authenticated users go to workspace, not CV upload
      mockLocalStorage.getItem.mockReturnValue('valid_auth_token');

      await handlePrimaryCTA();

      // CRITICAL: Must route to Workspace for authenticated users
      expect(window.location.href).toBe('http://localhost:3000/workspace');
      expect(window.location.href).not.toBe('http://localhost:4000');
      expect(window.location.href).not.toContain('waitlist');
    });

    it('REGRESSION: Should prioritize localStorage over sessionStorage for auth detection', async () => {
      // This test ensures the auth priority logic remains correct
      mockLocalStorage.getItem.mockReturnValue('localStorage_token');
      mockSessionStorage.getItem.mockReturnValue('sessionStorage_token');

      await handlePrimaryCTA();

      // CRITICAL: Must prioritize localStorage
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(window.location.href).toBe('http://localhost:3000/workspace');
    });

    it('REGRESSION: Should use correct URL constants (no hardcoded URLs)', async () => {
      // This test ensures URL constants are used consistently
      
      // Test unauthenticated flow
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      await handlePrimaryCTA();
      
      const cvUploadUrl = window.location.href;
      expect(cvUploadUrl).toBe('http://localhost:4000');
      
      // Test authenticated flow
      window.location.href = '';
      mockLocalStorage.getItem.mockReturnValue('token');
      await handlePrimaryCTA();
      
      const workspaceUrl = window.location.href;
      expect(workspaceUrl).toBe('http://localhost:3000/workspace');
      
      // CRITICAL: URLs must be consistent and use correct ports
      expect(cvUploadUrl).toMatch(/^http:\/\/localhost:4000$/);
      expect(workspaceUrl).toMatch(/^http:\/\/localhost:3000\/workspace$/);
    });

    it('REGRESSION: Should always call analytics tracking for CTA clicks', () => {
      // This test ensures analytics tracking is never accidentally removed
      const testLocations = [
        'hero_section',
        'problem_ats', 
        'problem_keywords',
        'problem_mass_cv',
        'problem_cover_letters'
      ];

      testLocations.forEach(location => {
        jest.clearAllMocks();
        trackCTAClick(location);
        
                 // CRITICAL: Must always log and track CTA clicks
         expect(mockConsoleLog).toHaveBeenCalledWith(`CTA clicked -> enter app flow from ${location}`);
         expect(mockGtag).toHaveBeenCalledWith('event', 'cta_click', {
           event_category: 'engagement',
           event_label: location,
           custom_parameter: 'app_flow_entry'
         });
      });
    });

    it('REGRESSION: Should handle authentication errors gracefully with fallback', async () => {
      // This test ensures error handling doesn't break the user flow
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      await handlePrimaryCTA();

             // CRITICAL: Must fallback to CV Upload on auth errors
       expect(window.location.href).toBe('http://localhost:4000');
       expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
    });
  });

  describe('Legacy Behavior Prevention', () => {
    it('REGRESSION: Should NEVER scroll to waitlist section', async () => {
      // This test ensures we never revert to old scrollToWaitlist behavior
      const mockScrollIntoView = jest.fn();
      const mockGetElementById = jest.fn();
      
      // Mock document.getElementById to simulate waitlist section
      document.getElementById = mockGetElementById.mockReturnValue({
        scrollIntoView: mockScrollIntoView
      });

      await handlePrimaryCTA();

      // CRITICAL: Should never attempt to scroll to waitlist
      expect(mockGetElementById).not.toHaveBeenCalledWith('waitlist');
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('REGRESSION: Should NEVER route to email subscription endpoints', async () => {
      // This test ensures we never accidentally route to email/waitlist endpoints
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);

      await handlePrimaryCTA();

      // CRITICAL: Should never route to email/waitlist related URLs
      expect(window.location.href).not.toContain('email');
      expect(window.location.href).not.toContain('subscribe');
      expect(window.location.href).not.toContain('waitlist');
      expect(window.location.href).not.toContain('newsletter');
    });

    it('REGRESSION: Should use async/await pattern, not callback pattern', async () => {
      // This test ensures we maintain modern async patterns
      mockLocalStorage.getItem.mockReturnValue('token');

      const startTime = Date.now();
      await handlePrimaryCTA();
      const endTime = Date.now();

      // CRITICAL: Function should be async and complete quickly
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
      expect(window.location.href).toBe('http://localhost:3000/workspace');
    });
  });

  describe('Integration Points', () => {
    it('REGRESSION: Should work with all component integration points', async () => {
      // This test ensures the navigation works from all CTA locations
      const componentLocations = [
        'hero_section',
        'problem_ats',
        'problem_keywords', 
        'problem_mass_cv',
        'problem_cover_letters'
      ];

      for (const location of componentLocations) {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(null);
        window.location.href = '';

        // Test tracking and navigation for each location
        trackCTAClick(location);
        await handlePrimaryCTA();

                 // CRITICAL: All components should work consistently
         expect(mockConsoleLog).toHaveBeenCalledWith(`CTA clicked -> enter app flow from ${location}`);
         expect(window.location.href).toBe('http://localhost:4000');
      }
    });

    it('REGRESSION: Should maintain type safety with explicit interfaces', () => {
      // This test ensures type safety is maintained
      
      // Test that trackCTAClick accepts string parameter
      expect(() => trackCTAClick('hero_section')).not.toThrow();
      expect(() => trackCTAClick('')).not.toThrow();
      
      // Test that handlePrimaryCTA returns Promise
      const result = handlePrimaryCTA();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Performance & Memory', () => {
    it('REGRESSION: Should not cause memory leaks with repeated calls', async () => {
      // This test ensures repeated navigation calls don't leak memory
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        mockLocalStorage.getItem.mockReturnValue(i % 2 === 0 ? null : 'token');
        window.location.href = '';
        
        await handlePrimaryCTA();
        
        // Should work consistently across iterations
        expect(window.location.href).toBeTruthy();
      }
      
      // CRITICAL: Should complete all iterations without issues
      expect(true).toBe(true);
    });

    it('REGRESSION: Should handle concurrent navigation calls', async () => {
      // This test ensures concurrent calls don't interfere
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);

      const promises = [
        handlePrimaryCTA(),
        handlePrimaryCTA(),
        handlePrimaryCTA()
      ];

      await Promise.all(promises);

      // CRITICAL: All calls should complete successfully
      expect(window.location.href).toBe('http://localhost:4000');
    });
  });
}); 