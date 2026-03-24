import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useMobileDetection } from '../useMobileDetection';

// Mock window.innerWidth
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  window.addEventListener = mockAddEventListener;
  window.removeEventListener = mockRemoveEventListener;
});

describe('useMobileDetection', () => {
  describe('Device Type Detection', () => {
    it('should detect mobile device (< 768px)', () => {
      mockInnerWidth(500);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        viewportWidth: 500,
        shouldBlockEditor: true
      });
    });

    it('should detect small tablet (768px - 1023px)', () => {
      mockInnerWidth(800);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        viewportWidth: 800,
        shouldBlockEditor: true
      });
    });

    it('should detect large tablet/desktop (>= 1024px)', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        viewportWidth: 1200,
        shouldBlockEditor: false
      });
    });
  });

  describe('Breakpoint Edge Cases', () => {
    it('should correctly handle exact mobile breakpoint (767px)', () => {
      mockInnerWidth(767);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(true);
    });

    it('should correctly handle exact tablet breakpoint (768px)', () => {
      mockInnerWidth(768);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.isTablet).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(true);
    });

    it('should correctly handle exact desktop breakpoint (1024px)', () => {
      mockInnerWidth(1024);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(false);
    });

    it('should correctly handle large tablet edge case (1023px)', () => {
      mockInnerWidth(1023);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.isTablet).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('should add resize and orientationchange event listeners', () => {
      renderHook(() => useMobileDetection());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });

    it('should remove event listeners on cleanup', () => {
      const { unmount } = renderHook(() => useMobileDetection());
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });

  describe('Responsive Updates', () => {
    it('should update detection when window is resized', () => {
      mockInnerWidth(500);
      
      const { result } = renderHook(() => useMobileDetection());
      
      // Initially mobile
      expect(result.current.isMobile).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(true);
      
      // Simulate resize to desktop
      mockInnerWidth(1200);
      
      // Get the resize handler and call it
      const resizeHandler = mockAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      act(() => {
        if (resizeHandler) {
          (resizeHandler as () => void)();
        }
      });
      
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(false);
    });

    it('should handle orientation change with delay', () => {
      return new Promise<void>((resolve) => {
        mockInnerWidth(500);
        
        const { result } = renderHook(() => useMobileDetection());
        
        // Initially mobile
        expect(result.current.isMobile).toBe(true);
        
        // Simulate orientation change to landscape (wider)
        mockInnerWidth(800);
        
        // Get the orientation change handler
        const orientationHandler = mockAddEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'orientationchange'
        )?.[1];
        
        act(() => {
          if (orientationHandler) {
            (orientationHandler as () => void)();
          }
        });
        
        // Should update after 100ms delay
        setTimeout(() => {
          expect(result.current.isTablet).toBe(true);
          resolve();
        }, 150);
      });
    });
  });

  describe('Editor Blocking Logic', () => {
    it('should block editor for mobile devices', () => {
      mockInnerWidth(375); // iPhone size
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.shouldBlockEditor).toBe(true);
    });

    it('should block editor for small tablets', () => {
      mockInnerWidth(768); // iPad Mini portrait
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.shouldBlockEditor).toBe(true);
    });

    it('should allow editor for large tablets/desktops', () => {
      mockInnerWidth(1024); // iPad Pro landscape
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.shouldBlockEditor).toBe(false);
    });

    it('should allow editor for desktop screens', () => {
      mockInnerWidth(1920); // Desktop
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.shouldBlockEditor).toBe(false);
    });
  });

  describe('Console Logging', () => {
    it('should log detection changes', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockInnerWidth(500);
      renderHook(() => useMobileDetection());
      
      expect(consoleSpy).toHaveBeenCalledWith('📱 Mobile detection updated:', {
        width: 500,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldBlockEditor: true
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle undefined window gracefully', () => {
      // Mock SSR environment by temporarily removing window properties
      const originalInnerWidth = window.innerWidth;
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;
      
      // Create a minimal window mock for SSR
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'addEventListener', {
        value: vi.fn(),
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'removeEventListener', {
        value: vi.fn(),
        writable: true,
        configurable: true
      });
      
      const { result } = renderHook(() => useMobileDetection());
      
      // Should default to desktop behavior in SSR
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.shouldBlockEditor).toBe(false);
      
      // Restore original window properties
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'addEventListener', {
        value: originalAddEventListener,
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'removeEventListener', {
        value: originalRemoveEventListener,
        writable: true,
        configurable: true
      });
    });
  });
}); 