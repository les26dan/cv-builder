/**
 * @jest-environment jsdom
 */

import { handlePrimaryCTA, trackCTAClick } from './navigation';

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Mock window.location.href
const mockLocationAssign = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: mockLocationAssign,
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

describe('Navigation Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockLocationAssign.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockGtag.mockClear();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError);
    
    // Mock window.location.href setter
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: ''
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handlePrimaryCTA', () => {
    describe('unauthenticated users', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(null);
      });

      it('should route to CV Upload when no auth token exists', async () => {
        const originalHref = window.location.href;
        
        await handlePrimaryCTA();
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('auth_token');
        // Check that window.location.href was set
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should handle localStorage errors gracefully', async () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });

        await handlePrimaryCTA();
        
        expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should handle sessionStorage errors gracefully', async () => {
        mockSessionStorage.getItem.mockImplementation(() => {
          throw new Error('sessionStorage error');
        });

        await handlePrimaryCTA();
        
        expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should treat empty string tokens as unauthenticated', async () => {
        mockLocalStorage.getItem.mockReturnValue('');
        mockSessionStorage.getItem.mockReturnValue('');

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:4000');
      });
    });

    describe('authenticated users', () => {
      it('should route to Workspace when localStorage has auth token', async () => {
        mockLocalStorage.getItem.mockReturnValue('valid_token');
        mockSessionStorage.getItem.mockReturnValue(null);

        await handlePrimaryCTA();
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });

      it('should route to Workspace when sessionStorage has auth token', async () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue('valid_token');

        await handlePrimaryCTA();
        
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });

      it('should prioritize localStorage over sessionStorage', async () => {
        mockLocalStorage.getItem.mockReturnValue('localStorage_token');
        mockSessionStorage.getItem.mockReturnValue('sessionStorage_token');

        await handlePrimaryCTA();
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });

      it('should handle whitespace-only tokens as authenticated', async () => {
        mockLocalStorage.getItem.mockReturnValue('   ');
        mockSessionStorage.getItem.mockReturnValue('\t\n');

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });
    });

    describe('error handling', () => {
      it('should fallback to CV Upload on authentication check failure', async () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage access denied');
        });

        await handlePrimaryCTA();
        
        expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should handle general errors with fallback', async () => {
        // Mock a general error in the try block
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        await handlePrimaryCTA();
        
        expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
        expect(window.location.href).toBe('http://localhost:4000');
      });
    });

    describe('edge cases', () => {
      it('should handle null storage values', async () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(null);

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should handle undefined storage values', async () => {
        mockLocalStorage.getItem.mockReturnValue(undefined);
        mockSessionStorage.getItem.mockReturnValue(undefined);

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:4000');
      });

      it('should handle very long tokens', async () => {
        const longToken = 'a'.repeat(10000);
        mockLocalStorage.getItem.mockReturnValue(longToken);

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });

      it('should handle special characters in tokens', async () => {
        const specialToken = 'token@#$%^&*(){}[]|\\:";\'<>?,./-=+_';
        mockLocalStorage.getItem.mockReturnValue(specialToken);

        await handlePrimaryCTA();
        
        expect(window.location.href).toBe('http://localhost:3000/workspace');
      });
    });
  });

  describe('trackCTAClick', () => {
    it('should log CTA click with location', () => {
      trackCTAClick('hero_section');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from hero_section');
    });

    it('should call gtag when available', () => {
      trackCTAClick('problem_ats');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'problem_ats',
        custom_parameter: 'app_flow_entry'
      });
    });

    it('should handle missing gtag gracefully', () => {
      delete (window as any).gtag;
      
      trackCTAClick('problem_keywords');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from problem_keywords');
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle gtag errors gracefully', () => {
      mockGtag.mockImplementation(() => {
        throw new Error('gtag error');
      });

      trackCTAClick('problem_mass_cv');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error tracking CTA click:', expect.any(Error));
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from problem_mass_cv');
    });

    it('should handle empty location string', () => {
      trackCTAClick('');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from ');
    });

    it('should handle special characters in location', () => {
      const specialLocation = 'location@#$%^&*(){}[]|\\:";\'<>?,./-=+_';
      trackCTAClick(specialLocation);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(`CTA clicked -> enter app flow from ${specialLocation}`);
    });

    it('should handle very long location strings', () => {
      const longLocation = 'a'.repeat(1000);
      trackCTAClick(longLocation);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(`CTA clicked -> enter app flow from ${longLocation}`);
    });
  });

  describe('integration tests', () => {
    it('should handle complete user flow for new user', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);

      trackCTAClick('hero_section');
      await handlePrimaryCTA();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from hero_section');
      expect(window.location.href).toBe('http://localhost:4000');
    });

    it('should handle complete user flow for existing user', async () => {
      mockLocalStorage.getItem.mockReturnValue('existing_user_token');

      trackCTAClick('problem_ats');
      await handlePrimaryCTA();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('CTA clicked -> enter app flow from problem_ats');
      expect(window.location.href).toBe('http://localhost:3000/workspace');
    });

    it('should handle errors in complete flow gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      mockGtag.mockImplementation(() => {
        throw new Error('gtag error');
      });

      trackCTAClick('problem_cover_letters');
      await handlePrimaryCTA();
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error tracking CTA click:', expect.any(Error));
      expect(mockConsoleError).toHaveBeenCalledWith('Error checking auth status:', expect.any(Error));
      expect(window.location.href).toBe('http://localhost:4000');
    });
  });

  describe('type safety and constants', () => {
    it('should use correct URL constants', async () => {
      // Test unauthenticated flow
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      await handlePrimaryCTA();
      expect(window.location.href).toBe('http://localhost:4000');

      // Reset and test authenticated flow
      window.location.href = '';
      mockLocalStorage.getItem.mockReturnValue('token');
      await handlePrimaryCTA();
      expect(window.location.href).toBe('http://localhost:3000/workspace');
    });

    it('should handle string parameter types correctly', () => {
      const locations = ['hero_section', 'problem_ats', 'problem_keywords', 'problem_mass_cv', 'problem_cover_letters'];
      
      locations.forEach(location => {
        mockConsoleLog.mockClear();
        trackCTAClick(location);
        expect(mockConsoleLog).toHaveBeenCalledWith(`CTA clicked -> enter app flow from ${location}`);
      });
    });
  });
}); 